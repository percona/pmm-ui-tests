const { I } = inject();

module.exports = {
  url: 'graph/explore',
  elements: {
    rawQueryToggleLabel: 'label[for^="switch-Raw-query"]',
  },

  open() {
    I.amOnPage(this.url);
    I.waitForVisible(this.elements.rawQueryToggleLabel, 30);
  },
};
