import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import type { UserOptions } from './lib/options';
import path from 'path';
import shell from 'shelljs';
import { last } from 'lodash';
import { dfs, dfs2, getHtmlContent } from './lib/utils';
import { name } from '../package.json';

const resolve = (p: string) => path.resolve(process.cwd(), p);

const PREFIX = 'src';
const isWin32 = require('os').platform() === 'win32';

export default function htmlTemplate (userOptions: UserOptions = {}): Plugin {
  const options = {
    pagesDir: 'src/pages',
    pages: {},
    data: {},
    jumpTarget: '_self',
    ...userOptions
  };
  
  if (options.data) {
    const rebuildData = {};
    Object.keys(options.data).forEach((key) => {
      const value = options.data[key];
      if (key.includes('.')) {
        const keys = key.split('.');
        dfs(keys, value, rebuildData);
      } else {
        dfs2(rebuildData, key, value);
      }
    });
    console.log(rebuildData, '----');
    options.data = rebuildData;
  }
  let config: ResolvedConfig;
  return {
    name,
    configResolved (resolvedConfig) {
      config = resolvedConfig;
    },
    /**
     * for dev
     * if SPA, just use template and write script main.{js,ts} for /{entry}.html
     * if MPA, check pageName(default is index) and write /${pagesDir}/{pageName}/${entry}.html
     */
    configureServer (server: ViteDevServer) {
      return () => {
        server.middlewares.use(async(req, res, next) => {
          if (!req.url?.endsWith('.html') && req.url !== '/') {
            return next();
          }
          const url = req.url;
          
          const pageName = (() => {
            if (url === '/') {
              return 'index';
            }
            return url.match(new RegExp(`${options.pagesDir}/(.*)/`))?.[1] || 'index';
          })();
          
          const httpName = config.server.https ? 'https://' : 'http://';
          
          // options.pages 用户对每个页面的独立配置
          const page = options.pages[pageName] || {};
          
          // 获取用户自定义的模板页面
          const templateOption = page.template;
          // 模板路径
          const templatePath = templateOption
            ? resolve(templateOption)
            : resolve('public/index.html');
          // 判断是否为多页面入口
          const isMPA =
            typeof config.build.rollupOptions.input !== 'string' &&
            Object.keys(config.build.rollupOptions.input || {}).length > 0;
          //
          let content = await getHtmlContent({
            pagesDir: options.pagesDir,
            pageName,
            templatePath,
            pageEntry: page.entry || 'main',
            pageTitle: page.title || 'Home Page',
            isMPA,
            data: options.data,
            entry: options.entry || '/src/main',
            extraData: {
              base: config.base,
              url
            },
            input: config.build.rollupOptions.input,
            pages: options.pages,
            jumpTarget: options.jumpTarget,
            hasUnocss: JSON.stringify(config.plugins).includes('unocss'),
            hasMpaPlugin: JSON.stringify(config.plugins).includes('vite-plugin-multi-pages-entry'),
            origin: httpName + req.headers.host
          });
          
          // using vite's transform html function to add basic html support
          content = await server.transformIndexHtml?.(url, content, req.originalUrl);
          
          res.end(content);
        });
      };
    },
    /**
     * for dev
     * @see {@link https://github.com/rollup/plugins/blob/master/packages/virtual/src/index.ts}
     */
    resolveId (id) {
      if (id.endsWith('.html')) {
        const isMPA =
          typeof config.build.rollupOptions.input !== 'string' &&
          Object.keys(config.build.rollupOptions.input || {}).length > 0;
        if (!isMPA) {
          return `${PREFIX}/${path.basename(id)}`;
        } else {
          const pageName = last(path.dirname(id).split(isWin32 ? '\\' : '/')) || '';
          for (const key in config.build.rollupOptions.input as any) {
            if ((config.build.rollupOptions.input as any)?.[key] === id) {
              return isWin32
                ? id.replace(/\\/g, '/')
                : `${PREFIX}/${options.pagesDir.replace('src/', '')}/${pageName}/index.html`;
            }
          }
        
          // if (pageName in (config.build.rollupOptions.input as any)) {
          //    const test = isWin32
          //      ? id.replace(/\\/g, '/')
          //      : `${PREFIX}/${options.pagesDir.replace('src/', '')}/${pageName}/index.html`;
          //    console.log(test);
          //   return test
          // }
        }
      }
      return null;
    },
    /** for dev */
    load (id) {
      if (
        isWin32
          ? id.startsWith(resolve('').replace(/\\/g, '/')) && id.endsWith('.html')
          : id.startsWith(PREFIX)
      ) {
        const idNoPrefix = id.slice(PREFIX.length);
        // resolveId checked isWin32 already
        const pageName = last(path.dirname(id).split('/')) || '';
        
        const page = options.pages[pageName] || {};
        const templateOption = page.template;
        const templatePath = templateOption ? resolve(templateOption) : resolve('public/index.html');
        const isMPA =
          typeof config.build?.rollupOptions.input !== 'string' &&
          Object.keys(config.build?.rollupOptions.input || {}).length > 0;
        
        return getHtmlContent({
          pagesDir: options.pagesDir,
          // pageName: pageName.replace(options.prefixName, ''),
          pageName,
          templatePath,
          pageEntry: page.entry || 'main',
          pageTitle: page.title || 'Home Page',
          isMPA,
          extraData: {
            base: config.base,
            url: isMPA ? idNoPrefix : '/'
          },
          data: options.data,
          entry: options.entry || '/src/main',
          input: config.build.rollupOptions.input,
          pages: options.pages
        });
      }
      return null;
    },
    /** for build */
    closeBundle () {
      const isMPA =
        typeof config.build?.rollupOptions.input !== 'string' &&
        Object.keys(config.build?.rollupOptions.input || {}).length > 0;
      // MPA handled by vite-plugin-mpa
      if (!isMPA) {
        const root = config.root || process.cwd();
        const dest = (config.build && config.build.outDir) || 'dist';
        const resolve = (p: string) => path.resolve(root, p);
        
        // 1. move src/*.html to dest root
        shell.mv(resolve(`${dest}/${PREFIX}/*.html`), resolve(dest));
        // 2. remove empty src dir
        shell.rm('-rf', resolve(`${dest}/${PREFIX}`));
      }
    }
  };
}

export type { UserOptions as HtmlTemplateOptions };
