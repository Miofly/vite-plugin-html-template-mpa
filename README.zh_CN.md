# vite-plugin-html-template-mpa

**中文** | [English](./README.md)

## 功能

- `HTML` 压缩能力
- 单页/多页应用支持
- 支持自定义 `entry`、`template`
- 支持多页应用生成主页面包含所有页面的跳转路径
- 支持打包目录已经 `html` 名称改变，路径改变
- 支持 `html` 页面中资源增加 `hash`

## 如何使用

### 安装

```sh
yarn add vite-plugin-html-template-mpa
# or
pnpm add vite-plugin-html-template-mpa
```

### 配置

单页应用
**vite.config.ts**

```typescript
import htmlTemplate from 'vite-plugin-html-template-mpa';

export default defineConfig({
  plugins: [htmlTemplate(/* options */)]
});
```

多页应用
**vite.config.ts**

```typescript
import htmlTemplate from 'vite-plugin-html-template-mpa';

export default defineConfig({
  plugins: [
    htmlTemplate({
      pagesDir: 'src/views',
      pages: {
        'test-one': {
          title: '测试标题',
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
        title: '默认标题'
      }
    })
  ]
});
```

## 配置参数

```typescript
export interface Options {
  /**
   * 多页应用目录
   * @default src/pages
   */
  pagesDir: string;
  /**
   * 多页应用配置
   * @see {@link https://cli.vuejs.org/config/#pages}
   */
  pages: {
    [pageName: string]: {
      /**
       * @default public/index.html
       */
      template?: string;
      /**
       * 页面 title
       * @default 'Home Page'
       */
      title?: string;
      /**
       * 入口文件
       */
      entry?: string;
      /**
       * 模板文件
       * @default '${pageName}/index.html' at dest
       */
      filename?: string;
      /**
       * 根页面链接添加参数
       * @example id=12323&token=0000
       */
      urlParams?: string;
    };
  };
  /**
   * 暴露于模板的数据
   * @default {}
   */
  data: Record<string, any>;
  /**
   * @default '/src/main'
   */
  entry?: string;
  /**
   * 多页应用程序主页跳转模式
   */
  jumpTarget?: '_self' | '_blank';
  buildCfg: {
    /**
     * 生成多页应用添加前缀
     * @default '' | string
     */
    buildPrefixName?: string;
    /**
     * 将生成的 index.html 提升至最顶层，并将 index.html 重命名为 多页应用名称.html
     * @default true
     */
    moveHtmlTop?: boolean;
    /**
     * 将生成的 index.html 的父目录提升至最顶层
     * @default false
     */
    moveHtmlDirTop?: boolean;
    /**
     * 对生成的 html 文件中的 js 与 css 添加唯一的 hash 值
     * @default false
     */
    htmlHash?: boolean;
    /**
     * 打包时对 asset 目录增加目录名
     */
    buildAssetDirName: string;
    /**
     * 打包时对 chunk 目录增加目录名
     */
    buildChunkDirName: string;
    /**
     * 打包时对 entry 目录增加目录名
     */
    buildEntryDirName: string;
    /**
     * 要替换生成的 html 中的原字符串（主要是打包的 base 路径处理）
     */
    htmlPrefixSearchValue?: string;
    /**
     * 替换后的字符串
     */
    htmlPrefixReplaceValue?: string;
  };
  /**
   * html 压缩配置
   * @default true
   */
  minify?: MinifyOptions | boolean;
}
```

### 默认压缩配置

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

## 使用示例

单页应用

- [src/examples](https://github.com/Miofly/vite-plugin-html-template-mpa/tree/master/examples/vite-plugin-demo-spa)

多页应用

- [src/examples](https://github.com/Miofly/vite-plugin-html-template-mpa/tree/master/examples/vite-plugin-demo-mpa)

## 更多

- 配合 `vite-plugin-multi-pages`
  多页面应用配置: [https://github.com/Miofly/vite-plugin-multi-pages](https://github.com/Miofly/vite-plugin-multi-pages)
- 配合 `vite-plugin-vconsole-mpa`
  自动配置 `vconsole`: [https://github.com/Miofly/vite-plugin-vconsole-mpa](https://github.com/Miofly/vite-plugin-vconsole-mpa)
