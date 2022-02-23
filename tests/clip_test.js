const clipboard = require('clipboardy');

// import clipboard from 'clipboardy';

Feature('Clipboardy page');

Scenario(
  'Test of the Clipboardy module @debug',
  async ({ I }) => {

    const clipboardText = clipboard.read();

    I.assertEqual(clipboardText, 'ololo');
  },
);
