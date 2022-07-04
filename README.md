# vite-plugin-html-template-mpa

> The multi page application of 'vite' supports the general 'index' HTML 'template configuration. Jump paths of all pages will be generated in the ` ` path, and the configuration information of each page can be customized

## Usage

```sh
yarn add vite-plugin-html-template-mpa
# or
pnpm add vite-plugin-html-template-mpa
```

## How to use
Cooperate with multi entry plug-in：[https://github.com/Miofly/vite-plugin-multi-pages](https://github.com/Miofly/vite-plugin-multi-pages)

> Without using the above plug-ins, you need to configure the 'input' entry of 'rollupoptions'
```ts
// vite.config.ts
import htmlTemplate from 'vite-plugin-html-template-mpa'
import mpa from 'vite-plugin-multi-pages-entry';
// @see https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    mpa(),
    // ...other plugins
    htmlTemplate(/* options */),
  ],
})
```

## Options

```typescript
export interface Options {
  /**
   * pageDirectory
   * @default 'src/pages'
   */
  pagesDir: string
  /**
   * page configuration options
   * @see {@link https://cli.vuejs.org/config/#pages}
   */
  pages: {
    [pageName: string]: {
      /**
       * @default public/index.html
       */
      template?: string
      /**
       * @default 'Home Page'
       */
      title?: string
      /**
       * @default SPA => 'main'; MPA => 'src/pages/${pageName}/main'
       */
      entry?: string
      /**
       * @default '${pageName}/index.html' at dest
       * not implements and have no idea
       */
      filename?: string
    }
  }
  /**
   * data expose to template.
   * @default {}
   */
  data: Record<string, any>
  /**
   * @default '/src/main'
   */
  entry?: string
  /** Homepage jump tab jump method */
  jumpTarget?: '_self' | '_blank'
}
```

## Examples

- `see` [src/examples](https://github.com/Miofly/vite-plugin-html-template-mpa/tree/master/example/vite-plugin-demo)
