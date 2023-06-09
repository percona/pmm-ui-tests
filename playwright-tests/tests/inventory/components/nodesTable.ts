import { expect, Page } from '@playwright/test';
import Table from '../../../components/table';

export interface NodeDetails {
  status?: string;
  nodeId?: string;
  nodeType?: string;
  nodeName?: string;
  address?: string;
  monitoring?: string;
  services?: string[];
}

export default class NodesTable extends Table {
  constructor(page: Page) {
    super(page);
  }

  elements = {
    ...super.getTableElements(),
    version_2_37: {
      nodeName: (nodeName: string) => super.getTableElements().rowByText(nodeName).locator('td').nth(1),
      nodeId: (nodeName: string) => super.getTableElements().rowByText(nodeName).locator('td').nth(2),
      nodeType: (nodeName: string) => super.getTableElements().rowByText(nodeName).locator('td').nth(3),
      address: (nodeName: string) => super.getTableElements().rowByText(nodeName).locator('td').nth(4),
    },
    status: (nodeName: string) => super.getTableElements().rowByText(nodeName).locator('td').nth(1),
    nodeName: (nodeName: string) => super.getTableElements().rowByText(nodeName).locator('td').nth(2),
    nodeType: (nodeName: string) => super.getTableElements().rowByText(nodeName).locator('td').nth(3),
    monitoring: (nodeName: string) => super.getTableElements().rowByText(nodeName).locator('td').nth(4),
    address: (nodeName: string) => super.getTableElements().rowByText(nodeName).locator('td').nth(5),
    services: (nodeName: string) => super.getTableElements().rowByText(nodeName).locator('td').nth(6),
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

  verifyNode = async (details: NodeDetails, versionMinor: number) => {
    if (versionMinor < 38) {
      await expect(this.elements.version_2_37.nodeName(details.nodeName!)).toContainText(details.nodeName!);
      await expect(this.elements.version_2_37.nodeId(details.nodeName!)).toContainText(details.nodeId!);
      await expect(this.elements.version_2_37.nodeType(details.nodeName!)).toContainText(details.nodeType!);
      await expect(this.elements.version_2_37.address(details.nodeName!)).toContainText(details.address!);
    }
    await expect(this.elements.status(details.nodeName!)).toContainText(details.status || 'Up');
    await expect(this.elements.nodeName(details.nodeName!)).toContainText(details.nodeName!);
    await expect(this.elements.nodeType(details.nodeName!)).toContainText(details.nodeType!);
    await expect(this.elements.monitoring(details.nodeName!)).toContainText(details.monitoring || 'OK');
    await expect(this.elements.address(details.nodeName!)).toContainText(details.address!);
    for await (const service of details.services!) {
      await expect(this.elements.services(details.nodeName!)).toContainText(service);
    }
  };
}
