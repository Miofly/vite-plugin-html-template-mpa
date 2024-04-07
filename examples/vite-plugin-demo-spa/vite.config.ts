import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import htmlTemplate from '../../src';
import { resolve } from 'path';

export default defineConfig({
  server: {
    open: true,
  },
  // build: {
  //   rollupOptions: {
  //     input: {
  //       index: resolve(__dirname, '../index.html'),
  //     },
  //   },
  // },
  plugins: [
    vue(),
    htmlTemplate({
      // template: resolve(__dirname, '../index.html'),
      minify: true,
      inject: {
        data: {
          title: '我是标题',
          injectScript: `<script>console.log(1)</script>`,
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
