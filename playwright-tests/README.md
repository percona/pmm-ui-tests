# PMM UI end-to-end tests
Percona Monitoring and Management UI automated tests. Designed to cover "End to End" scenarios.


## Getting Started

* Install Node.js 12+ version and make sure npx is included
* Install project dependencies: `npm ci`
* Install "playwright" browser driver, ex: `sudo npx playwright install-deps`
* build TS definitions: `npx codeceptjs def pr.codecept.js`

this is it! tests are good to go on specified PMM server.


### Getting PMM server ready
* **Run tests upon local PMM server:**  
  execute command in the Project Root folder to start default PMM server: `docker-compose up -d`  
  Or one of the offered configurations:
    * `docker-compose -f docker-compose-ami-db-setup.yml up -d`
    * `docker-compose -f docker-compose-mongodb-ssl.yml up -d`
    * `docker-compose -f docker-compose-mongo-replica.yml up -d`
    * `docker-compose -f docker-compose-mysql-ssl.yml up -d`
    * `docker-compose -f docker-compose-postgresql-ssl.yml up -d`


* **Setup environment for backup management tests:**  
  run `bash -x testdata/backup-management/mongodb/setup-replica-and-pbm-local.sh`.
  This will launch docker compose with PMM Server, PMM Client, and set up replica set with 3 Percona MongoDB instance

* **[Setup local environment for Portal tests](./docs/setup-env-portal.md)**  
  run `bash -x testdata/backup-management/mongodb/setup-replica-and-pbm-local.sh`.
  This will launch docker compose with PMM Server, PMM Client, and set up replica set with 3 Percona MongoDB instance

* **Run tests upon remote PMM server:**  
  set desired instance URL in _**"PMM_UI_URL"**_ local environment variable    
  ex: create `.env` file with the following line `PMM_UI_URL=http://myPmmServer.com`

### Running tests:
Execute command in the **playwright-tests** folder
* **run all tests:** `npx playwright test`
* **run desired "classes":** `npx playwright test `
* **run desired groups/tags:** `npx playwright test --grep="${{ env.PMM_TEST_FLAG }}"`

### Test report
Execute command in the **playwright-tests** folder: `npx playwright show-report`


## **Useful Command Line Arguments:**
`--config="playwright.config.ts"` tells plyawright which configuration file to use to run tests. Useful when local run needs additional configuration, ex:

    `npx playwright test --config=local.config.ts`

`--debug`  enables a more detailed output to the console, ex:

    `npx codeceptjs run-multiple parallel -c pr.codecept.js --debug`

`--verbose`  enables the very detailed output information to the console, ex:

    `npx codeceptjs run-multiple parallel -c pr.codecept.js --verbose`

`--grep="@tag"` runs only tests marked by specified tags. The following tags are available:

    @inventory              Inventory functionality, removing nodes, services, etc.
    @pmm-upgrade	        upgrade testing Scenarios to verify UI Upgrade for docker based PMM Server
    @pre-upgrade	        upgrade testing Scenarios to verify Docker way Upgrade. Executed BEFORE the upgrade
    @post-upgrade	        upgrade testing Scenarios to verify Docker way Upgrade. Executed AFTER the upgrade
    @settings               PMM Settings functionality tests
    @portal                 Integration tests between PMM and Percona Portal


## Contributing

For the specific contributions guidelines, please see [CONTRIBUTING.md](CONTRIBUTING.md) in the project root directory. 

