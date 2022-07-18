import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import htmlTemplate from '../../src';
import mpa from 'vite-plugin-multi-pages';

export default defineConfig({
  plugins: [
    vue(),
    mpa({
      scanDir: 'src/views'
    }),
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
