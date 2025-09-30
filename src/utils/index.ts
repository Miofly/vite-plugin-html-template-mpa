import { render } from 'ejs';
import { promises as fs } from 'fs';
import type { Options as MinifyOptions } from 'html-minifier-terser';
import { minify as minifyFn } from 'html-minifier-terser';
import type { ResolvedConfig } from 'vite';
import type { HtmlTemplateMpaOptions } from '../types';
import { type InjectOptions } from '../types';

async function readHtmlTemplate(templatePath: string) {
  return await fs.readFile(templatePath, { encoding: 'utf8' });
}

interface Payload {
  /** 页面文件夹位置 */
  pagesDir: string;
  /** 多页面目录的名称 */
  pageName: string;
  /** 模版位置 */
  templatePath: string;
  /** 入口文件如 main.ts */
  pageEntry: string;
  pageTitle: string;
  /** 兜底 main.ts 入口 */
  entry: HtmlTemplateMpaOptions['entry'];
  addEntryScript?: boolean;
  mpaAutoAddMainTs?: boolean;
  extraData: {
    base: string;
    url: string;
  };
  input: any;
  pages: any;
  jumpTarget?: string;
  injectOptions?: InjectOptions;
  isMPA: boolean;
  onlyUseEjsAndMinify?: boolean;
  UseEjsAnd?: boolean,
}

export async function getHtmlContent(payload: Payload) {
  const {
    pagesDir,
    templatePath,
    pageName,
    pageTitle,
    pageEntry,
    isMPA,
    entry,
    extraData,
    input,
    pages,
    jumpTarget,
    injectOptions,
    addEntryScript,
    mpaAutoAddMainTs,
    onlyUseEjsAndMinify,
  } = payload;
  let content = '';

  /**
   * 最后生成
   * - /src/pages/test-one/main
   * - /src/pages/index/main
   */
  const entryJsPath = (() => {
    if (isMPA) {
      if (pageEntry.includes('src')) {
        return `/${pageEntry.replace('/./', '/').replace('//', '/')}`;
      }
      return ['/', '/index.html'].includes(extraData.url)
        ? `/${pagesDir}/index/${pageEntry}`
        : `/${pagesDir}/${pageName}/${pageEntry}`;
    }
    return entry;
  })();

  try {
    content = await readHtmlTemplate(templatePath);
  } catch (e) {
    console.error(e);
  }

  const inputKeys = typeof input === 'string' ? [] : Object.keys(input || {});
  const pagesKeys = Object.keys(pages || {});

  function getHref(item: string, params?: string) {
    const _params = params ? '?' + params : '';
    return !isMPA
      ? `/${pagesDir}/${item}/index.html${_params}`
      : `/${item}/index.html${_params}`;
  }

  const links =
    inputKeys?.length > 1
      ? inputKeys.map(item => {
          if (pagesKeys.includes(item)) {
            const href = getHref(item, pages[item].urlParams);
            return `<a target="${jumpTarget}" href="${href}">${
              pages[item].title || ''
            } ${item}</a><br />`;
          }
          return `<a target="${jumpTarget}" href="${getHref(
            item,
          )}">${item}</a><br />`;
        })
      : [];

  if (!onlyUseEjsAndMinify) {
    // 对主页 or / 的 index.html 进行 content 内容替换
    if (pageName === 'index' && links?.length) {
      content = content.replace(
        '</body>',
        `${links.join('').replace(/,/g, ' ')}\n</body>`,
      );
    } else if ((isMPA && mpaAutoAddMainTs) || addEntryScript) {
      content = content.replace(
        '</body>',
        `<script type="module" src="${entryJsPath}"></script></body>`,
      );
    }
  }

  const { data, ejsOptions } = injectOptions || {
    data: {},
    ejsOptions: {},
  };

  return await render(
    content,
    {
      title: pageTitle || '',
      ...data,
    },
    ejsOptions,
  );
}

// 是否为多页应用
export function isMpa(viteConfig: ResolvedConfig) {
  const input = viteConfig?.build?.rollupOptions?.input ?? undefined;
  return typeof input !== 'string' && Object.keys(input || {}).length > 1;
}

function getOptions(minify: boolean): MinifyOptions {
  return {
    collapseWhitespace: minify,
    keepClosingSlash: minify,
    removeComments: minify,
    removeRedundantAttributes: minify,
    removeScriptTypeAttributes: minify,
    removeStyleLinkTypeAttributes: minify,
    useShortDoctype: minify,
    minifyCSS: minify,
  };
}

export async function minifyHtml(
  html: string,
  minify: boolean | MinifyOptions,
) {
  if (typeof minify === 'boolean' && !minify) {
    return html;
  }

  let minifyOptions: boolean | MinifyOptions = minify;

  if (typeof minify === 'boolean' && minify) {
    minifyOptions = getOptions(minify);
  }

  return await minifyFn(html, minifyOptions as MinifyOptions);
}

export function isPlainObject(value) {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}

export function pick(obj, keys) {
  return keys.reduce((acc, key) => {
    if (obj.hasOwnProperty(key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
}

export function last(array) {
  if (!Array.isArray(array) || array.length === 0) {
    return undefined;
  }

  return array[array.length - 1];
}
