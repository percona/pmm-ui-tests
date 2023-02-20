import { expect, Page } from '@playwright/test';
import Duration from '@tests/helpers/Duration';
import { CommonPage } from '../Common.page';

export class BaseDashboard extends CommonPage {
  constructor(page: Page) {
    super(page);
  }
      
    

  private baseDashboardElements = {
    ...super.getElements(),
    collapsedPanel: this.page.locator('//*[contains(@class, "dashboard-row--collapsed")]'),
    panelContent: this.page.locator('//*[contains(@class, "panel-content")]'),
    panel: this.page.locator('//div[contains(@class, "react-grid-item")]'),
    panelTitle: this.page.locator('//div[@class="panel-title"]//h2'),
    getPanelByName: (name: string, panelId: number) =>  this.page.locator(`//*[text()="${name}"]//ancestor::div[contains(@class, "react-grid-item")  and @data-panelId="${panelId}"]`),
  };

  private baseDashboardFields = {
    ...super.getFields(),
  };

  private baseDashboardLabels = {
    ...super.getLabels(),
  };

  private baseDashboardButtons = {
    ...super.getButtons(),
    qan: this.page.locator('//*[@data-testid="data-testid Dashboard link"]//span[text()="Query Analytics"]'),
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
    await this.page.keyboard.press('PageDown');
    await this.page.waitForTimeout(1000);
    await this.page.keyboard.press('PageDown');
    await this.page.waitForTimeout(1000);
    await this.page.keyboard.press('PageDown');
    await this.page.waitForTimeout(1000);
    await this.page.keyboard.press('PageDown');
    await this.page.waitForTimeout(1000);
    await this.page.keyboard.press('PageUp');
    await this.page.waitForTimeout(1000);
    await this.page.keyboard.press('PageUp');
    await this.page.waitForTimeout(1000);
  }

  waitForPanelToHaveData = async (panelHeader: string, panelId: number, timeout: Duration = Duration.OneMinute) => {
    await this.openAllPanels();
    await this.baseDashboardElements.getPanelByName(panelHeader, panelId).scrollIntoViewIfNeeded();
    await expect(this.baseDashboardElements.getPanelByName(panelHeader, panelId)).not.toContainText('N/A' && 'No data', { ignoreCase: true, timeout });
    await this.page.keyboard.press('PageDown');
  }

  verifyAllPanelsHaveData = async (panelsWithoutData: number) => {
    await this.openAllPanels();
    let noDataElements: number = 0;
    const panelData = await this.baseDashboardElements.panelContent.elementHandles();
    for await (const [index, panel] of panelData.entries()) {
      await this.baseDashboardElements.panelContent.nth(index).scrollIntoViewIfNeeded();

      try {
        await expect(this.baseDashboardElements.panelContent.nth(index)).not.toContainText('N/A' && 'No data', { ignoreCase: true })
      } catch (err) {
        noDataElements++;
        if(noDataElements > panelsWithoutData) {
          throw new Error(`Number of elements without data is greater than expected (${panelsWithoutData})`)
        }
      }
      await this.page.keyboard.press('PageDown');
    }
  }

  public verifyExpectedPanelsShowError = async (expectedPanels: any[]) => {
    await this.openAllPanels();
    const panelData = await this.baseDashboardElements.panelTitle.elementHandles();
    for await (const [index, expectedPanel] of expectedPanels.entries()) {
      const foundPanel = panelData.find(async (panel) => {
          return (await panel.textContent()) === expectedPanel.name
      });

      if (foundPanel) {
        await this.baseDashboardElements.getPanelByName(expectedPanel.name, expectedPanel.panelId).scrollIntoViewIfNeeded();
        await expect(this.baseDashboardElements.getPanelByName(expectedPanel.name, expectedPanel.panelId)).toContainText(expectedPanel.error, { ignoreCase: true });
        await this.page.keyboard.press('PageDown');
      }
    }
  }

  verifyAllPanelsDoesNotHaveData = async () => {
    await this.openAllPanels();
    const panelData = await this.baseDashboardElements.panelContent.elementHandles();
    for await (const [index, panel] of panelData.entries()) {
      await this.baseDashboardElements.panelContent.nth(index).scrollIntoViewIfNeeded();
      const text = (await this.baseDashboardElements.panelContent.nth(index).textContent())
      if (!text?.includes('N/A') && !text?.toLocaleLowerCase().includes('no data')) {
        expect(true, `Panel ${await this.baseDashboardElements.panelTitle.nth(index).textContent()} does contains data: "${text}"`).toEqual(false);
      }
      await this.page.keyboard.press('PageDown');
    }
  }
}
