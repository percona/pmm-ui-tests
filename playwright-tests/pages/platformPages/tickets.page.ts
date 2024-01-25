import { CommonPage } from '@pages/common.page';

export default class TicketsPage extends CommonPage {
  ticketsUrl = 'graph/tickets';
  serviceNowUrl = 'perconadev.service-now.com/percona';
  ticketsContainer = this.page.getByTestId('page-wrapper-tickets');
  tableBody = this.ticketsContainer.getByTestId('table-tbody');

  elements: any = {
    ...this.elements,
    table: this.ticketsContainer.getByTestId('table'),
    rows: this.tableBody.getByRole('row'),
    row: (index: number) => this.tableBody.getByRole('row').nth(index),
  };

  messages: { [key: string]: string } = {
    ...this.messages,
    noTicketsFound: 'No tickets found',
  };
}
