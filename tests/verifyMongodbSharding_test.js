Feature('MongoDB Sharding tests');

const { adminPage } = inject();
const pmmFrameworkLoader = `bash ${adminPage.pathToFramework}`;
const exactMongoDbInfo = new DataTable(['version', 'exactVersion', 'edition']);

// exactMongoDbInfo.add(['4.0', 'TBD', 'Community']);
exactMongoDbInfo.add(['4.2', '4.2.23-23', 'Community']);
exactMongoDbInfo.add(['4.4', '4.4.16-16', 'Community']);
// exactMongoDbInfo.add(['5.0', 'TBD', 'Community']);
exactMongoDbInfo.add(['6.0', '6.0.2-1', 'Community']);

Data(exactMongoDbInfo).Scenario(
  '@PMM-T1539 Verify that MongoDB exporter shows version for mongos instance @mongodb-exporter',
  async ({
    I, current,
  }) => {
    const { version, exactVersion, edition } = current;

    await I.verifyCommand(`${pmmFrameworkLoader} --mongomagic --with-sharding --pmm2 --mo-version=${version}`);
    const containerName = await I.verifyCommand(`docker ps --format "table {{.ID}}\\t{{.Image}}\\t{{.Names}}" | grep 'psmdb.*${version}' | awk -F " " '{print $3}'`);
    const agentId = await I.verifyCommand(`docker exec ${containerName} pmm-admin list | grep "42002" | awk -F " " '{print $4}'`);

    const actualEdition = await I.verifyCommand(`docker exec ${containerName} curl --silent -u pmm:${agentId} localhost:42002/metrics | grep "mongodb_version_info" | grep -oP '(?<=edition=").*?(?=")'`);
    const actualExactVersion = await I.verifyCommand(`docker exec ${containerName} curl --silent -u pmm:${agentId} localhost:42002/metrics | grep "mongodb_version_info" | grep -oP '(?<=mongodb=").*?(?=")'`);

    I.assertEqual(
      actualEdition,
      edition,
      `Expected the Edition of MongoDB to be equal to ${edition} but found ${actualEdition}`,
    );

    I.assertEqual(
      actualExactVersion,
      exactVersion,
      `Expected the Version of MongoDB to be equal to ${exactVersion} but found ${actualExactVersion}`,
    );

    await I.verifyCommand(`docker rm -f ${containerName}`);
  },
);
