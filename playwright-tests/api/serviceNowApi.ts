import ServiceNowResponse from '../support/types/serviceNowResponse.interface';
import { serviceNowRequest } from './helpers/serviceNowApiHelper';
import { oktaAPI } from './okta';

export const serviceNowAPI = {
  async createServiceNowCredentials(): Promise<ServiceNowResponse> {
    const response = await serviceNowRequest();
    
    return {
      account: response.data.result.account,
      contacts: {
        admin1: response.data.result.contacts.find((contact) => contact.email.startsWith('ui_tests_admin-')),
        admin2: response.data.result.contacts.find((contact) => contact.email.startsWith('ui_tests_admin2-')),
        technical: response.data.result.contacts.find((contact) =>
          contact.email.startsWith('ui_tests_technical-'),
        ),
      },
    };
  },

  async createServiceNowUsers() {
    const credentials: ServiceNowResponse = await this.createServiceNowCredentials();
    console.log(`Service now credentials are: ${credentials}`)
    const firstAdmin = await oktaAPI.createTestUser(credentials.contacts.admin1.email);
    const secondAdmin = await oktaAPI.createTestUser(credentials.contacts.admin2.email);
    const technicalUser = await oktaAPI.createTestUser(credentials.contacts.technical.email);

    return [firstAdmin, secondAdmin, technicalUser];
  },
};
