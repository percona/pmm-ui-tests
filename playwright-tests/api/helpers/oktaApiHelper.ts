import axios, { Method } from 'axios';

const https = require('https');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export const oktaRequest = async (
  baseUrl: string,
  urlSuffix: string,
  method: Method = 'get',
  token: string,
  data = {},
) => {
  let response;

  try {
    response = await axios({
      url: baseUrl + urlSuffix,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: token,
      },
      method,
      data,
      httpsAgent,
    });

    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    };
  } catch (error) {
    // If we have a response for the error, pull out the relevant parts
    if (error.response) {
      response = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      };
    } else {
      // If we get here something else went wrong, so throw
      throw error;
    }
  }

  return response;
};
