import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import htmlTemplate from '../../src';
import mpa from 'vite-plugin-multi-pages-entry';

export default defineConfig({
  plugins: [
    vue(),
    mpa(),
    htmlTemplate()
  ]
});
