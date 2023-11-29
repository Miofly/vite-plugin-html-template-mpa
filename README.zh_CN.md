# vite-plugin-html-template-mpa

**中文** | [English](./README.md)

## 重要更新

- 由于 `vite-plugin-html` 插件不再维护，在 `vite 5.0` 版本启动时会有警告，所以此插件在单页应用中兼容了此插件的功能。
- 版本 `> 1.0.0` 相关的 `api` 具有调整，使用时请注意，最新版本已支持 `vite 5.0.0` 版本。

> 多页应用 `pagesDir` 默认值已调整为 `src/views`，如果多页应用使用出现问题，请配合 `vite-plugin-multi-pages` 一起使用

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
  plugins: [
    htmlTemplate({
      minify: true,
      inject: {
        data: {
          title: '我是标题',
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
          urlParams: 'id=33',
        },
        'test-twos': {
          urlParams: 'id=33',
          inject: {
            data: {
              title: '我是标题',
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
    }),
  ],
});
```

## 配置参数

页面应用参数

```typescript
export type PageOptions = {
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
  /**
   * ejs 注入功能
   */
  inject?: InjectOptions;
};
```

```typescript
export interface Options {
  /**
   * 多页应用目录
   * @default src/views
   */
  pagesDir: string;
  /**
   * 多页应用配置
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

### ejs 使用示例

由于多页应用的 ejs 变量，并非所有页面都会注入所以，变量的写法可参照如下

```
<%if(typeof injectScript !== 'undefined'){%><%-injectScript%><%}%>
```

```javascript
htmlTemplate({
  pages: {
    'app-nine': {
      title: '测试',
      /** 拼接到 url 后的参数 */
      urlParams: 'id=211212&token=00000',
      // 要在模板 html 中注入一些 js 等
      // 在 public/index.hmtl 需要的位置添加上 <%if(typeof injectScript !== 'undefined'){%><%-injectScript%><%}%>
      inject: {
        data: {
          // 这是在模板中要注入的变量名称(自定义)，主要要在 index.hmtl 插入变量
          injectScript:
            '<script src="static/pro-template/js/test-one-11c3eaa8.js"></script>',
          injectCss: '<link href = "static/pro-template/js/vue-963fdc09.js" >',
          injectMeta: '<meta charset="UTF-8" />',

          // 也可以用一个变量注入所有的，不要每个都定义
          injectCode:
            '<script src="static/pro-template/js/test-one-11c3eaa8.js"></script><link href = "static/pro-template/js/vue-963fdc09.js" >',
        },
      },
    },
    'app-six': {
      title: '第六个页面',
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

## 使用示例

单页应用

- [src/examples](https://github.com/Miofly/vite-plugin-html-template-mpa/tree/master/examples/vite-plugin-demo-spa)

多页应用

- [src/examples](https://github.com/Miofly/vite-plugin-html-template-mpa/tree/master/examples/vite-plugin-demo-mpa)

多页应用-固定版本

- [src/examples](https://github.com/Miofly/vite-plugin-html-template-mpa/tree/master/examples/complete-demo-for-mpa)

## 更多

- 配合 `vite-plugin-multi-pages`
  多页面应用配置: [https://github.com/Miofly/vite-plugin-multi-pages](https://github.com/Miofly/vite-plugin-multi-pages)
- 配合 `vite-plugin-vconsole-mpa`
  自动配置 `vconsole`: [https://github.com/Miofly/vite-plugin-vconsole-mpa](https://github.com/Miofly/vite-plugin-vconsole-mpa)
