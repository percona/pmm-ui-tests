module.exports = () => actor({

  verifyPopUpMessage(message, timeout = 30) {
    this.waitForText(message, timeout, '.page-alert-list div');
    this.click('.page-alert-list button');
  },
});
