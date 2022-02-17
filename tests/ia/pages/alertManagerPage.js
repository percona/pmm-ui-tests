const { I } = inject();
const tab = (tabName) => locate('.nav-item').find(`//button[contains(text(), "${tabName}")]`);

module.exports = {
  url: '/alertmanager',
  elements: {
    silencesTab: locate('a').withAttr({'title': 'Silences'}),
    alertsTab: locate('a').withAttr({'title': 'Alerts'}),
    tab: (tabName) => tab(tabName),
    activatedTab: (tabName) => locate('.nav-link.active').withText(tabName),
    tableLoading: '$table-loading',
    noSilencesText: locate('.alert-warning').withText('No silences found'),
    noAlertGroupsText: locate('.alert-warning').withText('No alert groups found'),
  },

  selectTab(tabName) {
    const tab = this.elements.tab(tabName);
    I.waitForElement(tab, 30);
    I.forceClick(tab);
    I.waitForElement(this.elements.activatedTab(tabName), 30);
  },
};
