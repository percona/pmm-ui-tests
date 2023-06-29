import { Page } from '@playwright/test';
import { CommonPage } from '@pages/Common.page';

export class ConfigurationPage extends CommonPage {
  constructor(page: Page) {
    super(page);
  }

  private configurationElements = {
    ...super.getElements(),
  };

  private configurationFields = {
    ...super.getFields(),
  };

  private configurationLabels = {
    ...super.getLabels(),
  };

  private configurationButtons = {
    ...super.getButtons(),
  };

  private configurationMessages = {
    ...super.getMessages(),
  };

  private configurationLinks = {
    ...super.getLinks(),
  };

  protected getConfigurationElements() {
    return this.configurationElements;
  }

  protected getConfigurationFields() {
    return this.configurationFields;
  }

  protected getConfigurationLabels() {
    return this.configurationLabels;
  }

  protected getConfigurationButtons() {
    return this.configurationButtons;
  }

  protected getConfigurationMessages() {
    return this.configurationMessages;
  }

  protected getConfigurationLinks() {
    return this.configurationLinks;
  }
}
