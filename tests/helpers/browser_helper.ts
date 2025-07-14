import buildUrl from 'build-url';

class BrowserHelper extends Helper {
  constructor(config) {
    super(config);
  }

  /**
   * Create URL method
   *
   * @param url - Base URL to build on
   * @param parameters - Query parameters as key-value pairs
   * @example
   * buildUrlWithParameters('http://example.com', { environment: 'ps-dev', from: 'now-1' });
   */
  buildUrlWithParameters(url: string, parameters:  Record<string, string>) {
    const queryParams: {
      from?: string,
      to?: string,
      columns?: string,
      dimensionSearchText?: string,
      page_number?: string,
      page_size?: string,
      refresh?: string,
      cluster?: string,
    } = {};

    queryParams.from = 'now-5m';
    queryParams.to = 'now';
    Object.entries(parameters).forEach(([key, value]) => {
      switch (key) {
        case 'environment':
          queryParams['var-environment'] = value;
          break;
        case 'node_name':
          queryParams['var-node_name'] = value;
          break;
        case 'cluster':
          queryParams['var-cluster'] = value;
          break;
        case 'service_name':
          queryParams['var-service_name'] = value;
          break;
        case 'application_name':
          queryParams['var-application_name'] = value;
          break;
        case 'database':
          queryParams['var-database'] = value;
          break;
        case 'columns':
          queryParams.columns = value;
          break;
        case 'from':
          queryParams.from = value;
          break;
        case 'to':
          queryParams.to = value;
          break;
        case 'search':
          queryParams.dimensionSearchText = value;
          break;
        case 'page_number':
          queryParams.page_number = value;
          break;
        case 'page_size':
          queryParams.page_size = value;
          break;
        case 'refresh':
          queryParams.refresh = value;
          break;
        default:
      }
    });

    return buildUrl(url, { queryParams });
  }
}

export = BrowserHelper;