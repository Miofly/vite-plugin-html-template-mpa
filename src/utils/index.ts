import type { HtmlTemplateMpaOptions } from '../types';
import { promises as fs } from 'fs';
import type { ResolvedConfig } from 'vite';
import type { Options as MinifyOptions } from 'html-minifier-terser';
import { minify as minifyFn } from 'html-minifier-terser';
import { render } from 'ejs';
import { type InjectOptions } from '../types';

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
  entry: HtmlTemplateMpaOptions['entry'];
  extraData: {
    base: string;
    url: string;
  };
  input: any;
  pages: any;
  jumpTarget?: string;
  hasUnocss?: boolean;
  hasMpaPlugin?: boolean;
  injectOptions?: InjectOptions;
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
    hasMpaPlugin,
    hasUnocss,
    injectOptions,
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
      ? `/${pagesDir}/${item}/index.html${_params}`
      : `/${item}/index.html${_params}`;
  }

  const links = inputKeys.map(item => {
    if (pagesKeys.includes(item)) {
      const href = getHref(item, pages[item].urlParams);
      return `<a target="${jumpTarget}" href="${href}">${
        pages[item].title || ''
      } ${item}</a><br />`;
    }
    return `<a target="${jumpTarget}" href="${getHref(
      item,
    )}">${item}</a><br />`;
  });

  // 对主页 or / 的 index.html 进行 content 内容替换
  if (pageName === 'index') {
    if (hasUnocss) {
      content = content.replace(
        '</body>',
        `${links.join('').replace(/,/g, ' ')}
    <script type="module">import 'uno.css';</script>\n</body>`,
      );
    } else {
      content = content.replace(
        '</body>',
        `${links.join('').replace(/,/g, ' ')}\n</body>`,
      );
    }

    // content = content.replace(/<%-.*%>/g, '');
  } else {
    content = content.replace(
      '</body>',
      `<script type="module" src="${entryJsPath}"></script></body>`,
    );
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
