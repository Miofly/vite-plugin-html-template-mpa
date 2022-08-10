import type { HtmlTemplateMpaOptions } from '../types';
import { promises as fs } from 'fs';
import { template } from 'lodash';
import { ResolvedConfig } from 'vite';
import type { Options as MinifyOptions } from 'html-minifier-terser';
import { minify as minifyFn } from 'html-minifier-terser';

async function readHtmlTemplate(templatePath: string) {
  return await fs.readFile(templatePath, { encoding: 'utf8' });
}

interface Payload {
  pagesDir: string;
  pageName: string;
  templatePath: string;
  pageEntry: string;
  pageTitle: string;
  isMPA: boolean;
  data: HtmlTemplateMpaOptions['data'];
  entry: HtmlTemplateMpaOptions['entry'];
  extraData: {
    base: string;
    url: string;
  };
  input: any;
  pages: any;
  jumpTarget?: string;
  origin?: string;
  hasUnocss?: boolean;
  hasMpaPlugin?: boolean;
}

export async function getHtmlContent(payload: Payload) {
  const {
    pagesDir,
    templatePath,
    pageName,
    pageTitle,
    pageEntry,
    isMPA,
    data,
    entry,
    extraData,
    input,
    pages,
    jumpTarget,
    origin,
    hasMpaPlugin,
    hasUnocss
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

  // const links = Object.keys(input).map(item => {
  //   const href = !hasMpaPlugin ? `${origin}/${pagesDir}/${item}/index.html` : `${origin}/${item}/index.html`;
  //   return `<a target="${jumpTarget}" href="${href}">
  //     ${Object.keys(pages).map((subItem: any) => {
  //       if (subItem === item) {
  //         return pages[subItem].title;
  //       }
  //       return '';
  //   })}
  //     ${item}
  //     </a><br />`;
  // });

  // // const href = !hasMpaPlugin ? `${origin}/${pagesDir}/${item}/index.html` : `${origin}/${item}/index.html`;
  //     return `${Object.keys(pages).map((subItem: any) => {
  //       if (subItem === item) {
  //         return `<a target="${jumpTarget}" href="${href}${pages[subItem].params ? '?' + pages[subItem].params : ''}">${pages[subItem].title || ''}${item}</a><br />`;
  //       }
  //       return `
  //     <a target="${jumpTarget}" href="${href}">${item}</a><br />`;
  //     })}`;

  const inputKeys = Object.keys(input || {});
  const pagesKeys = Object.keys(pages);

  function getHref(item: string, params?: string) {
    const _params = params ? '?' + params : '';
    return !hasMpaPlugin
      ? `${origin}/${pagesDir}/${item}/index.html${_params}`
      : `${origin}/${item}/index.html${_params}`;
  }

  const links = inputKeys.map((item) => {
    if (pagesKeys.includes(item)) {
      const href = getHref(item, pages[item].urlParams);
      return `<a target="${jumpTarget}" href="${href}">${pages[item].title || ''} ${item}</a><br />`;
    }
    return `<a target="${jumpTarget}" href="${getHref(item)}">${item}</a><br />`;
  });

  // 对主页 or / 的 index.html 进行 content 内容替换
  if (pageName === 'index') {
    if (hasUnocss) {
      content = content.replace(
        '</body>',
        `${links.join('').replace(/,/g, ' ')}
    <script type="module">import 'uno.css';</script>\n</body>`
      );
    } else {
      content = content.replace('</body>', `${links.join('').replace(/,/g, ' ')}\n</body>`);
    }
  } else {
    content = content.replace('</body>', `<script type="module" src="${entryJsPath}"></script></body>`);
  }

  const compiled = template(content);

  const context = {
    htmlWebpackPlugin: {
      options: {
        title: pageTitle
      },
      tags: {
        headTags: [],
        bodyTags: []
      },
      files: {
        publicPath: extraData.base,
        js: [],
        css: [],
        manifest: '',
        favicon: ''
      }
    },
    webpackConfig: {
      name: pageTitle,
      output: {
        publicPath: extraData.base
      }
    },
    BASE_URL: extraData.base,
    ...process.env,
    ...data,
    title: pageTitle || data?.title
  };
  return compiled({
    ...context
  });
}

export function dfs(keys: string[], value: any, res: Record<string, any>) {
  if (keys.length) {
    const strItem = keys.shift();
    if (!keys.length) {
      res[strItem!] = value;
    } else {
      const tmp = res[strItem!] ? res[strItem!] : (res[strItem!] = {});
      dfs(keys, value, tmp);
    }
  }
  return res;
}

export function dfs2(rebuildData: Record<string, any>, key: string, value: Record<string, any>) {
  const tmp = rebuildData[key] ? rebuildData[key] : (rebuildData[key] = {});
  if (Object.prototype.toString.call(value).slice(8, -1) === 'Object') {
    const nextKey = Object.keys(value)[0];
    dfs2(tmp, nextKey, value[nextKey]);
  } else {
    rebuildData[key] = value;
  }
}

export function isMpa(viteConfig: ResolvedConfig) {
  const input = viteConfig?.build?.rollupOptions?.input ?? undefined;
  return typeof input !== 'string' && Object.keys(input || {}).length >= 1;
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
    minifyCSS: minify
  };
}

export async function minifyHtml(html: string, minify: boolean | MinifyOptions) {
  if (typeof minify === 'boolean' && !minify) {
    return html;
  }

  let minifyOptions: boolean | MinifyOptions = minify;

  if (typeof minify === 'boolean' && minify) {
    minifyOptions = getOptions(minify);
  }

  return await minifyFn(html, minifyOptions as MinifyOptions);
}
