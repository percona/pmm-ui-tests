# PMM UI end-to-end tests
Percona Monitoring and Management UI automated tests. Designed to cover "End to End" scenarios.


## Getting Started

* Install Node.js 12+ version nad make sure npx is included
* Install "playwright" browser driver, ex: `sudo npx playwright install-deps`

this is it! test are good to go on specified PMM server.

### Getting PMM server ready
  * **Run tests upon local PMM server:**  
 execute command in the Project Root folder to start default PMM server: `docker-compose up -d`  
 Or one of the offered configurations:
    * `docker-compose -f docker-compose-ami-db-setup.yml up -d`
    * `docker-compose -f docker-compose-mongodb-ssl.yml up -d`
    * `docker-compose -f docker-compose-mongo-replica.yml up -d`
    * `docker-compose -f docker-compose-mysql-ssl.yml up -d`
    * `docker-compose -f docker-compose-postgresql-ssl.yml up -d`

 
  * **Run tests upon remote PMM server:**  
    set desired instance URL in _**"PMM_UI_URL"**_ local environment variable    
    ex: create `.env` file with te following line `PMM_UI_URL=http://myPmmServer.com`

### Running tests:
Execute command in the Project Root folder
* **run all in single thread tests:** `npx codeceptjs run -c pr.codecept.js`
* **run all tests in parallel threads:** `npx codeceptjs run-multiple -c pr.codecept.js`
* **run desired "classes":** `npx codeceptjs run -c pr.codecept.js tests/verifyMysqlDashboards_test.js`   
* **run desired groups/tags:** `npx codeceptjs run -c pr.codecept.js --steps --grep @settings`

### Test report
* Allure report in docker(no additional requirements)
   1. run allure server: `docker-compose -f docker-compose-allure.yml up -d`
   2. open test report in browser: http://localhost:5252/


* Allure report by **allure-commandline** tool
   1. Allure requires Java 8 or higher
   2. install allure-commandline: `npm install -g allure-commandline --save-dev`
   3. aggregate report: `allure serve tests/output/allure`


* HTML report Local(mochawesome):  
  run tests with `--reporter mochawesome` flag  
  ex: `npx codeceptjs run-workers 4 -c pr.codecept.js --grep @backup --reporter mochawesome` 
 

## **Available Command Line Arguments:**
 `--steps`  enables the step-by-step output of running tests to the console, ex:

    `npx codeceptjs run-workers 4 -c pr.codecept.js --steps`

  `--debug`  enables a more detailed output to the console, ex:

    `npx codeceptjs run-workers 4 -c pr.codecept.js --debug`

 `--verbose`  enables the very detailed output information to the console, ex:

    `npx codeceptjs run-workers 4 -c pr.codecept.js --verbose`

 `--grep "@tag"` runs only tests marked by specified tags. The following tags are available:

    @ami-upgrade            Groups tests for the "pmm-ami-upgrade" Job
    @backup                     Backup Management functionality tests
    @dashboards             Dashboards functionality, check that graphs are not empty
                                (e.g. Data from exporters is displayed at those dashboards)
    @dbaas                  DB as a Service functionality tests
    @grafana-pr             Executed in Github Actions for PRs in percona-platform/grafana repository
    @ia                     Integrated Alerting functionality tests
    @instances              Remote Instances addition functionality 
                                and checking that data appears from exporters
    @inventory              Inventory functionality, removing nodes, services, etc.
    @not-ovf                Tests with this tag are excluded from execution for OVF image tests
    @nightly                executed on a nightly Job, mostly related to Dashboards. Includes tests 
                                to verify Metrics, Custom Filters and Navigation between Dashboards.
    @platform               Portal functionality tests
    @pmm-demo               Performs basic Sanity on PMM-Demo, esures all expected Services are still running 
    @pmm-upgrade	        upgrade testing Scenarios to verify UI Upgrade for docker based PMM Server
    @pre-upgrade	        upgrade testing Scenarios to verify Docker way Upgrade. Executed BEFORE the upgrade
    @post-upgrade	        upgrade testing Scenarios to verify Docker way Upgrade. Executed AFTER the upgrade
    @post-client-upgrade    executed in the "pmm-upgrade" Job after"pmm-client" has been udpated
    @qan	                Query Analytics(QAN) functionality tests
    @settings               PMM Settings functionality tests
    @stt                    Security Checks (STT) functionality tests
    @pmm-ami                legacy/deprecated
    @not-ui-pipeline        legacy/deprecated
    @not-pr-pipeline        legacy/deprecated


## Contributing

For the specific contributions guidelines, please see [CONTRIBUTING.md](CONTRIBUTING.md) in the project root directory. 

