import apiHelper from './helpers/apiHelper';

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

export const inventory = {
  async listNodes(): Promise<ListNodes> {
    const responseBody: ListNodes = await (await apiHelper.post('v1/inventory/Nodes/List', {
    })).json();

    return responseBody;
  },
};
