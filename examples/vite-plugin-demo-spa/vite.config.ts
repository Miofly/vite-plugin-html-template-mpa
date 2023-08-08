import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import htmlTemplate from '../../src';

export default defineConfig({
  server: {
    open: true
  },
  plugins: [
    vue(),
    htmlTemplate({
      minify: true,
      buildCfg: {
        htmlHash: true
      },
      pages: {
        index: {
          title: '测试标题',
          urlParams: 'id=33',
          injectOptions: {
            data: {
              // This is the variable name (custom) to be injected in the template, mainly in the index : hmtl inserting variables
              injectScript: '<script src="static/pro-template/js/test-one-11c3eaa8.js"></script>'
            }
          }
        }
      }
    })
  ]
});
