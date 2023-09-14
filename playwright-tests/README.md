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

* **Run tests upon remote PMM server:**  
  set desired instance URL in _**"PMM_UI_URL"**_ local environment variable    
  ex: create `.env` file with the following line `PMM_UI_URL=http://myPmmServer.com`

### Running tests:
Execute command in the **playwright-tests** folder   
     
    Note! since portal tests require spcial setup, all tests are split 
    into 2 "projects": Chromium(without setup) and Portal(with setup). 
    Run tests without project flag or "--project=Chromium" will run portal setup 
* run all tests: `npx playwright test`
* run a single test file: `npx playwright test --projet=Cromium access-control.spec.ts`
* run Portal tests: `npx playwright test --projet=Portal -g @portal`
* run a set of test files: `npx playwright test tests/todo-page/ tests/landing-page/`
* run files that have **my-spec** or **my-spec-2** in the file name: `npx playwright test --project=Chromium my-spec my-spec-2`
* run desired [groups/tags](https://playwright.dev/docs/test-annotations#tag-tests): `npx playwright test --grep @rbac`

### Test report
Execute command in the **playwright-tests** folder: `npx playwright show-report`


## **Useful Command Line Arguments:**
Full list of arguments available on [Playwright docs](https://playwright.dev/docs/test-cli#reference)  

`--config="playwright.config.ts"` tells plyawright which configuration file to use to run tests. Useful when local run needs additional configuration, ex:

    `npx playwright test --config=local.config.ts`

`--quiet`  Run tests with no console output, ex:

    `npx playwright test --project=Chromium --quiet`

`--debug`  Run tests with Playwright Inspector, ex:

    `npx playwright test --debug`

`--pass-with-no-tests`  Allows the test suite to pass when no files are found.


`--grep="@tag"` runs only tests marked by specified tags. The following tags are available:

    @config                   PMM Settings functionality tests
    @config-pre-upgrade       Config tests executed BEFORE the upgrade
    @config-post-upgrade      Config tests executed AFTER the upgrade
    @inventory                Inventory functionality, removing nodes, services, etc. 
    @inventory-pre-upgrade    Inventory tests executed BEFORE the upgrade
    @inventory-post-upgrade   Inventory tests executed AFTER the upgrade
    @not-ui-pipeline          ???
    @portal                   Integration tests between PMM and Percona Portal
    @pre-pmm-portal-upgrade   tests executed BEFORE the upgrade
    @post-pmm-portal-upgrade  tests executed AFTER the upgrade
    @pmm-portal-upgrade       ???
    @rbac                     User roles and access restrictions tests
    @rbac-pre-upgrade         User roles tests executed BEFORE the upgrade
    @rbac-post-upgrade        User rolestests executed AFTER the upgrade
    @pmm-upgrade              Tests which actually perform the "UI Upgrade" of PMM Server



## Contributing

For the specific contributions guidelines, please see [CONTRIBUTING.md](CONTRIBUTING.md) in the project root directory. 

