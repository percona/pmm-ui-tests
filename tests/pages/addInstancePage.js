const { I } = inject();

module.exports = {
  url: 'graph/add-instance',
  addMySQLRemoteURL: 'graph/add-instance?instance_type=mysql',
  fields: {
    breadcrumbs: locate('h2').withText('Select service type'),
    addAmazonRDSbtn: '//div[@data-testid=\'rds-instance\']//button[@type=\'button\']',
  },

  async open() {
    I.amOnPage(this.url);
    I.waitForElement(this.fields.breadcrumbs, 60);
  },
};
