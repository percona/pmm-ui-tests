
# PMM UI End-to-End Tests

Automated end-to-end tests for Percona Monitoring and Management (PMM) UI, covering both CodeceptJS and Playwright frameworks. This project enables seamless local and CI test execution, with robust environment orchestration and reporting.

---

## Project Structure

- `tests/` — CodeceptJS test suites, helpers, and page objects
- `playwright-tests/` — Playwright test suites and configs (DEPRECATED TESTS)
- `cli/` — CLI test automation
- `docker-compose*.yml` — PMM server and test environment orchestration
- `testdata/` — DB setup and backup scripts
- `README.md`, `CONTRIBUTING.md` — workflow and contribution guidelines

---

## Prerequisites

- **Node.js** v22+ (with `npx`)
- **Docker** (ensure your user is in the `docker` group or run with `sudo`)
- **Git**
- (Optional) **Java 8+** for Allure commandline reports

> **Note:**
> - On Linux, add your user to the docker group: `sudo groupadd docker; sudo usermod -aG docker $USER`
> - Log out and back in after adding to the group.
> - Ensure Docker is running before starting tests.

---

## Quick Start (Recommended)

The easiest and most reliable way to run local E2E tests is via the provided script, which automates environment setup, dependencies, Docker, and test execution.

```sh
./run-e2e-locally.sh --grep @tag
```

Replace `@tag` with the tag(s) of the tests you want to run (see below for available tags).


Supported tags:

@settings|@cli, @ssl-mysql, @ssl-mongo, @ssl-postgres, @experimental, @disconnect, @bm-mongo, @bm-locations, @pmm-psmdb-replica-integration, @exporters, @mongodb-exporter, @fb-instances, @fb-alerting, @fb-settings, @pgsm-pmm-integration, @pgss-pmm-integration, @user-password, @dump, @service-account, @pmm-psmdb-arbiter-integration, @fb-pmm-ps-integration, @rbac, @fb-encryption, @docker-configuration, @nomad

This script will:
- Install dependencies
- Set up the PMM server and required services via Docker Compose
- Build TypeScript definitions
- Run the tests with the specified tag(s)
- Optionally, generate reports

---

### ⚠️ Attention: Clean Environment Recommended

It is best practice in the testing world to always start tests in a "clean" environment that does not interfere with previous or future results. We strongly recommend always performing a clean run. To avoid issues on your personal machine, we suggest using a dedicated instance solely for running tests.

To clean all Docker resources before running the tests, execute:

```sh
docker stop $(docker ps -aq) 2>/dev/null
docker rm -f $(docker ps -aq) 2>/dev/null
docker rmi -f $(docker images -aq) 2>/dev/null
docker volume rm $(docker volume ls -q) 2>/dev/null
docker network prune -f
docker builder prune -af
```

> **Important:**
> - These commands will remove ALL containers, images, volumes, and Docker networks from your system.
> - Use them only in dedicated test environments.
> - Do NOT run on machines with other important Docker projects.

---



<details>
<summary><strong>Advanced: Manual Setup & Test Execution</strong></summary>

To manually reproduce what the script does, follow these steps in order. This ensures your environment matches the script's automation and supports all tag variations.

1. **Install system dependencies (Ubuntu 22.04 recommended):**
   ```sh
   sudo apt-get install -y apt-transport-https ca-certificates dirmngr ansible libaio1 libaio-dev libnuma-dev libncurses5 socat sysbench
   sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 8919F6BD2B48D754
   echo "deb https://packages.clickhouse.com/deb stable main" | sudo tee /etc/apt/sources.list.d/clickhouse.list
   sudo apt-get update
   sudo apt-get install -y git python3 python3-pip python3-venv nodejs dos2unix ansible clickhouse-client
   sudo curl -s https://raw.githubusercontent.com/datacharmer/dbdeployer/master/scripts/dbdeployer-install.sh | bash || true
   npx playwright install-deps || true
   ```

2. **Clone or update the QA integration repository:**
   ```sh
   # Default branch is v3, override as needed
   if [ ! -d "../qa-integration" ]; then
     git clone --branch v3 --single-branch https://github.com/Percona-Lab/qa-integration.git ../qa-integration
   else
     (cd ../qa-integration && git fetch && git checkout v3 && git pull)
   fi
   ```

3. **Select Docker Compose file based on tag:**
   - For most tags: `docker-compose.yml`
   - For `@nomad`: `docker-compose-nomad.yml`

4. **Create Docker network (if needed):**
   ```sh
   docker network create pmm-qa || true
   ```

5. **Start PMM environment:**
   ```sh
   # Replace COMPOSE_FILE as needed
   docker compose -f docker-compose.yml up -d
   # or for nomad:
   # docker compose -f docker-compose-nomad.yml up -d
   ```

6. **Wait for PMM Server to be ready:**
   ```sh
   sleep 60
   ```

7. **Set admin password:**
   ```sh
   docker exec pmm-server change-admin-password admin-password || true
   ```

8. **Run DB setup script:**
   ```sh
   bash -x testdata/db_setup.sh
   ```

9. **Connect Docker network (if needed):**
   ```sh
   docker network connect pmm-qa pmm-server || true
   ```

10. **Set up PMM Client:**
   ```sh
   (cd ../qa-integration/pmm_qa && sudo bash -x pmm3-client-setup.sh --pmm_server_ip 192.168.0.1 --client_version 3-dev-latest --admin_password admin-password --use_metrics_mode no)
   ```

11. **Prepare Python environment for E2E tests:**
   ```sh
   (cd ../qa-integration/pmm_qa && \
     mkdir -m 777 -p /tmp/backup_data && \
     python3 -m venv virtenv && \
     . virtenv/bin/activate && \
     pip install --upgrade pip && \
     pip install -r requirements.txt && \
     pip install setuptools && \
     pip install ansible)
   ```

12. **Determine SETUP_ARGS for your tag:**
   - The script auto-selects setup args based on the tag. Here are the mappings:

     | Tag(s)                                 | SETUP_ARGS                                      |
     |----------------------------------------|-------------------------------------------------|
     | @settings, @cli                        | --database=pgsql                                |
     | @ssl-mysql                             | --database=ssl_mysql                            |
     | @ssl-mongo                             | --database=ssl_psmdb                            |
     | @ssl-postgres                          | --database=ssl_pdpgsql=16                        |
     | @experimental                          | --database=pdpgsql                              |
     | @disconnect                            | --help                                          |
     | @bm-mongo, @bm-locations, @pmm-psmdb-replica-integration | --database=psmdb,SETUP_TYPE=pss         |
     | @exporters                             | --database=ps,QUERY_SOURCE=slowlog               |
     | @mongodb-exporter                      | --database=psmdb                                 |
     | @fb-instances                          | --database=ps --database=external --database=haproxy |
     | @fb-alerting, @fb-settings             | --database=mysql                                 |
     | @pgsm-pmm-integration                  | --database=pdpgsql                               |
     | @pgss-pmm-integration                  | --database=pgsql                                 |
     | @user-password                         | --addclient=ps,1 --addclient=modb,1              |
     | @dump                                  | --database=ps                                    |
     | @service-account                       | --database=ps=8.0                                |
     | @pmm-psmdb-arbiter-integration         | --database=psmdb,SETUP_TYPE=psa                  |
     | @fb-pmm-ps-integration                 | --database=ps=8.0,QUERY_SOURCE=slowlog           |
     | @rbac                                  | --database=ps --database=pdpgsql                 |
     | @fb-encryption                         | --database=ps=8.0                                |
     | @docker-configuration                  | -h                                              |
     | @nomad                                 | --database=ps=8.4 --database=pdpgsql --database=psmdb |
     | * (any other tag)                      | --database=ps                                    |

13. **Run the Python setup for your tag:**
   ```sh
   (cd ../qa-integration/pmm_qa && \
     . virtenv/bin/activate && \
     python pmm-framework.py $SETUP_ARGS --pmm-server-password="admin-password" --verbose)
   ```

14. **Install npm dependencies and Playwright:**
   ```sh
   npm ci
   npx playwright install --with-deps
   envsubst < env.list > env.generated.list
   ```

15. **Build TypeScript definitions:**
   ```sh
   npx codeceptjs def pr.codecept.js
   ```

16. **Run tests:**
   - All CodeceptJS: `npx codeceptjs run -c pr.codecept.js`
   - Parallel: `npx codeceptjs run-multiple parallel -c pr.codecept.js`
   - By file: `npx codeceptjs run -c pr.codecept.js tests/verifyMysqlDashboards_test.js`
   - By tag: `npx codeceptjs run -c pr.codecept.js --grep @tag`

</details>

---

## Test Reports

- **Allure (Docker):**
  1. `docker-compose -f docker-compose-allure.yml up -d`
  2. Open [http://localhost:5252/](http://localhost:5252/)
- **Allure (CLI):**
  1. `npm install -g allure-commandline --save-dev`
  2. `allure serve tests/output/allure`
- **HTML (Mochawesome):**
  1. Run with `-R mocha-multi` flag
  2. Open `/tests/output/result.html`
- **Terminal**
   If you dont require any advanced report, you will be able to see results on the terminal.

---

## Available Tags

Use `--grep @tag` to run specific groups of tests. Common tags include:


<details>
<summary>All tags across the project</summary>
@advisors-fb, @ami-upgrade, @backup, @bm-fb, @bm-locations, @bm-mongo, @cli, @client-generic, @config, @config-post-upgrade, @config-pre-upgrade, @dashboards, @disconnect, @docker-configuration, @dump, @experimental, @exporters, @fb-alerting, @fb-encryption, @fb-instances, @fb-pmm-ps-integration, @fb-settings, @grafana-pr, @instances, @instance, @inventory, @inventory-post-upgrade, @inventory-pre-upgrade, @max-length, @mongodb-exporter, @nightly, @nomad, @not-pr-pipeline, @not-ui-pipeline, @pmm-ami, @pmm-demo, @pmm-psmdb-arbiter-integration, @pmm-psmdb-replica-integration, @pmm-upgrade, @platform, @pmmdemo, @portal, @portal-post-upgrade, @portal-pre-upgrade, @post-pmm-portal-upgrade, @post-upgrade, @pre-upgrade, @pgsm-pmm-integration, @pgss-pmm-integration, @qan, @rbac, @service-account, @settings, @ssl, @ssl-mongo, @ssl-mysql, @ssl-postgres, @ssl-remote, @stt, @user-password
</details>


---

## Environment Variables

- `.env` file in the project root (see examples in `tests/ia/README.md`)
- Key variable: `PMM_UI_URL` (PMM server URL)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines and best practices.

