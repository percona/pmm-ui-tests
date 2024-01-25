const { I } = inject();

module.exports = {
  url: 'graph/pmm-dump',
  fields: {
    status: (uid) => locate('td').withDescendant(locate('label').withAttr({ for: `input-table-select-${uid}-id` })),
    downloadButton: locate('span').withText('Download'),
    deleteButton: locate('span').withText('Delete'),
    sendSupportButton: locate('span').withText('Send to Support'),
    sendSupportDialog: locate('h2').withText('Send to Support'),
    kebabMenu: (uid) => `//label[@for='input-table-select-${uid}-id']//ancestor::tr//button[@data-testid="dropdown-menu-toggle"]`,
    viewLogs: locate('span').withText('View logs'),
    log: (uid) => locate('div').withText(`Logs for ${uid}`),
    showServiceDetails: (uid) => `//label[@for='input-table-select-${uid}-id']//ancestor::tr//button[@data-testid="show-row-details"]`,
  },

  /**
   * User action to authenticate to PMM Server.
   * **should be used inside async with `await`**
   *
   * @param uid
   */
  verifyDumpVisible(uid) {
    I.seeElement(this.fields.status(uid));
  },

  verifyDownloadEnabled() {
    I.seeElement(this.fields.downloadButton);
  },

  verifyDeleteEnabled() {
    I.seeElement(this.fields.deleteButton);
  },

  verifySFTPEnabled() {
    I.seeElement(this.fields.sendSupportButton);
  },

  verifySFTP() {
    I.seeElement(this.fields.sendSupportDialog);
  },

  verifyLogsVisible(uid) {
    I.seeElement(this.fields.kebabMenu(uid));
    I.click(this.fields.kebabMenu(uid));
    I.seeElement(this.fields.viewLogs);
    I.click(this.fields.viewLogs);
    I.seeElement(this.fields.log(uid));
  },

  async verifyService(uid) {
    await I.waitForVisible(this.fields.showServiceDetails(uid), 10);
    I.click(this.fields.showServiceDetails(uid));
  },
};
