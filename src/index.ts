import { createHash } from 'crypto';
import path from 'path';
import type { OutputOptions } from 'rollup';
import shell from 'shelljs';
import { normalizePath } from 'vite';
import fs from 'fs-extra';
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import { name } from '../package.json';
import type { HtmlTemplateMpaOptions, PageOptions } from './types';
import {
  getHtmlContent,
  isMpa,
  isPlainObject,
  last,
  minifyHtml,
  pick,
} from './utils';

const resolve = (p: string) => path.resolve(process.cwd(), p);

const PREFIX = 'src';

const uniqueHash = createHash('sha256')
  .update(String(new Date().getTime()))
  .digest('hex')
  .substring(0, 16);

const isEmptyObject = <T = unknown>(val?: T): val is T =>
  isPlainObject(val) && Object.getOwnPropertyNames(val).length === 0;

const getPageData = (options: HtmlTemplateMpaOptions, pageName: string) => {
  let page: PageOptions = {};

  const commonOptions: PageOptions = pick(options, [
    'template',
    'title',
    'entry',
    'filename',
    'urlParams',
    'inject',
  ]);

  const isSpa = isEmptyObject(options.pages);

  if (isSpa) {
    return commonOptions;
  } else {
    page = { ...commonOptions, ...options.pages[pageName] } || {};

    return page;
  }
};

let pageName;

export default function htmlTemplate(
  userOptions: HtmlTemplateMpaOptions = {},
): Plugin {
  const options: HtmlTemplateMpaOptions = {
    pagesDir: 'src/views',
    pages: {},
    jumpTarget: '_self',
    buildCfg: {
      moveHtmlTop: true,
      moveHtmlDirTop: false,
      buildPrefixName: '',
      htmlHash: false,
      buildAssetDirName: '',
      buildChunkDirName: '',
      buildEntryDirName: '',
      htmlPrefixSearchValue: '',
      htmlPrefixReplaceValue: '',
    },
    minify: true,
    ...userOptions,
  };

  let config: ResolvedConfig;
  return {
    enforce: 'post',
    name,
    configResolved(resolvedConfig) {
      const isBuild = resolvedConfig.mode === 'production';
      const {
        buildPrefixName,
        htmlHash,
        buildAssetDirName,
        buildChunkDirName,
        buildEntryDirName,
      } = options.buildCfg;
      const assetDir = resolvedConfig.build.assetsDir || 'assets';

      if (isMpa(resolvedConfig)) {
        const _output = resolvedConfig.build.rollupOptions
          .output as OutputOptions;

        if (buildPrefixName) {
          const _input = {} as any;
          const rollupInput = resolvedConfig.build.rollupOptions.input as any;
          Object.keys(rollupInput).map(key => {
            _input[((isBuild ? buildPrefixName : '') || '') + key] =
              rollupInput[key];
          });
          resolvedConfig.build.rollupOptions.input = _input;
        }

        if (htmlHash) {
          const buildAssets = {
            entryFileNames: `${assetDir}/[name].js`,
            chunkFileNames: `${assetDir}/[name].js`,
            assetFileNames: `${assetDir}/[name].[ext]`,
          };

          const buildOutput = resolvedConfig.build.rollupOptions.output;

          if (buildOutput) {
            resolvedConfig.build.rollupOptions.output = {
              ...buildOutput,
              ...buildAssets,
            };
          } else {
            resolvedConfig.build.rollupOptions.output = buildAssets;
          }
        }

        if (buildAssetDirName) {
          if (htmlHash || !String(_output.assetFileNames)?.includes('[hash]')) {
            _output.assetFileNames = `${assetDir}/${buildAssetDirName}/[name].[ext]`;
          } else {
            _output.assetFileNames = `${assetDir}/${buildAssetDirName}/[name]-[hash].[ext]`;
          }
        }

        if (buildChunkDirName) {
          if (htmlHash || !String(_output.chunkFileNames)?.includes('[hash]')) {
            _output.chunkFileNames = `${assetDir}/${buildChunkDirName}/[name].js`;
          } else {
            _output.chunkFileNames = `${assetDir}/${buildChunkDirName}/[name]-[hash].js`;
          }
        }

        if (buildEntryDirName) {
          if (htmlHash || !String(_output.entryFileNames)?.includes('[hash]')) {
            _output.entryFileNames = `${assetDir}/${buildEntryDirName}/[name].js`;
          } else {
            _output.entryFileNames = `${assetDir}/${buildEntryDirName}/[name]-[hash].js`;
          }
        }

        resolvedConfig.build.rollupOptions.output = {
          ...resolvedConfig.build.rollupOptions.output,
          ..._output,
        };
      } else if (
        !isBuild &&
        options.template &&
        !resolvedConfig.build.rollupOptions.input
      ) {
        resolvedConfig.build.rollupOptions.input = {
          main: path.resolve(resolvedConfig.root, options.template),
        };
      }

      config = resolvedConfig;
    },
    configureServer(server: ViteDevServer) {
      return () => {
        console.log('====');
        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.endsWith('.html') && req.url !== '/') {
            return next();
          }

          const url = options.pagesDir + req.originalUrl;

          pageName = (() => {
            if (url === '/') {
              return 'index';
            }
            return (
              url.match(new RegExp(`${options.pagesDir}/(.*)/`))?.[1] || 'index'
            );
          })();

          const page = getPageData(options, pageName);

          const templateOption = page.template;

          // 若自定义了 template 则取自定义否则
          const templatePath = templateOption
            ? resolve(templateOption)
            : isMpa(config)
              ? resolve('public/index.html')
              : resolve('index.html');

          let content = await getHtmlContent({
            pagesDir: options.pagesDir,
            pageName,
            templatePath,
            pageEntry: page.entry || 'main',
            pageTitle: page.title || '',
            injectOptions: page.inject,
            isMPA: isMpa(config),
            entry: options.entry || '/src/main',
            extraData: {
              base: config.base,
              url,
            },
            input: config.build.rollupOptions.input,
            pages: options.pages,
            jumpTarget: options.jumpTarget,
          });

          content = await server.transformIndexHtml?.(
            url,
            content,
            req.originalUrl,
          );

          res.end(content);
        });
      };
    },
    resolveId(id) {
      if (id.endsWith('.html')) {
        id = normalizePath(id);
        if (!isMpa(config)) {
          /**
           * id: /project-path/project-name/index.html
           * => src/index.html
           */
          return `${PREFIX}/${path.basename(id)}`;
        } else {
          /**
           * input example
           * {
           *   'test-one': '/project-path/project-name/src/views/test-one/index.html',
           *   'test-two': '/project-path/project-name/src/views/test-two/index.html',
           *   'test-three': '/project-path/project-name/src/views/test-twos/index.html'
           * }
           *
           * pageName: test-one id: '/project-path/project-name/src/views/test-one/index.html',
           */
          pageName = last(path.dirname(id).split('/')) || '';

          const inputPages = config.build.rollupOptions.input;

          /**
           * src/views/test-one/index.html
           * src/views/test-two/index.html
           * src/views/test-twos/index.html
           */
          for (const key in inputPages as Record<string, any>) {
            const _key = normalizePath(key);
            if (inputPages?.[_key] === id) {
              return `${PREFIX}/${options.pagesDir.replace(
                'src/',
                '',
              )}/${pageName}/index.html`;
            }
          }
        }
      }
      return null;
    },
    load(id) {
      if (id.endsWith('.html')) {
        /**
         * id: example
         * src/views/test-one/index.html
         * src/views/test-two/index.html
         * src/views/test-twos/index.html
         */
        id = normalizePath(id);

        // /views/test-twos/index.html
        const idNoPrefix = id.slice(PREFIX.length);

        // test-one
        // test-two
        pageName = path
          .dirname(id)
          .split(options.pagesDir)[1]
          .replace(/\//g, '');

        const page = getPageData(options, pageName);

        // index.html 默认的位置
        const publicIndexHtml = resolve('public/index.html');
        const indexHtml = resolve('index.html');

        const templateOption = page.template;
        const templatePath = templateOption
          ? resolve(templateOption)
          : fs.existsSync(publicIndexHtml)
            ? publicIndexHtml
            : indexHtml;

        return getHtmlContent({
          pagesDir: options.pagesDir,
          pageName,
          templatePath,
          pageEntry: page.entry || 'main',
          entry: options.entry || '/src/main',
          pageTitle: page.title || '',
          isMPA: isMpa(config),
          /**
           * { base: '/', url: '/views/test-one/index.html' }
           * { base: '/', url: '/views/test-two/index.html' }
           * { base: '/', url: '/views/test-twos/index.html' }
           */
          extraData: {
            base: config.base,
            url: isMpa(config) ? idNoPrefix : '/',
          },
          injectOptions: page.inject,
          input: config.build.rollupOptions.input,
          pages: options.pages,
        });
      }
      return null;
    },
    transformIndexHtml(data) {
      const page = getPageData(options, pageName);
      return {
        html: data,
        tags: page.inject?.tags || [],
      };
    },
    async generateBundle(_, bundle) {
      const htmlFiles = Object.keys(bundle).filter(i => i.endsWith('.html'));

      for (const item of htmlFiles) {
        const htmlChunk = bundle[item] as any;
        const { moveHtmlTop, moveHtmlDirTop, buildPrefixName, htmlHash } =
          options.buildCfg;
        const _pageName = htmlChunk.fileName.replace(/\\/g, '/').split('/');
        const htmlName =
          (buildPrefixName || '') + _pageName[_pageName.length - 2];

        if (htmlChunk) {
          let _source = htmlChunk.source;

          if (htmlHash) {
            _source = htmlChunk.source
              .replace(/\.js/g, `.js?${uniqueHash}`)
              .replace(/.css/g, `.css?${uniqueHash}`);
          }
          if (options.minify) {
            htmlChunk.source = await minifyHtml(_source, options.minify);
          } else {
            htmlChunk.source = _source;
          }

          if (options?.buildCfg?.htmlPrefixSearchValue) {
            htmlChunk.source = htmlChunk.source.replace(
              new RegExp(options.buildCfg.htmlPrefixSearchValue, 'g'),
              options?.buildCfg?.htmlPrefixReplaceValue || '',
            );
          }
        }

        if (isMpa(config)) {
          if (moveHtmlTop) {
            htmlChunk.fileName = htmlName + '.html';
          } else if (moveHtmlDirTop) {
            htmlChunk.fileName = htmlName + '/index.html';
          }
        } else {
          htmlChunk.fileName = 'index.html';
        }
      }
    },
    closeBundle() {
      if (isMpa(config)) {
        shell.rm(
          '-rf',
          resolve(`${config.build?.outDir || 'dist'}/index.html`),
        );
      }
    },
  };
}

export type { HtmlTemplateMpaOptions };
