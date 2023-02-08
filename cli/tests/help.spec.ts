import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cliHelper';
import Output from "@support/types/output";

let addMongoHelp:Output;

test.beforeAll(async ({}) =>{
  addMongoHelp = await cli.exec('sudo pmm-admin add mongodb --help');
  await addMongoHelp.assertSuccess();
});

test.describe('PMM Client "--help" validation', async () => {

   /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L182
   */
  test('pmm-admin mongodb --help check for socket', async ({}) => {
    await test.step('Verify "--socket=STRING" is present', async () => {
      await addMongoHelp.outContains('Usage: pmm-admin add mongodb [<name> [<address>]]');
      await addMongoHelp.outContains('--socket=STRING');
    });
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L191
   */
  test('run pmm-admin add mongodb --help to check metrics-mode="auto"', async ({}) => {
    await test.step('Verify metrics-mode="auto" is present', async () => {
      await addMongoHelp.outContains('metrics-mode="auto"');
    });
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L198
   */
  test('run pmm-admin add mongodb --help to check host', async ({}) => {
    await test.step('Verify "host" is present', async () => {
      await addMongoHelp.outContains('host');
    });
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L205
   */
  test('run pmm-admin add mongodb --help to check port', async ({}) => {
    await test.step('Verify "port" is present', async () => {
      await addMongoHelp.outContains('port');
    });
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L212
   */
  test('run pmm-admin add mongodb --help to check service-name', async ({}) => {
    await test.step('Verify "service-name" is present', async () => {
      await addMongoHelp.outContains('service-name');
    });
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L287
   */
  test('PMM-T925 Verify pmm-admin add mongodb --help has TLS-related flags', async ({}) => {
    await addMongoHelp.outContainsMany([
      'tls                        Use TLS to connect to the database',
      'tls-skip-verify            Skip TLS certificates validation',
      'tls-certificate-key-file=STRING',
      'tls-certificate-key-file-password=STRING',
      'tls-ca-file=STRING         Path to certificate authority file',
      'authentication-mechanism=STRING',
      'authentication-database=STRING',
    ]);
  });
});
