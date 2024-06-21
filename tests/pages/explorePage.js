const { I } = inject();

module.exports = {
  url: 'graph/explore',
  elements: {
    rawQueryToggleLabel: '$QueryEditorModeToggle',
  },

  open() {
    I.amOnPage(this.url);
    I.waitForVisible(this.elements.rawQueryToggleLabel, 30);
  },
};
