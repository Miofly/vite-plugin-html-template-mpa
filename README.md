# vite-plugin-html-template-mpa

**English** | [中文](./README.zh_CN.md)

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
import htmlTemplate from 'vite-plugin-html-template-mpa'

export default defineConfig({
  plugins: [
    htmlTemplate(/* options */),
  ],
})
```

Multi page application
**vite.config.ts**

```typescript
import htmlTemplate from 'vite-plugin-html-template-mpa'

export default defineConfig({
  plugins: [
    htmlTemplate({
      pagesDir: 'src/views',
      pages: {
        'test-one': {
          title: 'testTitle',
          urlParams: 'id=33'
        },
        'test-twos': {
          urlParams: 'id=33'
        }
      },
      buildCfg: {
        moveHtmlTop: true,
        moveHtmlDirTop: false,
        buildPrefixName: '',
        htmlHash: true
      },
      data: {
        title: 'defaultTitle'
      }
    }),
  ],
})
```

## Options

```typescript
export interface Options {
  /**
   * multi page application directory
   * @default src/pages
   */
  pagesDir: string
  /**
   * multi page application configuration
   * @see {@link https://cli.vuejs.org/config/#pages}
   */
  pages: {
    [pageName: string]: {
      /**
       * @default public/index.html
       */
      template?: string
      /**
       * page title
       * @default 'Home Page'
       */
      title?: string
      /**
       * entry file
       */
      entry?: string
      /**
       * template file
       * @default '${pageName}/index.html' at dest
       */
      filename?: string
      /**
       * add parameters to the root page link
       * @example id=12323&token=0000
       */
      urlParams?: string
    }
  }
  /**
   * data exposed to the template
   * @default {}
   */
  data: Record<string, any>
  /**
   * @default '/src/main'
   */
  entry?: string
  /**
   * multi page application home page jump mode
   */
  jumpTarget?: '_self' | '_blank'
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
    moveHtmlTop?: boolean
    /**
     * The generated index The parent directory of HTML is promoted to the top level
     * @default false
     */
    moveHtmlDirTop?: boolean
    /**
     * Add a hash to the resources in the generated HTML file
     * @default false
     */
    htmlHash?: boolean
    /**
     * build asset dir add name
     */
    buildAssetDirName: string
    /**
     * build chunk dir add name
     */
    buildChunkDirName: string
    /**
     * build entry dir add name
     */
    buildEntryDirName: string
  },
  /**
   * Minimize options
   * @default true
   */
  minify?: MinifyOptions | boolean
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

## use examples

single page application

- [src/examples](https://github.com/Miofly/vite-plugin-html-template-mpa/tree/master/examples/vite-plugin-demo-spa)

multi page application

- [src/examples](https://github.com/Miofly/vite-plugin-html-template-mpa/tree/master/examples/vite-plugin-demo-mpa)

## MORE

- Cooperate with `vite-plugin-multi-pages` multi page application
  configuration: [https://github.com/Miofly/vite-plugin-multi-pages](https://github.com/Miofly/vite-plugin-multi-pages)
- Cooperate with `vite-plugin-vconsole-mpa` to automatically configure '
  vconsole'`: [https://github.com/Miofly/vite-plugin-vconsole-mpa](https://github.com/Miofly/vite-plugin-vconsole-mpa)
