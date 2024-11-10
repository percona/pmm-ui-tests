import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cli-helper';

const MONGO_USERNAME = 'pmm';
const MONGO_PASSWORD = 'pmmpass';
let mongoRplHosts: string[];
let mongoShardHosts: string[];

const replIpPort = '127.0.0.1:27027';
// const mongosIpPort = '127.0.0.1:27017';

// eslint-disable-next-line playwright/valid-describe-callback
test.describe('Percona Server MongoDB (PSMDB) CLI tests', async () => {
  test.beforeAll(async ({}) => {
    const result = await cli.exec('docker ps | grep rs101 | awk \'{print $NF}\'');
    await result.outContains('rs101', 'PSMDB rs101 docker container should exist. please run pmm-framework with --database psmdb,SETUP_TYPE=pss');
    const result1 = await cli.exec('sudo pmm-admin status');
    await result1.outContains('Running', 'pmm-client is not installed/connected locally, please run pmm3-client-setup script');
    const output = await cli.exec(`sudo pmm-admin add mongodb --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} prerequisite_1 ${replIpPort}`);
    await output.assertSuccess();
    // const output1 = await cli.exec(`sudo pmm-admin add mongodb --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} prerequisite_2 ${mongosIpPort}`);
    // await output1.assertSuccess();
    mongoRplHosts = (await cli.exec('sudo pmm-admin list | grep "MongoDB" | awk -F" " \'{print $3}\' | grep 27027'))
      .getStdOutLines();
    // mongoShardHosts = (await cli.exec('sudo pmm-admin list | grep "MongoDB" | awk -F" " \'{print $3}\'| grep 27017'))
    //  .getStdOutLines();
  });

  test.afterAll(async ({}) => {
    const output = await cli.exec('sudo pmm-admin remove mongodb prerequisite_1');
    await output.assertSuccess();
    // const output1 = await cli.exec('sudo pmm-admin remove mongodb prerequisite_2');
    // await output1.assertSuccess();
  });

  test('@PMM-T1539 Verify that MongoDB exporter shows version for mongos instance @pmm-psmdb-shard-cli', async ({}) => {
    const edition = 'Community';
    const containerName = (await cli.exec('docker ps --format "table {{.ID}}\\t{{.Image}}\\t{{.Names}}" | grep \'rs101\' | awk -F " " \'{print $3}\'')).getStdOutLines();
    const version = (await cli.exec(`docker exec ${containerName} mongod --version | awk 'NR==1 {print $3;exit}' | cut -c2-`)).getStdOutLines();
    const agentId = (await cli.exec(`docker exec ${containerName} pmm-admin list | grep "42002" | awk -F " " '{print $4}'`)).getStdOutLines();
    const serviceId = (await cli.exec(`docker exec ${containerName} pmm-admin list | grep "rs101" | awk -F " " '{print $4}'`)).getStdOutLines();
    const port = (await cli.exec(`docker exec ${containerName} pmm-admin list | grep "mongodb_exporter.*${serviceId}" | awk -F " " '{print $6}'`)).getStdOutLines();
    const output = (await cli.exec(`docker exec ${containerName} curl --silent -u pmm:${agentId} localhost:${port}/metrics | grep -o "mongodb_version_info{.*}"`)).getStdOutLines();
    const actualExactVersion = output[0].match(/(?<=mongodb=").*?(?=")/);
    const actualEdition = output[0].match(/(?<=edition=").*?(?=")/);
    expect(actualExactVersion, `Scraped metrics must contain ${version[0]}!`).toContain(version[0]);
    expect(actualEdition, `Scraped metrics must contain ${edition}!`).toContain(edition);
  });
});
