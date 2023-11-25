import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import htmlTemplate from '../../src';

export default defineConfig({
  server: {
    open: true,
  },
  plugins: [
    vue(),
    htmlTemplate({
      minify: true,
      buildCfg: {
        htmlHash: true,
      },
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
