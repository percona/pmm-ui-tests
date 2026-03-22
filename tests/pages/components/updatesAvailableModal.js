const { I } = inject();

class UpdatesAvailableModalComponent {
  constructor() {
    this.root = locate('[role="dialog"]');
    this.closeIcon = locate('//*[@aria-label="Close" or @data-testid="modal-close-button"]');
    this.dismissButton = this.root.find('button').withText('Dismiss');
    this.goToUpdatesPage = this.root.find('button').withText('Go to updates page');
  }
}

module.exports = new UpdatesAvailableModalComponent();
module.exports.UpdatesAvailableDialog = UpdatesAvailableModalComponent;
