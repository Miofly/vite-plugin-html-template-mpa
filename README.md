# vite-plugin-html-template-mpa

> 对 `Vite` 的多页应用支持通用的 `index.html` 模板配置，在 `/` 路径会生成所有
> 页面的跳转路径，支持自定义各页面的配置信息

## Usage

```sh
yarn add vite-plugin-html-template-mpa
# or
pnpm add vite-plugin-html-template-mpa
```

## 如何使用
配合多入口插件：[https://github.com/Miofly/vite-plugin-multi-pages](https://github.com/Miofly/vite-plugin-multi-pages)

> 不使用上述插件，需自己配置 `rollupOptions` 的 `input` 入口
```ts
// vite.config.ts
import htmlTemplate from 'vite-plugin-html-template-mpa'
import mpa from 'vite-plugin-multi-pages-entry';
// @see https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    mpa()
    // ...other plugins
    htmlTemplate(/* options */),
  ],
})
```

## Options

```typescript
export interface Options {
  /**
   * 页面目录
   * @default 'src/pages'
   */
  pagesDir: string
  /**
   * 页面配置选项
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
  jumpTarget?: '_self' | '_blank'
}
```

## Examples

- `see` [src/examples](https://github.com/Miofly/vite-plugin-html-template-mpa/tree/master/example/vite-plugin-demo)
