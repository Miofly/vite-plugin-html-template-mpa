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
      }
    }),
  ]
});
