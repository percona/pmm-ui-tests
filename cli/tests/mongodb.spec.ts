import { test, expect } from '@playwright/test';
// import cli = require('@helpers/cliHelper'); //optional way to import with local name
import * as cli from '@helpers/cliHelper';
import Output from "@support/types/output";

let addMongoHelp:Output;

test.beforeAll(async ({}) =>{
  addMongoHelp = await cli.exec('pmm-admin add mongodb --help');
  await addMongoHelp.assertSuccess();
  /*

function pmm_framework_add_clients() {
  if [[ $1 == "pxc" ]]; then
    pmm_client_docker_test
    ${DIRNAME}/../pmm-framework.sh --addclient=$1,$2 --with-proxysql --${1}-version=$3 --pmm2 --download --pmm2-server-ip=$4
  else
    ${DIRNAME}/../pmm-framework.sh --addclient=$1,$2 --${1}-version=$3 --pmm2 --dbdeployer --download --pmm2-server-ip=$4
  fi
}

function pmm_client_docker_test () {
  ${DIRNAME}/../pmm-framework.sh --setup-pmm-client-docker
}


function pmm_remove_packages() {
  ${DIRNAME}/../pmm-framework.sh --delete-package --package-name=$1 --${1}-version=$2
}

# functions for some env setup

function setup_local_consul_exporter() {
  echo "Setting up consul_exporter"
  FILE_NAME="consul_exporter-0.3.0.linux-amd64.tar.gz"

  if [ -f ${FILE_NAME}  ]; then
    echo "File exists"
  else
    wget https://github.com/prometheus/consul_exporter/releases/download/v0.3.0/consul_exporter-0.3.0.linux-amd64.tar.gz
    tar -zxpf consul_exporter-0.3.0.linux-amd64.tar.gz
  fi

  IP_ADDR=$(ip route get 1 | awk '{print $NF;exit}')
  echo "Running consul_exporter"
  echo "IMPORTANT: pmm-server docker should be run with additional -p 8500:8500"
  ./consul_exporter-0.3.0.linux-amd64/consul_exporter -consul.server http://${IP_ADDR}:8500 > /dev/null 2>&1 &
}

# Running tests
echo "Wipe clients"
pmm_wipe_clients

# Running tests
echo "Wipe clients"
pmm_wipe_clients

echo "Adding clients for DB's"
if [[ $instance_t != "generic" ]]; then
  pmm_framework_add_clients $instance_t $instance_c $version $pmm_server_ip
fi

if [[ $instance_t == "mo" ]] ; then
  echo "Running MongoDB specific tests"
  run_mongodb_specific_tests
fi

if [[ $instance_t == "modb" ]] ; then
  echo "Running MongoDB specific tests"
  run_modb_specific_tests
fi

if [[ $instance_t == "ps" ]]; then
  echo "Running PS specific tests"
  run_ps_specific_tests
fi

if [[ $instance_t == "ms" ]]; then
  echo "Running MS specific tests"
  run_ms_specific_tests
fi

if [[ $instance_t == "pgsql" ]]; then
  echo "Running Postgre SQL specific tests"
  run_postgresql_specific_tests
fi

if [[ $instance_t == "pxc" ]]; then
  echo "Running Postgre SQL specific tests"
  run_proxysql_tests
  run_docker_env_variable_tests
fi

if [[ $instance_t == "generic" ]]; then
  echo "Running generic tests"
  run_generic_tests
  echo "Running Version and Unregister Command Tests"
  run_version_json_unregister_tests
fi

if [[ $instance_t == "haproxy" ]]; then
  echo "Running haproxy tests"
  run_haproxy_specific_tests
fi
echo "Finished Checking Testsuite"
   */

});

test.describe('Spec file for MongoDB CLI tests ', async () => {

  test('pmm-admin mongodb --help check for socket @cli @mongo', async ({}) => {
    let output = await cli.exec('pmm-admin add mongodb --help');
/*
    echo "$output"
        [ "$status" -eq 0 ]
    [[ ${lines[0]} =~ "Usage: pmm-admin add mongodb [<name> [<address>]]" ]]
    echo "${output}" | grep -- "--socket=STRING"
*/
    await test.step('Verify "--socket=STRING" is present', async () => {
      output.assertSuccess();
      await expect(output.stdout).toContain('Usage: pmm-admin add mongodb [<name> [<address>]]');
      await expect(output.stdout).toContain('--socket=STRING');
    });
  });

  test('run pmm-admin add mongodb --help to check metrics-mode="auto" @mongo', async ({}) => {
    let output = await cli.exec('pmm-admin add mongodb --help');
/*
    echo "$output"
        [ "$status" -eq 0 ]
    echo "${output}" | grep "metrics-mode=\"auto\""
*/
    await test.step('Verify metrics-mode="auto" is present', async () => {
      output.assertSuccess();
      await expect(output.stdout).toContain('Usage: pmm-admin add mongodb [<name> [<address>]]');
      await expect(output.stdout).toContain('metrics-mode="auto"');
    });
  });

  test('run pmm-admin add mongodb --help to check host @mongo', async ({}) => {
    let output = await cli.exec('pmm-admin add mongodb --help');
/*
    echo "$output"
        [ "$status" -eq 0 ]
    echo "${output}" | grep "host"
*/
    await test.step('Verify "metrics-mode="auto"" is present', async () => {
      output.assertSuccess();
      await expect(output.stdout).toContain('Usage: pmm-admin add mongodb [<name> [<address>]]');
      await expect(output.stdout).toContain('host');
    });
  });

  test('run pmm-admin add mongodb --help to check port @mongo', async ({}) => {
    let output = await cli.exec('pmm-admin add mongodb --help');
/*
    echo "$output"
        [ "$status" -eq 0 ]
    echo "${output}" | grep "port"
*/
    await test.step('Verify "port" is present', async () => {
      output.assertSuccess();
      await expect(output.stdout).toContain('Usage: pmm-admin add mongodb [<name> [<address>]]');
      await expect(output.stdout).toContain('--socket=STRING');
    });
  });

  test('run pmm-admin add mongodb --help to check service-name @mongo', async ({}) => {
    let output = await cli.exec('pmm-admin add mongodb --help');
/*
    echo "$output"
        [ "$status" -eq 0 ]
    echo "${output}" | grep "service-name"
*/
    await test.step('Verify "service-name" is present', async () => {
      output.assertSuccess();
      await expect(output.stdout).toContain('Usage: pmm-admin add mongodb [<name> [<address>]]');
      await expect(output.stdout).toContain('service-name');
    });
  });

  test('@PMM-T925 - Verify help for pmm-admin add mongodb has TLS-related flags @mongo', async ({}) => {
    let output = await cli.exec('pmm-admin add mongodb --help');

/*
    echo "$output"
        [ "$status" -eq 0 ]
    echo "${output}" | grep "tls                        Use TLS to connect to the database"
    echo "${output}" | grep "tls-skip-verify            Skip TLS certificates validation"
    echo "${output}" | grep "tls-certificate-key-file=STRING"
    echo "${output}" | grep "tls-certificate-key-file-password=STRING"
    echo "${output}" | grep "tls-ca-file=STRING         Path to certificate authority file"
    echo "${output}" | grep "authentication-mechanism=STRING"
    echo "${output}" | grep "authentication-database=STRING"
*/
    await output.assertSuccess()
    await output.containsMany([
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
