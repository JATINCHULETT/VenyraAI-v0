declare module "marked" {
  type MarkedOptions = {
    gfm?: boolean;
    breaks?: boolean;
    headerIds?: boolean;
    mangle?: boolean;
  };

  export const marked: {
    parse(src: string, options?: MarkedOptions): string | Promise<string>;
  };
}
