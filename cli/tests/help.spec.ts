import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cliHelper';
import Output from "@support/types/output";

let addMongoHelp:Output;
let addPostgreSqlHelp:Output;

test.beforeAll(async ({}) =>{
  addMongoHelp = await cli.execSilent('sudo pmm-admin add mongodb --help');
  await addMongoHelp.assertSuccess();
  addPostgreSqlHelp = await cli.execSilent('sudo pmm-admin add postgresql --help');
  await addMongoHelp.assertSuccess();
});

test.describe('PMM Client "--help" validation', async () => {

   /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L182
   */
  test('pmm-admin mongodb --help check for socket', async ({}) => {
    await addMongoHelp.outContains('Usage: pmm-admin add mongodb [<name> [<address>]]');
    await addMongoHelp.outContains('--socket=STRING');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L191
   */
  test('run pmm-admin add mongodb --help to check metrics-mode="auto"', async ({}) => {
    await addMongoHelp.outContains('metrics-mode="auto"');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L198
   */
  test('run pmm-admin add mongodb --help to check host', async ({}) => {
    await addMongoHelp.outContains('host');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L205
   */
  test('run pmm-admin add mongodb --help to check port', async ({}) => {
    await addMongoHelp.outContains('port');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L212
   */
  test('run pmm-admin add mongodb --help to check service-name', async ({}) => {
    await addMongoHelp.outContains('service-name');
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

  // /**
  //  * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L112
  //  */
  // test('PMM-T443 run pmm-admin add postgresql --help to check version', async ({}) => {
  //   await addMongoHelp.outContains('version');
  // });
  //
  // /**
  //  * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L119
  //  */
  // test('run pmm-admin add postgresql --help to check metrics-mode=auto', async ({}) => {
  //   await addMongoHelp.outContains('metrics-mode="auto"');
  // });
  //
  // /**
  //  * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L126
  //  */
  // test('PMM-T443 run pmm-admin add postgresql --help to check server-url', async ({}) => {
  //   await addMongoHelp.outContains('server-url=SERVER-URL');
  // });
  //
  // /**
  //  * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L133
  //  */
  // test('PMM-T443 run pmm-admin add postgresql --help to check server-insecure-tls', async ({}) => {
  //   await addMongoHelp.outContains('server-insecure-tls');
  // });
  //
  // /**
  //  * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L140
  //  */
  // test('PMM-T443 run pmm-admin add postgresql --help to check debug', async ({}) => {
  //   await addMongoHelp.outContains('debug');
  // });
  //
  // /**
  //  * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L147
  //  */
  // test('PMM-T443 run pmm-admin add postgresql --help to check trace', async ({}) => {
  //   await addPostgreSqlHelp.outContains('trace');
  // });
  //
  // /**
  //  * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L154
  //  */
  // test('PMM-T443 run pmm-admin add postgresql --help to check json', async ({}) => {
  //   await addPostgreSqlHelp.outContains('json');
  // });
  //
  // /**
  //  * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L161
  //  */
  // test('PMM-T443 run pmm-admin add postgresql --help to check socket', async ({}) => {
  //   await addPostgreSqlHelp.outContains('socket=STRING');
  // });
  //
  // /**
  //  * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L168
  //  */
  // test('PMM-T443 run pmm-admin add postgresql --help to check node-id', async ({}) => {
  //   await addPostgreSqlHelp.outContains('node-id=STRING');
  // });
  //
  // /**
  //  * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L175
  //  */
  // test('PMM-T443 run pmm-admin add postgresql --help to check pmm-agent-id', async ({}) => {
  //   await addPostgreSqlHelp.outContains('pmm-agent-id=STRING');
  // });
  //
  // /**
  //  * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L182
  //  */
  // test('PMM-T443 run pmm-admin add postgresql --help to check username', async ({}) => {
  //   await addPostgreSqlHelp.outContains('username="postgres"');
  // });
  //
  // /**
  //  * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L189
  //  */
  // test('PMM-T443 run pmm-admin add postgresql --help to check password', async ({}) => {
  //   await addPostgreSqlHelp.outContains('password=STRING');
  // });
  //
  // /**
  //  * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L196
  //  */
  // test('PMM-T443 run pmm-admin add postgresql --help to check query-source', async ({}) => {
  //   await addPostgreSqlHelp.outContains('query-source="pgstatements"');
  // });
  //
  // /**
  //  * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L203
  //  */
  // test('PMM-T443 run pmm-admin add postgresql --help to check evironment', async ({}) => {
  //   await addPostgreSqlHelp.outContains('environment=STRING');
  // });
  //
  // /**
  //  * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L210
  //  */
  // test('PMM-T443 run pmm-admin add postgresql --help to check cluster', async ({}) => {
  //   await addPostgreSqlHelp.outContains('cluster=STRING');
  // });
  //
  // /**
  //  * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L217
  //  */
  // test('PMM-T443 run pmm-admin add postgresql --help to check replication-set', async ({}) => {
  //   await addPostgreSqlHelp.outContains('replication-set=STRING');
  // });
  //
  // /**
  //  * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L224
  //  */
  // test('PMM-T443 run pmm-admin add postgresql --help to check custom-labels', async ({}) => {
  //   await addPostgreSqlHelp.outContains('custom-labels=KEY=VALUE,...');
  // });
  //
  // /**
  //  * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L231
  //  */
  // test('PMM-T443 run pmm-admin add postgresql --help to check skip-connection-check', async ({}) => {
  //   await addPostgreSqlHelp.outContains('skip-connection-check');
  // });
  //
  // /**
  //  * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L238
  //  */
  // test('PMM-T443 run pmm-admin add postgresql --help to check tls', async ({}) => {
  //   await addPostgreSqlHelp.outContains('tls');
  // });
  //
  // /**
  //  * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L245
  //  */
  // test('PMM-T443 run pmm-admin add postgresql --help to check tls-skip-verify', async ({}) => {
  //   await addPostgreSqlHelp.outContains('tls-skip-verify');
  // });
  //
  // /**
  //  * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L252
  //  */
  // test('PMM-T443 run pmm-admin add postgresql --help to check disable-queryexamples', async ({}) => {
  //   await addPostgreSqlHelp.outContains('disable-queryexamples');
  // });
  //
  // /**
  //  * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L259
  //  */
  // test('PMM-T443 run pmm-admin add postgresql --help to check database', async ({}) => {
  //   await addPostgreSqlHelp.outContains('database=STRING            PostgreSQL database');
  // });

  /**
   * Possible variant instead of 150 lines of tests
   *
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L112
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L119
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L126
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L133
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L140
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L147
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L154
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L161
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L168
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L175
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L182
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L189
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L196
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L203
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L210
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L217
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L224
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L231
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L238
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L245
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L252
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L259
   */
  test('PMM-T443 Verify pmm-admin add postgresql --help', async ({}) => {
    await addPostgreSqlHelp.outContainsMany([
      'version',
      'metrics-mode="auto"',
      'server-url=SERVER-URL',
      'server-insecure-tls',
      'debug',
      'trace',
      'json',
      'socket=STRING',
      'node-id=STRING',
      'pmm-agent-id=STRING',
      'username="postgres"',
      'password=STRING',
      'query-source="pgstatements"',
      'environment=STRING',
      'cluster=STRING',
      'replication-set=STRING',
      'custom-labels=KEY=VALUE,...',
      'skip-connection-check',
      'disable-queryexamples',
      'database=STRING            PostgreSQL database',
    ]);
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L333
   */
  test('PMM-T945 - Verify help for pmm-admin add postgresql has TLS-related flags', async ({}) => {
    await addPostgreSqlHelp.outContainsMany([
      'tls                        Use TLS to connect to the database',
      'tls-skip-verify            Skip TLS certificates validation',
      'tls-cert-file=STRING       TLS certificate file',
      'tls-key-file=STRING        TLS certificate key file',
      'tls-ca-file=STRING         TLS CA certificate file',
    ]);
  });
});
