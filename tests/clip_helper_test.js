Feature('Clipboard helper test');

Scenario(
  'Test of the Clipboard custom helper @debug',
  async ({ I }) => {
    const clipboardText = I.readClipboard();

    I.assertEqual(clipboardText, 'cookies');
  },
);
