import { expect, Page } from '@playwright/test';
import { CommonPage } from '../Common.page';

export class BaseDashboard extends CommonPage {
  constructor(page: Page) {
    super(page);
  }
      
    

  private baseDashboardElements = {
    ...super.getElements(),
    collapsedPanel: this.page.locator('//*[contains(@class, "dashboard-row--collapsed")]'),
    panelContent: this.page.locator('//*[contains(@class, "panel-content")]'),
  };

  private baseDashboardFields = {
    ...super.getFields(),
  };

  private baseDashboardLabels = {
    ...super.getLabels(),
  };

  private baseDashboardButtons = {
    ...super.getButtons(),
  };

  private baseDashboardMessages = {
    ...super.getMessages(),
  };

  private baseDashboardLinks = {
    ...super.getLinks(),
  };

  protected getBaseDashboardElements() {
    return this.baseDashboardElements;
  }

  protected getBaseDashboardFields() {
    return this.baseDashboardFields;
  }

  protected getBaseDashboardLabels() {
    return this.baseDashboardLabels;
  }

  protected getBaseDashboardButtons() {
    return this.baseDashboardButtons;
  }

  protected getBaseDashboardMessages() {
    return this.baseDashboardMessages;
  }

  protected getBaseDashboardLinks() {
    return this.baseDashboardLinks;
  }

  openAllPanels = async () => {
    try {
      await this.baseDashboardElements.collapsedPanel.waitFor({ state: 'visible' });
    } catch (e) {}

    const collapsedPanels = await this.baseDashboardElements.collapsedPanel.elementHandles()
    for await (const [index, panel] of collapsedPanels.entries()) {
      await panel.click()
    }
  }

  verifyAllPanelsHaveData = async () => {
    await this.openAllPanels();
    const panelData = await this.baseDashboardElements.panelContent.elementHandles();
    for await (const [index, panel] of panelData.entries()) {
      await expect(this.baseDashboardElements.panelContent.nth(index)).not.toContainText('N/A' || 'No data')
      console.log(await panel.textContent());
    }
  }

  verifyAllPanelsDoesNotHaveData = async () => {
    await this.openAllPanels();
    const panelData = await this.baseDashboardElements.panelContent.elementHandles();
    for await (const [index, panel] of panelData.entries()) {
      await expect(this.baseDashboardElements.panelContent.nth(index)).toContainText('N/A' || 'No data')
      console.log(await panel.textContent());
    }
  }
}
