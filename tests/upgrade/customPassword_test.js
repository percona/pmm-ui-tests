const assert = require('assert');
const { SERVICE_TYPE } = require('../helper/constants');

Feature('PMM upgrade tests for custom password');
const { dashboardPage } = inject();

const clientDbServices = new DataTable(['serviceType', 'name', 'metric', 'annotationName', 'dashboard', 'upgrade_service']);

clientDbServices.add([SERVICE_TYPE.MYSQL, 'ps-single', 'mysql_global_status_max_used_connections', 'annotation-for-mysql', dashboardPage.mysqlInstanceSummaryDashboard.url, 'mysql']);
clientDbServices.add([SERVICE_TYPE.POSTGRESQL, 'pgsql_pgss_pmm_16_service', 'pg_stat_database_xact_rollback', 'annotation-for-postgres', dashboardPage.postgresqlInstanceSummaryDashboard.url, 'postgresql']);
// clientDbServices.add([SERVICE_TYPE.MONGODB, 'rs101', 'mongodb_connections', 'annotation-for-mongo', dashboardPage.mongoDbInstanceSummaryDashboard.url, 'mongodb']);

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
    } = await inventoryAPI.apiGetNodeInfoForService(upgrade_service, name);

    const { agent_id: pmm_agent_id } = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);
    let output;

    switch (serviceType) {
      case SERVICE_TYPE.MYSQL:
        output = await I.verifyCommand(
          `pmm-admin add mysql --node-id=${node_id} --pmm-agent-id=${pmm_agent_id} --port=${port} --password=GRgrO9301RuF --host=${address} --query-source=perfschema --agent-password=uitests --custom-labels="testing=upgrade" upgrade-${upgrade_service}`,
        );
        break;
      case SERVICE_TYPE.POSTGRESQL:
        output = await I.verifyCommand(
          `pmm-admin add postgresql --username=pmm --password=pmm --node-id=${node_id} --pmm-agent-id=${pmm_agent_id} --port=${port} --host=${address} --agent-password=uitests --custom-labels="testing=upgrade" upgrade-${upgrade_service}`,
        );
        break;
      case SERVICE_TYPE.MONGODB:
        output = await I.verifyCommand(
          `pmm-admin add mongodb --username=pmm_mongodb --password="5M](Q%q/U+YQ<^m" --port=27017 --host=${address} --agent-password=uitests --custom-labels="testing=upgrade" upgrade-${upgrade_service}`,
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
      serviceType, metric, upgrade_service, name,
    } = current;
    const apiServiceDetails = (await inventoryAPI.apiGetServices()).data[upgrade_service].find((service) => service.service_name.startsWith(`upgrade-${upgrade_service}`));
    console.log('Details are: ');
    console.log(apiServiceDetails);
    const { custom_labels } = await inventoryAPI.apiGetNodeInfoByServiceName(serviceType, apiServiceDetails.service_name);

    console.log('Response is:');
    console.log(await inventoryAPI.apiGetNodeInfoByServiceName(serviceType, apiServiceDetails.service_name));

    await grafanaAPI.checkMetricExist(metric, { type: 'service_name', value: apiServiceDetails.service_name });
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
