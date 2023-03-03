import { Page } from '@playwright/test';
import { CommonPage } from '../Common.page';

export class AdvisorsPage extends CommonPage {
  constructor(page: Page) {
    super(page);
  }

  private advisorsElements = {
    ...super.getElements(),
  };

  private advisorsFields = {
    ...super.getFields(),
  };

  private advisorsLabels = {
    ...super.getLabels(),
  };

  private advisorsButtons = {
    ...super.getButtons(),
    runChecks: this.page.getByText('Run Checks')
  };

  private advisorsMessages = {
    ...super.getMessages(),
  };

  private advisorsLinks = {
    ...super.getLinks(),
  };

  protected getAdvisorsElements() {
    return this.advisorsElements;
  }

  protected getAdvisorsFields() {
    return this.advisorsFields;
  }

  protected getAdvisorsLabels() {
    return this.advisorsLabels;
  }

  protected getAdvisorsButtons() {
    return this.advisorsButtons;
  }

  protected getAdvisorsMessages() {
    return this.advisorsMessages;
  }

  protected getAdvisorsLinks() {
    return this.advisorsLinks;
  }
}
