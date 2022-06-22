const { I } = inject();

module.exports = {
  url: 'graph/add-instance',
  addMySQLRemoteURL: 'graph/add-instance?instance_type=mysql',
  fields: {
    breadcrumbs: locate('h1').withText('Add Instance'),
    addAmazonRDSbtn: locate('button').withAttr({ 'data-testid': 'rds-instance' })
      .withChild('span').withText('Amazon RDS'),
  },

  async open() {
    I.amOnPage(this.url);
    I.waitForElement(this.fields.breadcrumbs, 60);
  },
};
