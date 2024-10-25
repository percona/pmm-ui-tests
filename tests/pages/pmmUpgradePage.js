class PmmUpgradePage {
  constructor() {
    this.url = 'pmm-ui/updates';
    this.elements = {
      updateNowButton: locate('button').withText('Update Now'),
      checkUpdatesNow: locate('button').withText('Check Updates Now'),
    };
  }
}

module.exports = new PmmUpgradePage();
module.exports.PmmUpgradePage = PmmUpgradePage;
