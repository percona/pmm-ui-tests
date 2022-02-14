const { I } = inject();

module.exports = {
  url: 'alertmanager',
  urlSilences: 'alertmanager/#/silences',
  elements: {
    noSilencesText: locate('.alert-warning').withText('No silences found'),
    activeTab: locate('.nav-link').withText('Active'),
    expiredTab: locate('.nav-link').withText('Expired'),
  },

  selectExpiredTab() {
    I.waitForElement(this.elements.expiredTab, 30);
    I.forceClick(this.elements.expiredTab);
    I.waitForElement(locate('.nav-link.active').withText('Expired'), 30);
  },
};
