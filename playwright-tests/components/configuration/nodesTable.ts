import { expect, Page } from '@playwright/test';
import Table from '../table';

export interface NodeDetails {
  nodeId?: string;
  nodeType?: string;
  nodeName?: string;
  address?: string;
}

export default class NodesTable extends Table {
  constructor(page: Page) {
    super(page);
  }

  private dropdownMenu = this.page.locator('//div[@data-testid="dropdown-menu-menu"]');

  elements = {
    ...super.getTableElements(),
    nodeName: (nodeName: string) => super.getTableElements().rowByText(nodeName).locator('td').nth(1),
    nodeId: (nodeName: string) => super.getTableElements().rowByText(nodeName).locator('td').nth(2),
    nodeType: (nodeName: string) => super.getTableElements().rowByText(nodeName).locator('td').nth(3).locator('//a'),
    address: (nodeName: string) => super.getTableElements().rowByText(nodeName).locator('td').nth(4),
    modalHeader: this.page.getByRole('dialog').locator('//h4'),
  };

  fields = {
    ...super.getTableFields(),
  };

  labels = {
    ...super.getTableLabels(),
  };

  buttons = {
    ...super.getTableButtons(),
    selectNode: (nodeName: string = '') => super.getTableElements().rowByText(nodeName).locator('input'),
    showRowDetails: (nodeName: string) => super.getTableElements().rowByText(nodeName).getByTestId('show-row-details'),
    hideRowDetails: (nodeName: string) => super.getTableElements().rowByText(nodeName).getByTestId('hide-row-details'),
    submit: this.page.locator('//button[@type="submit"]'),
  };

  messages = {
    ...super.getTableMessages(),
    confirmNodeDeleteHeader: (numberNodes: number = 1) => `Are you sure that you want to permanently delete ${numberNodes} nodes`,
    hasAgents: (nodeId?: string) => `Node with ID "${nodeId}" has agents.`,
  };

  links = {
    ...super.getTableLinks(),
  };

  verifyNode = async (details: NodeDetails) => {
    await expect(this.elements.nodeName(details.nodeName!)).toContainText(details.nodeName!);
    await expect(this.elements.nodeId(details.nodeName!)).toContainText(details.nodeId!);
    await expect(this.elements.nodeType(details.nodeName!)).toContainText(details.nodeType!);
    await expect(this.elements.address(details.nodeName!)).toContainText(details.address!);
  };

}
