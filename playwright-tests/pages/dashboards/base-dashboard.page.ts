import { expect } from '@playwright/test';
import Duration from '@helpers/enums/duration';
import { CommonPage } from '@pages/common.page';

export class BaseDashboard extends CommonPage {
  elements: any = {
    ...this.elements,
    collapsedPanel: this.page.locator('//*[contains(@class, "dashboard-row--collapsed")]'),
    panelContent: this.page.locator('//*[contains(@class, "panel-content")]'),
    panel: this.page.locator('//div[contains(@class, "react-grid-item")]'),
    panelTitle: this.page.locator('//div[@class="panel-title"]//h2'),
    getPanelByName: (name: string, panelId: number) => this.page.locator(`//*[text()="${name}"]//ancestor::div[contains(@class, "react-grid-item")  and @data-panelId="${panelId}"]`),
    dashboardName: this.page.locator('//a[@aria-label="Search dashboard by name"]//span'),
  };

  buttons = {
    qan: this.page.locator('//*[@data-testid="data-testid Dashboard link"]//span[text()="Query Analytics"]'),
    serviceName: this.page.locator('//button[@id="var-service_name"]'),
  };

  labels = { create: 'Create' };

  openAllPanels = async () => {
    await this.elements.collapsedPanel.waitFor({ state: 'visible' });
    const collapsedPanels = await this.elements.collapsedPanel.elementHandles();
    for await (const panel of collapsedPanels.values()) {
      await panel.click();
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
  };

  waitForPanelToHaveData = async (panelHeader: string, panelId: number, timeout: Duration = Duration.OneMinute) => {
    await this.openAllPanels();
    await this.elements.getPanelByName(panelHeader, panelId).scrollIntoViewIfNeeded();
    await expect(this.elements.getPanelByName(panelHeader, panelId))
      .not.toContainText('N/A', { ignoreCase: true, timeout });
    await expect(this.elements.getPanelByName(panelHeader, panelId))
      .not.toContainText('No data', { ignoreCase: true, timeout });
    await expect(this.elements.getPanelByName(panelHeader, panelId))
      .not.toContainText('Insufficient access permissions', { ignoreCase: true, timeout });
    await this.page.keyboard.press('PageDown');
  };

  verifyAllPanelsHaveData = async (panelsWithoutData: number) => {
    await this.openAllPanels();
    let noDataElements = 0;
    const panelData = await this.elements.panelContent.elementHandles();
    for await (const index of panelData.keys()) {
      await this.elements.panelContent.nth(index).scrollIntoViewIfNeeded();

      try {
        await expect(this.elements.panelContent.nth(index)).not.toContainText('N/A', { ignoreCase: true });
        await expect(this.elements.panelContent.nth(index)).not.toContainText('No data', { ignoreCase: true });
        await expect(this.elements.panelContent.nth(index))
          .not.toContainText('Insufficient access permissions', { ignoreCase: true });
      } catch (err) {
        noDataElements++;
        if (noDataElements > panelsWithoutData) {
          throw new Error(`Number of elements without data is greater than expected (${panelsWithoutData})`);
        }
      }
      await this.page.keyboard.press('PageDown');
    }
  };

  public verifyExpectedPanelsShowError = async (expectedPanels: any[]) => {
    await this.openAllPanels();
    const panelData = await this.elements.panelTitle.elementHandles();
    for await (const expectedPanel of expectedPanels.values()) {
      const foundPanel = panelData.find(async (panel: any) => {
        return (await panel.textContent()) === expectedPanel.name;
      });

      if (foundPanel) {
        await this.elements.getPanelByName(expectedPanel.name, expectedPanel.panelId).scrollIntoViewIfNeeded();
        await expect(this.elements.getPanelByName(expectedPanel.name, expectedPanel.panelId))
          .toContainText(expectedPanel.error as string, { ignoreCase: true });
        await this.page.keyboard.press('PageDown');
      }
    }
  };

  verifyAllPanelsDoesNotHaveData = async () => {
    await this.openAllPanels();
    const panelData = await this.elements.panelContent.elementHandles();
    for await (const index of panelData.keys()) {
      await this.elements.panelContent.nth(index).scrollIntoViewIfNeeded();
      const text = await this.elements.panelContent.nth(index).textContent();
      if (!text?.includes('N/A') && !text?.toLocaleLowerCase().includes('no data')) {
        expect(true, `Panel ${await this.elements.panelTitle.nth(index).textContent()} does contains data: "${text}"`).toEqual(false);
      }
      await this.page.keyboard.press('PageDown');
    }
  };
}
