import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cliHelper';

const checkZipFileContents = (arg) => {
    // ZIP_FILE_NAME=$(echo "${lines[-1]}" | awk '{ print $1 }')
    // run unzip -l "$ZIP_FILE_NAME"
};
test.describe('PMM Client "Generic" CLI tests', async () => {
  let PMM_VERSION;
  if ( process.env.CLIENT_VERSION == "dev-latest") {
    //TODO: refactor to use docker hub API to remove file-update dependency
    // See: https://github.com/Percona-QA/package-testing/blob/master/playbooks/pmm2-client_integration_upgrade_custom_path.yml#L41
    PMM_VERSION = cli.execute('curl -s https://raw.githubusercontent.com/Percona-Lab/pmm-submodules/PMM-2.0/VERSION | xargs')
        .stdout.trim();
  }

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L8
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L18
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L28
   */
  test('run pmm-admin without any arguments @client-generic', async ({}) => {
    const sudo = (parseInt((await cli.exec('id -u')).stdout) === 0) ? '' : 'sudo '
    const output = await cli.exec(`${sudo}pmm-admin`);
    await output.exitCodeEquals(1);
    await output.outContains('Usage: pmm-admin <command>');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L35
   */
  test('run pmm-admin help', async ({}) => {
    const output = await cli.exec(`sudo pmm-admin help`);
    await output.exitCodeEquals(1);
    await output.outContains('Usage: pmm-admin <command>');
  });

/**
 * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L42
 */
  test('run pmm-admin -h', async ({}) => {
    const output = await cli.exec(`sudo pmm-admin -h`);
    await output.assertSuccess();
    await output.outContains('Usage: pmm-admin <command>');
  });

/**
 * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L49
 */
  test('run pmm-admin with wrong option', async ({}) => {
    const output = await cli.exec(`sudo pmm-admin install`);
    await output.exitCodeEquals(1);
    await output.outContains('pmm-admin: error: unexpected argument install');
  });

/**
 * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L56
 */
  test('run pmm-admin list to check for available services', async ({}) => {
    const output = await cli.exec(`sudo pmm-admin list`);
    await output.assertSuccess();
  });

/**
 * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L62
 */
  test('run pmm-admin --version', async ({}) => {
    const output = await cli.exec(`sudo pmm-admin --version`);
    await output.assertSuccess();
    await output.outContains(`Version: ${PMM_VERSION}`);
  });

/**
 * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L70
 */
  test('run pmm-admin summary --help', async ({}) => {
    const output = await cli.exec(`sudo pmm-admin summary --help`);
    await output.assertSuccess();
    await output.outContains('Usage: pmm-admin summary');
  });

/**
 * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L77
 */
  test('run pmm-admin summary -h', async ({}) => {
    const output = await cli.exec(`sudo pmm-admin summary -h`);
    await output.assertSuccess();
    await output.outContains('Usage: pmm-admin summary');
  });

    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L84
     */
  test('run pmm-admin summary --version', async ({}) => {
    const output = await cli.exec(`sudo pmm-admin summary --version`);
    await output.assertSuccess();
    await output.outContains(`Version: ${PMM_VERSION}`);
  });

/**
 * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L91
 */
  test('run pmm-admin status and strict check version admin in output', async ({}) => {
    test.skip(true,'The version number for Feature Build can never be strict matched since packages are downloaded via tarball hence need to skip');
    const output = await cli.exec(`sudo pmm-admin status | grep pmm-admin | awk -F' ' '{print $3}'`);
    await output.assertSuccess();
    await output.outEquals(PMM_VERSION);
  });

    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L97
     */
  test('run pmm-admin status and strict check version agent in output', async ({}) => {
    test.skip(true,'The version number for Feature Build can never be strict matched since packages are downloaded via tarball hence need to skip');
    const output = await cli.exec(`sudo pmm-agent status | grep pmm-admin | awk -F' ' '{print $3}'`);
    await output.assertSuccess();
    await output.outEquals(PMM_VERSION);
  });

/**
 * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L103
 */
  test('run pmm-admin summary --server-url with http', async ({}) => {
    const output = await cli.exec(`sudo pmm-admin summary --server-url='http://admin:admin@localhost'`);
    await output.assertSuccess();
    await output.outContains('.zip created.');
      checkZipFileContents('echo "$output" | grep -E "43|44 files"');
  });

/**
 * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L112
 */
  test('run pmm-admin summary --server-url with https and verify warning', async ({}) => {
    const output = await cli.exec(`sudo pmm-admin summary --server-url='https://admin:admin@localhost'`);
    await output.assertSuccess();
      await output.outContains('certificate is not valid for any names');
    await output.outContains('.zip created.');
  });

/**
 * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L120
 */
  test('run pmm-admin summary --server-url --server-insecure-tls with https', async ({}) => {
    const output = await cli.exec(`sudo pmm-admin summary --server-url='http://admin:admin@localhost' --server-insecure-tls`);
    await output.assertSuccess();
    // there are problems with certificate Get "https://localhost/logs.zip": x509: certificate is not valid for any names,
    // but wanted to match localhost. Despite error archive s still created
    await output.outContains('.zip created.');
    checkZipFileContents('echo "$output" | grep -E "43|44 files"');
  });

/**
 * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L129
 */
  test('run pmm-admin summary --debug', async ({}) => {
    const output = await cli.exec(`sudo pmm-admin summary --debug`);
    await output.assertSuccess();
    await output.outContains('POST /v1/inventory/Services/List HTTP/1.1');
    await output.outContains('POST /v1/inventory/Agents/List HTTP/1.1'); // there are no request for those urls. but there are requests for /local/status
    await output.outContains('.zip created.');
  });

    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L138
     */
  test('run pmm-admin summary --trace', async ({}) => {
    const output = await cli.exec(`sudo pmm-admin summary --trace`);
    await output.assertSuccess();
    await output.outContainsMany([
      'POST /v1/inventory/Services/List HTTP/1.1',
      'POST /v1/inventory/Agents/List HTTP/1.1', // there are no request for those urls. but there are requests for /local/status
      '.zip created.']);
  });

    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L147
     */
  test('run pmm-admin summary --json', async ({}) => {
    const output = await cli.exec(`sudo pmm-admin summary --json`);
    await output.assertSuccess();
    await output.outContains('{\"filename\":\"');
    await output.outContains('.zip\"}');
  });

    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L155
     */
  test('run pmm-admin summary --filename empty', async ({}) => {
    const output = await cli.exec(`sudo pmm-admin summary --filename=""`);
    await output.assertSuccess();
    await output.outContains('.zip created.');
  });

    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L162
     */
  test('run pmm-admin summary --filename', async ({}) => {
    const output = await cli.exec(`sudo pmm-admin summary --filename="test.zip"`);
    await output.assertSuccess();
    await output.outContains('.zip created.');
  });

    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L169
     */
  test('run pmm-admin summary --filename=testformat.txt and verify generated file is a ZIP archive', async ({}) => {
    const FILENAME='testformat.txt'
    const output = await cli.exec(`sudo pmm-admin summary --filename="${FILENAME}"`);
    await output.assertSuccess();
    await output.outContains(`${FILENAME} created.`);
    const output2 = await cli.exec(`file ${FILENAME}`);
    await output2.outContains(`${FILENAME}: Zip archive data, at least v2.0 to extract`);
  });

/**
 * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L179
 */
  test('run pmm-admin summary --filename --skip-server', async ({}) => {
    const output = await cli.exec(`sudo pmm-admin summary --filename="test.zip" --skip-server`);
    await output.assertSuccess();
    await output.outContains('.zip created.');
    checkZipFileContents('echo "$output" | grep -E "5|6 files"');
  });

    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L188
     */
  test('run pmm-admin summary --skip-server', async ({}) => {
    const output = await cli.exec(`sudo pmm-admin summary --skip-server`);
    await output.assertSuccess();
    await output.outContains('.zip created.');
  });

    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L195
     */
  test('run pmm-admin summary --skip-server --trace', async ({}) => {
    const output = await cli.exec(`sudo pmm-admin summary --skip-server --trace`);
    await output.assertSuccess();
    await output.outContainsMany([
      '(*Runtime).Submit() POST /v1/inventory/Services/List HTTP/1.1',
      '(*Runtime).Submit() POST /v1/inventory/Agents/List HTTP/1.1',
      '.zip created.']);
  });

    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L204
     */
  test('run pmm-admin summary --skip-server --debug', async ({}) => {
    const output = await cli.exec(`sudo pmm-admin summary --skip-server --debug`);
    await output.assertSuccess();
    await output.outContainsMany([
      'POST /v1/inventory/Services/List HTTP/1.1',
      'POST /v1/inventory/Agents/List HTTP/1.1',
      '.zip created.']);
  });

    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L213
     */
  test('run pmm-admin summary --skip-server --json --debug --filename=json_export.zip', async ({}) => {
    const ZIP_FILE_NAME = 'json_export.zip';
    const output = await cli.exec(`sudo pmm-admin summary --skip-server --json --debug --filename=${ZIP_FILE_NAME}`);
    await output.assertSuccess();
    await output.outContainsMany([
      'POST /v1/inventory/Services/List HTTP/1.1',
      'POST /v1/inventory/Agents/List HTTP/1.1']);
  });

    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L222
     */
  test('run pmm-admin summary --pprof', async ({}) => {
    test.skip(true, 'skipping because -pprof flag takes a lot of time');
    const output = await cli.exec(`sudo pmm-admin summary --pprof`);
    await output.assertSuccess();
    await output.outContains('.zip created.');
    checkZipFileContents('$output" | grep "client/pprof/');
    checkZipFileContents('echo "$output" | grep "43 files"');
  });

    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L233
     */
  test('run pmm-admin summary --pprof --trace', async ({}) => {
    test.skip(true, 'skipping because -pprof flag takes a lot of time');
    const output = await cli.exec(`sudo pmm-admin summary --pprof --trace`);
    await output.assertSuccess();
    await output.outContainsMany([
      '(*Runtime).Submit() POST /v1/inventory/Services/List HTTP/1.1',
      '(*Runtime).Submit() POST /v1/inventory/Agents/List HTTP/1.1',
      '.zip created.']);
    checkZipFileContents('$output" | grep "client/pprof/');
  });

    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L245
     */
  test('run pmm-admin summary --pprof --debug', async ({}) => {
    test.skip(true, 'skipping because -pprof flag takes a lot of time');
    const output = await cli.exec(`sudo pmm-admin summary --pprof --debug`);
    await output.assertSuccess();
    await output.outContainsMany([
      'POST /v1/inventory/Services/List HTTP/1.1',
      'POST /v1/inventory/Agents/List HTTP/1.1',
      '.zip created.']);
    checkZipFileContents('$output" | grep "client/pprof/');
  });

    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L257
     */
  test('run pmm-admin summary --pprof --server-url with http', async ({}) => {
    test.skip(true, 'skipping because -pprof flag takes a lot of time');
    const output = await cli.exec(`sudo pmm-admin summary --pprof --server-url='http://admin:admin@localhost'`);
    await output.assertSuccess();
    await output.outContains('.zip created.');
    checkZipFileContents('$output" | grep "client/pprof/');
    checkZipFileContents('echo "$output" | grep "43 files"');
  });

    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L268
     */
  test('run pmm-admin summary --pprof --json', async ({}) => {
    test.skip(true, 'skipping because -pprof flag takes a lot of time');
    const output = await cli.exec(`sudo pmm-admin summary --pprof --json`);
    await output.assertSuccess();
    await output.outContainsMany([
      '{\"filename\":\"',
      '.zip\"']);
  });

    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L277
     */
  test('run pmm-admin summary --pprof --filename', async ({}) => {
    test.skip(true, 'skipping because -pprof flag takes a lot of time');
    const output = await cli.exec(`sudo pmm-admin summary --pprof --filename="test_pprof.zip"`);
    await output.assertSuccess();
    await output.outContains('test_pprof.zip created.');
    checkZipFileContents('$output" | grep "client/pprof/');
  });

    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L287
     */
  test('run pmm-admin summary --pprof --skip-server', async ({}) => {
    test.skip(true, 'skipping because -pprof flag takes a lot of time');
    const output = await cli.exec(`sudo pmm-admin summary --pprof --skip-server`);
    await output.assertSuccess();
    await output.outContains('.zip created.');
    checkZipFileContents('$output" | grep "client/pprof/');
    checkZipFileContents('echo "$output" | grep "8 files"');
  });

    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L298
     */
  test('run pmm-admin summary --pprof --debug --filename --skip-server', async ({}) => {
    test.skip(true, 'skipping because -pprof flag takes a lot of time');
    const ZIP_FILE_NAME = 'test_pprof_complex.zip';
    const output = await cli.exec(`pmm-admin summary --pprof --debug --filename=${ZIP_FILE_NAME} --skip-server`);
    await output.assertSuccess();
    await output.outContainsMany([
      'POST /v1/inventory/Services/List HTTP/1.1',
      'POST /v1/inventory/Agents/List HTTP/1.1',
      `${ZIP_FILE_NAME} created.`]);
    checkZipFileContents('$output" | grep "client/pprof/');
    checkZipFileContents('echo "$output" | grep "8 files"');
  });

    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L321
     */
  test('run pmm-admin annotate \'pmm-testing-check\'', async ({}) => {
    const output = await cli.exec(`sudo pmm-admin annotate "pmm-testing-check"`);
    await output.assertSuccess();
    await output.outContains('Annotation added.');
  });

    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L328
     */
  test('run pmm-admin annotate with text and tags, verify that it should work', async ({}) => {
    const output = await cli.exec(`sudo pmm-admin annotate --tags="testing" "testing-annotate"`);
    await output.assertSuccess();
    await output.outContains('Annotation added.');
  });


    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L342
     */
  test('run pmm-admin annotate without any text and verify it should not work', async ({}) => {
    const output = await cli.exec(`sudo pmm-admin annotate`);
    await output.exitCodeEquals(1);
    await output.outContains('pmm-admin: error: expected "<text>"');
  });

    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L349
     */
  test('run pmm-admin annotate with tags without text cannot be added', async ({}) => {
    const output = await cli.exec(`sudo pmm-admin annotate --tags="testing"`);
    await output.exitCodeEquals(1);
    await output.outContains('pmm-admin: error: expected "<text>"');
  });

  function check_postgres_encoding(database_name) {
    container_name="$(docker ps -f name=-server --format "{{ .Names }}")"
    docker exec $container_name su -l postgres -c "psql $database_name -c 'SHOW SERVER_ENCODING'" | grep UTF8

        [ "$status" -eq 0 ]
  }
    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L375
     */
@test "Check that pmm-managed database encoding is UTF8" {
    run check_postgres_encoding pmm-managed
  }
    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L379
     */
@test "Check that template1 database encoding is UTF8" {
    run check_postgres_encoding template1
  }
    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L383
     */
@test "run pmm-admin config without parameters package installation" {
    if $(which pmm-admin | grep -q 'pmm2-client'); then
    skip "Skipping this test, because pmm2-client is a tarball setup"
    fi
    run sudo pmm-admin config
    echo "$output"
        [ "$status" -eq 0 ]
    echo "${output}" | grep "pmm-agent is running."
  }
    /**
     * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/generic-tests.bats#L393
     */
@test "run pmm-admin config without parameters tarball installation" {
    if $(which pmm-admin | grep -qv 'pmm2-client'); then
    skip "Skipping this test, because pmm2-client is a package installation"
    fi
    run pmm-admin config
    echo "$output"
        [ "$status" -eq 1 ]
    echo "${output}" | grep "Failed to register pmm-agent on PMM Server: Node with name" # no information about failure reasons is shown
  }

});
