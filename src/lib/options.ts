export interface Options {
  /**
   * 页面目录
   * @default 'src/pages'
   */
  pagesDir: string
  /**
   * 页面配置选项
   * @see {@link https://cli.vuejs.org/config/#pages}
   */
  pages: {
    [pageName: string]: {
      /**
       * @default public/index.html
       */
      template?: string
      /**
       * @default 'Home Page'
       */
      title?: string
      /**
       * @default SPA => 'main'; MPA => 'src/pages/${pageName}/main'
       */
      entry?: string
      /**
       * @default '${pageName}/index.html' at dest
       * not implements and have no idea
       */
      filename?: string
    }
  }
  /**
   * data expose to template.
   * @default {}
   */
  data: Record<string, any>
  /**
   * @default '/src/main'
   */
  entry?: string
  jumpTarget?: '_self' | '_blank'
}

export type UserOptions = Partial<Options>
