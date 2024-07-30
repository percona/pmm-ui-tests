import apiHelper from './helpers/api-helper';

interface ListNodes {
  generic?: NodeDetails[],
  container?: NodeDetails[],
}

interface NodeDetails {
  node_id: string,
  node_name: string,
  address: string,
  machine_id?: string,
}

export const inventoryApi = {
  async listNodes(): Promise<ListNodes> {
    return await (await apiHelper.get('v1/management/nodes', {})).json() as ListNodes;
  },
};
