import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import type { HtmlTemplateMpaOptions, PageOptions } from './types';
import path from 'path';
import shell from 'shelljs';
import { isPlainObject, last, pick } from 'lodash';
import { getHtmlContent, isMpa, minifyHtml } from './utils';
import { name } from '../package.json';
import { createHash } from 'crypto';
import type { OutputOptions } from 'rollup';

const resolve = (p: string) => path.resolve(process.cwd(), p);

const PREFIX = 'src';
const isWin32 = false;
const uniqueHash = createHash('sha256')
  .update(String(new Date().getTime()))
  .digest('hex')
  .substring(0, 16);

const isEmptyObject = <T = unknown>(val?: T): val is T =>
  isPlainObject(val) && Object.getOwnPropertyNames(val).length === 0;

const getPageData = (options, pageName) => {
  let page: PageOptions = {};
  const isSpa = isEmptyObject(options.pages);

  if (isSpa) {
    page = pick(options, [
      'template',
      'title',
      'entry',
      'filename',
      'urlParams',
      'inject',
    ]);
  } else {
    page = options.pages[pageName] || {};
  }

  return page;
};

export default function htmlTemplate(
  userOptions: HtmlTemplateMpaOptions = {},
): Plugin {
  const options = {
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
          ...(resolvedConfig.build.rollupOptions.output as any),
          ..._output,
        };
      }
      config = resolvedConfig;
    },
    configureServer(server: ViteDevServer) {
      return () => {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.endsWith('.html') && req.url !== '/') {
            return next();
          }

          // Todo
          const url = options.pagesDir + req.originalUrl;

          const pageName = (() => {
            if (url === '/') {
              return 'index';
            }
            return (
              url.match(new RegExp(`${options.pagesDir}/(.*)/`))?.[1] || 'index'
            );
          })();

          const page = getPageData(options, pageName);

          const templateOption = page.template;

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
        if (!isMpa(config)) {
          return `${PREFIX}/${path.basename(id)}`;
        } else {
          const pageName =
            last(path.dirname(id).split(isWin32 ? '\\' : '/')) || '';

          const _inputCfg: any = config.build.rollupOptions.input;

          for (const key in _inputCfg) {
            if (_inputCfg?.[key] === id) {
              return isWin32
                ? id.replace(/\\/g, '/')
                : `${PREFIX}/${options.pagesDir.replace(
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
      if (
        isWin32
          ? id.startsWith(resolve('').replace(/\\/g, '/')) &&
            id.endsWith('.html')
          : id.endsWith('.html')
      ) {
        const idNoPrefix = id.slice(PREFIX.length);
        const pageName = last(path.dirname(id).split('/')) || '';

        const page = getPageData(options, pageName);

        const templateOption = page.template;
        const templatePath = templateOption
          ? resolve(templateOption)
          : isMpa(config)
            ? resolve('public/index.html')
            : resolve('index.html');

        return getHtmlContent({
          pagesDir: options.pagesDir,
          pageName,
          templatePath,
          pageEntry: page.entry || 'main',
          pageTitle: page.title || '',
          isMPA: isMpa(config),
          extraData: {
            base: config.base,
            url: isMpa(config) ? idNoPrefix : '/',
          },
          injectOptions: page.inject,
          entry: options.entry || '/src/main',
          input: config.build.rollupOptions.input,
          pages: options.pages,
        });
      }
      return null;
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
      const dest = (config.build && config.build.outDir) || 'dist';
      if (isMpa(config)) {
        shell.rm('-rf', resolve(`${dest}/index.html`));
      }
    },
  };
}

export type { HtmlTemplateMpaOptions };
