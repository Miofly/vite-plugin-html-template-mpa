import type { Options as MinifyOptions } from 'html-minifier-terser';
import type { HtmlTagDescriptor } from 'vite';
import type { Options as EJSOptions } from 'ejs';

export interface InjectOptions {
  /**
   *  @description Data injected into the html template
   */
  data?: Record<string, any>;
  tags?: HtmlTagDescriptor[];
  /**
   * @description esj options configuration
   */
  ejsOptions?: EJSOptions;
}

export type PageOptions = {
  /**
   * @default public/index.html
   */
  template?: string;
  /**
   * page title
   * @default 'Home Page'
   */
  title?: string;
  /**
   * entry file
   */
  entry?: string;
  /**
   * template file
   * @default '${pageName}/index.html' at dest
   */
  filename?: string;
  /**
   * add parameters to the root page link
   * @example id=12323&token=0000
   */
  urlParams?: string;
  /**
   * @description inject options
   */
  inject?: InjectOptions;
};

export interface Options extends PageOptions {
  /**
   * multi page application directory
   * @default src/pages
   */
  pagesDir: string;
  /**
   * multi page application configuration
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
   * multi page application home page jump mode
   */
  jumpTarget?: '_self' | '_blank';
  buildCfg: {
    /**
     * generate multi page application add prefix
     * @default '' | string
     */
    buildPrefixName?: string;
    /**
     * The generated index HTML to the top, and index Rename HTML to multi page application name html
     * @default true
     */
    moveHtmlTop?: boolean;
    /**
     * The generated index The parent directory of HTML is promoted to the top level
     * @default false
     */
    moveHtmlDirTop?: boolean;
    /**
     * Add a hash to the resources in the generated HTML file
     * @default false
     */
    htmlHash?: boolean;
    /**
     * build asset dir add name
     */
    buildAssetDirName?: string;
    /**
     * build chunk dir add name
     */
    buildChunkDirName?: string;
    /**
     * build entry dir add name
     */
    buildEntryDirName?: string;
    /**
     * To replace the original string in the generated html (mainly packaged base path processing)
     */
    htmlPrefixSearchValue?: string;
    /**
     * replace string
     */
    htmlPrefixReplaceValue?: string;
  };
  /**
   * Minimize options
   * @default true
   */
  minify?: MinifyOptions | boolean;
}

export type HtmlTemplateMpaOptions = Partial<Options>;
