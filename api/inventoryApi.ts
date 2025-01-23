const { I } = inject();

class Inventory {
  constructor() {}

  getServices = async () => {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const url = 'v1/management/services';

    return (await I.sendGetRequest(url, headers)).data.services;
  }

  apiGetAgents = async (serviceId: string) => {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const url = serviceId ? `v1/management/agents?service_id=${serviceId}` : 'v1/inventory/agents';

    return I.sendGetRequest(url, headers);
  }

  getServiceByPartialName = async (partialName: string) => {
    const services = await this.getServices();

    return services.find((service) => service.service_name.includes(partialName));
  }
}

export default Inventory;
