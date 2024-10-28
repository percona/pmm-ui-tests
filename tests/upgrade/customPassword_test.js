const assert = require('assert');
const { SERVICE_TYPE } = require('../helper/constants');

Feature('PMM upgrade tests for custom password').retry(1);

const { dashboardPage } = inject();

const clientDbServices = new DataTable(['serviceType', 'name', 'metric', 'annotationName', 'dashboard', 'upgrade_service']);

clientDbServices.add([SERVICE_TYPE.MYSQL, 'ps_pmm_8.0', 'mysql_global_status_max_used_connections', 'annotation-for-mysql', dashboardPage.mysqlInstanceSummaryDashboard.url, 'mysql']);
clientDbServices.add([SERVICE_TYPE.POSTGRESQL, 'pgsql_pgss_pmm_17', 'pg_stat_database_xact_rollback', 'annotation-for-postgres', dashboardPage.postgresqlInstanceSummaryDashboard.url, 'pgsql']);
// clientDbServices.add([SERVICE_TYPE.MONGODB, 'mongodb_', 'mongodb_connections', 'annotation-for-mongo', dashboardPage.mongoDbInstanceSummaryDashboard.url, 'mongo']);

Data(clientDbServices).Scenario(
  'Adding custom agent Password, Custom Label before upgrade At service Level @pre-custom-password-upgrade',
  async ({
    I, inventoryAPI, current,
  }) => {
    const {
      serviceType, name, upgrade_service,
    } = current;
    const {
      service_id, node_id, address, port,
    } = await inventoryAPI.apiGetNodeInfoForAllNodesByServiceName(serviceType, name);

    console.log(await I.verifyCommand('docker ps -a'));

    const { agent_id: pmm_agent_id } = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);
    let output;

    switch (serviceType) {
      case SERVICE_TYPE.MYSQL:
        output = await I.verifyCommand(
          `pmm-admin add mysql --node-id=${node_id} --pmm-agent-id=${pmm_agent_id} --port=${port} --password=GRgrO9301RuF --host=${address} --query-source=perfschema --agent-password=uitests --custom-labels="testing=upgrade" ${upgrade_service}`,
        );
        break;
      case SERVICE_TYPE.POSTGRESQL:
        output = await I.verifyCommand(
          `pmm-admin add postgresql --username=postgres --password=oFukiBRg7GujAJXq3tmd --node-id=${node_id} --pmm-agent-id=${pmm_agent_id} --port=${port} --host=${address} --agent-password=uitests --custom-labels="testing=upgrade" ${upgrade_service}`,
        );
        break;
      case SERVICE_TYPE.MONGODB:
        output = await I.verifyCommand(
          `pmm-admin add mongodb --username=pmm_mongodb --password=GRgrO9301RuF --port=27023 --host=${address} --agent-password=uitests --custom-labels="testing=upgrade" ${upgrade_service}`,
        );
        break;
      default:
    }
  },
);

Data(clientDbServices).Scenario(
  'Verify if Agents added with custom password and custom label work as expected Post Upgrade @post-client-upgrade @post-custom-password-upgrade',
  async ({
    current, inventoryAPI, grafanaAPI,
  }) => {
    const {
      serviceType, metric, upgrade_service,
    } = current;

    const {
      custom_labels,
    } = await inventoryAPI.apiGetNodeInfoByServiceName(serviceType, upgrade_service);

    await grafanaAPI.checkMetricExist(metric, { type: 'service_name', value: upgrade_service });
    if (serviceType !== SERVICE_TYPE.MYSQL) {
      assert.ok(custom_labels, `Node Information for ${serviceType} added with ${upgrade_service} is empty, value returned are ${custom_labels}`);
      assert.ok(custom_labels.testing === 'upgrade', `Custom Labels for ${serviceType} added before upgrade with custom labels, doesn't have the same label post upgrade, value found ${custom_labels}`);
    }
  },
);

Scenario(
  'PMM-T1189 - verify user is able to change password after upgrade @post-custom-password-upgrade',
  async ({ I, homePage }) => {
    const newPass = process.env.NEW_ADMIN_PASSWORD || 'admin1';

    await I.unAuthorize();
    await I.verifyCommand(`docker exec pmm-server change-admin-password ${newPass}`);
    await I.Authorize('admin', newPass);
    await homePage.open();
  },
);
