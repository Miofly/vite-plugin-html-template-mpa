# vite-plugin-html-template-mpa

**English** | [中文](./README.zh_CN.md)

## Important Update

- Since the 'vite-plugin-html' plugin is no longer maintained, there will be a warning when the 'vite 5.0' version is launched, so this plugin is compatible with the functionality of this plugin in single-page applications.
- The 'API' related to version '> 1.0.0' has been adjusted, please note that the latest version already supports 'Vite 5.0.0'.

> The default value of 'pagesDir' for multi-page apps has been adjusted to 'src/views', if you have problems using multi-page apps, please use it with 'vite-plugin-multi-pages'

## Features

- HTML compression capability
- Single page and multi page application support
- Support customization `entry`、`template`
- Support multi page applications to generate home pages, including jump paths of all pages
- The support packaging directory has changed its' HTML 'name and path
- support resource addition hash in html pages

## How to use

### Install

```sh
yarn add vite-plugin-html-template-mpa
# or
pnpm add vite-plugin-html-template-mpa
```

### Usage

Single page application
**vite.config.ts**

```typescript
import htmlTemplate from 'vite-plugin-html-template-mpa';

export default defineConfig({
  plugins: [
    htmlTemplate({
      minify: true,
      inject: {
        data: {
          title: 'title text',
          injectScript: `<script src="https://cdn.bootcdn.net/ajax/libs/echarts/5.4.3/echarts.common.js"></script>`,
        },
        tags: [
          {
            injectTo: 'body-prepend',
            tag: 'div',
            attrs: {
              id: 'tag',
            },
          },
        ],
      },
    }),
  ],
});
```

Multi page application
**vite.config.ts**

```typescript
import htmlTemplate from 'vite-plugin-html-template-mpa';

export default defineConfig({
  plugins: [
    htmlTemplate({
      pagesDir: 'src/views',
      pages: {
        'test-one': {
          title: 'testTitle',
          urlParams: 'id=33',
        },
        'test-twos': {
          urlParams: 'id=33',
          inject: {
            data: {
              title: 'title text',
              injectScript: `<script src="https://cdn.bootcdn.net/ajax/libs/echarts/5.4.3/echarts.common.js"></script>`,
            },
            tags: [
              {
                injectTo: 'body-prepend',
                tag: 'div',
                attrs: {
                  id: 'tag',
                },
              },
            ],
          },
        },
      },
      buildCfg: {
        moveHtmlTop: true,
        moveHtmlDirTop: false,
        buildPrefixName: '',
        htmlHash: true,
      },
      data: {
        title: 'defaultTitle',
      },
    }),
  ],
});
```

## Options

page application parameters

```typescript
export type PageOptions = {
  /**
   * @default public/index.html
   */
  template?: string;
  /**
   * page title
   * @default 'Home Page'
   */
  title?: string;
  /**
   * entry file
   */
  entry?: string;
  /**
   * template file
   * @default '${pageName}/index.html' at dest
   */
  filename?: string;
  /**
   * add parameters to the root page link
   * @example id=12323&token=0000
   */
  urlParams?: string;
  /**
   * @description inject options
   */
  inject?: InjectOptions;
}
```

```typescript
export interface Options {
  /**
   * multi page application directory
   * @default src/pages
   */
  pagesDir: string;
  /**
   * multi page application configuration
   * @see {@link https://cli.vuejs.org/config/#pages}
   */
  pages: {
    [pageName: string]: PageOptions;
  };
  /**
   * @default '/src/main'
   */
  entry?: string;
  /**
   * multi page application home page jump mode
   */
  jumpTarget?: '_self' | '_blank';
  buildCfg: {
    /**
     * generate multi page application add prefix
     * @default '' | string
     */
    buildPrefixName?: string;
    /**
     * The generated index HTML to the top, and index Rename HTML to multi page application name html
     * @default true
     */
    moveHtmlTop?: boolean;
    /**
     * The generated index The parent directory of HTML is promoted to the top level
     * @default false
     */
    moveHtmlDirTop?: boolean;
    /**
     * Add a hash to the resources in the generated HTML file
     * @default false
     */
    htmlHash?: boolean;
    /**
     * build asset dir add name
     */
    buildAssetDirName: string;
    /**
     * build chunk dir add name
     */
    buildChunkDirName: string;
    /**
     * build entry dir add name
     */
    buildEntryDirName: string;
    /**
     * To replace the original string in the generated html (mainly packaged base path processing)
     */
    htmlPrefixSearchValue?: string;
    /**
     * replace string
     */
    htmlPrefixReplaceValue?: string;
  };
  /**
   * Minimize options
   * @default true
   */
  minify?: MinifyOptions | boolean;
}
```

### default compression configuration

```
collapseWhitespace: true,
keepClosingSlash: true,
removeComments: true,
removeRedundantAttributes: true,
removeScriptTypeAttributes: true,
removeStyleLinkTypeAttributes: true,
useShortDoctype: true,
minifyCSS: true,
```

### ejs usage example

Since not all pages are injected into EJS variables for multi-page applications, the variables can be written as follows

```
<%if(typeof injectScript !== 'undefined'){%><%-injectScript%><%}%>
```

```javascript
htmlTemplate({
  pages: {
    'app-nine': {
      title: 'test',
      /** Parameters after splicing to URL */
      urlParams: 'id=211212&token=00000',
      // To inject some JS into the template HTML
      // in public/index.hmtl add the required location <%if(typeof injectScript !== 'undefined'){%><%-injectScript%><%}%>
      inject: {
        data: {
          // This is the variable name (custom) to be injected in the template, mainly in the index : hmtl inserting variables
          injectScript:
            '<script src="static/pro-template/js/test-one-11c3eaa8.js"></script>',
          injectCss: '<link href = "static/pro-template/js/vue-963fdc09.js" >',
          injectMeta: '<meta charset="UTF-8" />',

          // You can also inject all with one variable instead of defining each
          injectCode:
            '<script src="static/pro-template/js/test-one-11c3eaa8.js"></script><link href = "static/pro-template/js/vue-963fdc09.js" >',
        },
      },
    },
    'app-six': {
      title: 'sixthPage',
    },
  },
  buildCfg: {
    buildPrefixName: prefixName,
    moveHtmlTop: true,
    htmlHash: false,
    buildAssetDirName: _pageName + '/asset',
    buildChunkDirName: _pageName + '/js',
    buildEntryDirName: _pageName + '/js',
    // htmlPrefixSearchValue: '/static',
    // htmlPrefixReplaceValue: 'static'
  },
});
```

## use examples

single page application

- [src/examples](https://github.com/Miofly/vite-plugin-html-template-mpa/tree/master/examples/vite-plugin-demo-spa)

multi page application

- [src/examples](https://github.com/Miofly/vite-plugin-html-template-mpa/tree/master/examples/vite-plugin-demo-mpa)

## MORE

- Cooperate with `vite-plugin-multi-pages` multi page application
  configuration: [https://github.com/Miofly/vite-plugin-multi-pages](https://github.com/Miofly/vite-plugin-multi-pages)
- Cooperate with `vite-plugin-vconsole-mpa` to automatically configure
  vconsole: [https://github.com/Miofly/vite-plugin-vconsole-mpa](https://github.com/Miofly/vite-plugin-vconsole-mpa)
