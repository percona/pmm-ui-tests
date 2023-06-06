import { expect, Page } from '@playwright/test';
import Table from '../../../components/table';

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

  elements = {
    ...super.getTableElements(),
    nodeName: (nodeName: string) => super.getTableElements().rowByText(nodeName).locator('td').nth(2),
    nodeId: (nodeName: string) => super.getTableElements().rowByText(nodeName).locator('td').nth(3),
    nodeType: (nodeName: string) => super.getTableElements().rowByText(nodeName).locator('td').nth(4),
    address: (nodeName: string) => super.getTableElements().rowByText(nodeName).locator('td').nth(5),
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
  };

  messages = {
    ...super.getTableMessages(),
    hasAgents: (nodeId?: string) => `Node with ID "${nodeId}" has agents.`,
    nodesSuccessfullyDeleted: (number: number) => `${number} of ${number} nodes successfully deleted`
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
