import { Page } from '@playwright/test';
import { CommonPage } from '../Common.page';

export default class TicketsPage extends CommonPage {
  constructor(page: Page) {
    super(page);
  }

  ticketsUrl = 'graph/tickets';
  serviceNowUrl = 'perconadev.service-now.com/percona';
  ticketsContainer = this.page.getByTestId('page-wrapper-tickets');
  tableBody = this.ticketsContainer.getByTestId('table-tbody');

  elements = {
    ...super.getElements(),
    table: this.ticketsContainer.getByTestId('table'),
    rows: this.tableBody.getByRole('row'),
    row: (index: number) => this.tableBody.getByRole('row').nth(index),
    notPlatformUser: this.ticketsContainer.getByTestId('not-platform-user'),
    
  }

  fields = {
    ...super.fields,
  }
  
  labels = {
    ...super.labels,
  }

  buttons = {
    ...super.buttons,
  }

  messages = {
    ...super.messages,
    loginWithPercona: 'Login with Percona Account to access this content',
    notConnectedToThePortal: 'Not connected to Portal.',
    noTicketsFound: 'No tickets found',
  }

  links = {
    ...super.links,
  }
}