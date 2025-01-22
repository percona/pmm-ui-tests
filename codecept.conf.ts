export const config: CodeceptJS.MainConfig = {
  tests: './tests/*_test.ts',
  output: './output',
  helpers: {
    Playwright: {
      browser: 'chromium',
      url: 'http://localhost',
      show: true,
      chromium: {
        headless: false,
      }

    }
  },
  include: {
    I: './steps_file',
  },
  name: 'codeceptjs-poc'
}