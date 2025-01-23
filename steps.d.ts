/// <reference types='codeceptjs' />
type steps_file = typeof import('./steps_file');
type api = typeof import('./api/api');

declare namespace CodeceptJS {
  interface SupportObject { I: I, current: any, api: api }
  interface Methods extends Playwright, REST {}
  interface I extends ReturnType<steps_file> {}
  namespace Translation {
    interface Actions {}
  }
}
