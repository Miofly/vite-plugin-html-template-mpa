// @ts-nocheck
import { defineConfig, type PluginOption } from 'vite';
import vue from '@vitejs/plugin-vue';
import htmlTemplate from '../../src';
import mpa from 'vite-plugin-multi-pages';

export default defineConfig({
  plugins: [
    vue(),
    mpa(),
    htmlTemplate({
      buildCfg: {
        moveHtmlTop: true,
        moveHtmlDirTop: false,
        buildPrefixName: '',
        htmlHash: false,
      },
      template:
        '/Users/wfly/Documents/code/wfly/vite-plugin/vite-plugin-html-template-mpa/examples/business/index.html',
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
    }),
  ] as unknown as PluginOption[],
});
