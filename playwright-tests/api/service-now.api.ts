import { ServiceNowResponse, ServiceNowUser } from '@helpers/types/service-now-response.interface';
import https from 'https';
import axios, { AxiosRequestConfig } from 'axios';
import constants from '@helpers/constants';
import { expect } from '@playwright/test';

const apiConfig: AxiosRequestConfig = {
  auth: { username: constants.serviceNow.username, password: constants.serviceNow.password },
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
};

export const serviceNowApi = {
  async getServiceNowCredentials(): Promise<ServiceNowResponse> {
    console.log(`POST: ${constants.serviceNow.devUrl}`);
    const response = await axios.post(constants.serviceNow.devUrl, {}, apiConfig);
    expect(response.status, `Expected to be 200: ${response.status} ${response.statusText}`).toEqual(200);
    console.log(`Status: ${response.status} ${response.statusText}`);
    return {
      account: response.data.result.account,
      contacts: {
        admin1: response.data.result.contacts.find((contact: ServiceNowUser) => contact.email.startsWith('ui_tests_admin-')),
        admin2: response.data.result.contacts.find((contact: ServiceNowUser) => contact.email.startsWith('ui_tests_admin2-')),
        technical: response.data.result.contacts.find((contact: ServiceNowUser) => contact.email.startsWith('ui_tests_technical-')),
      },
    };
  },
};
