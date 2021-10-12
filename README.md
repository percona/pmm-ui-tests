# PMM UI end-to-end tests
Percona Monitoring and Management UI automated tests. Designed to cover "End to End" scenarios.


### Requirements:
* Install Node.js 12+ version nad make sure npx is included
* Install "playwright" browser driver, ex: `sudo npx playwright install-deps`
* Make sure PMM instance is online.
* Make sure required environment variables(see /env.list) exist is os or .env file 

### Run tests:
Execute command in the Project Root folder
* **run all tests:** `npx codeceptjs run -c pr.codecept.js --steps`   
* **run desired "classes":** `npx codeceptjs run -c pr.codecept.js --steps tests/verifyMysqlDashboards_test.js`   
* **run desired groups/tags:** `npx codeceptjs run -c pr.codecept.js --steps --grep @settings`

### Test report
   run allure server: xxxx

### **Available Command Line Arguments:**
`--grep "@tag"` runs only tests marked by specified tags.   
   the following tags ar available:

    @qan	         Tests with this tag are related to Query Analytics(QAN) functionality
    @ia              Tests with this tag are related to Integrated Alerting functionality
    @dbaas	         Tests with this tag are related to DBAAS functionality
    @stt	         Tests with this tag are related to Security Checks (STT) functionality
    @dashboards	     Tests with this tag are related to Dashboards functionality, check that graphs are not empty(e.g. Data from exporters is displayed at those dashboards)
    @bm	             Tests with this tag are related to Backup Management functionality
    @backup
    @platform
    @settings	     Tests with this tag are related to PMM Settings functionality
    @instances       Tests with this tag are related to Remote Instances addition functionality and checking that data appears from exporters
    @inventory	     Tests with this tag are related to Inventory functionality, removing nodes, services, etc.
    @grafana-pr	     Tests with this tag are executed in Github Actions for Pull Requests in percona-platform/grafana repository
    @not-ovf	     Tests with this tag are excluded from execution for OVF image tests
    @nightly	     Tests with this tag are mostly related to Dashboards, we run them on a nightly Job, hence use the tag Nightly, all tests to verify Metrics, Custom Filters, and  Navigation between Dashboards are covered here. 	
    @pmm-upgrade	 Tests with this tag are meant for covering upgrade testing Scenarios, they verify UI Upgrade for docker based PMM Server
    @pre-upgrade	 Tests with this tag are meant for covering upgrade testing Scenarios, they verify Docker way Upgrade. And are executed BEFORE the upgrade
    @post-upgrade	 Tests with this tag are meant for covering upgrade testing Scenarios, they verify Docker way Upgrade. And are executed AFTER the upgrade
    @pmm-demo        Tests which verify PMM Demo, make sure all expected Services are still running, Performs basic Sanity on PMM-Demo
    @pmm-ami
    @ami-upgrade
    @post-client-upgrade     
    @not-ui-pipeline
    @not-pr-pipeline

