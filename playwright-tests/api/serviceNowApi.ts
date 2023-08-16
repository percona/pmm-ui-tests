import { ServiceNowResponse, ServiceNowUser } from '@helpers/types/serviceNowResponse.interface';
import https from 'https';
import * as dotenv from 'dotenv';
import axios, { AxiosRequestConfig } from 'axios';
import { Constants } from '@helpers/Constants';
import { expect } from '@playwright/test';

dotenv.config();

const apiConfig: AxiosRequestConfig = {
  auth: {
    username: Constants.serviceNow.username, password: Constants.serviceNow.password,
  },
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
};

export const serviceNowAPI = {
  async getServiceNowCredentials(): Promise<ServiceNowResponse> {
    console.log(`POST: ${Constants.serviceNow.devUrl}\nPayload: ${JSON.stringify({})}`);
    const response = await axios.post(Constants.serviceNow.devUrl, {}, apiConfig);
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
