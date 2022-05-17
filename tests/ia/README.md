# **How to test Integrated Alerting**
### Requirements :
* PMM Server 2.19.0 or higher
#### Environment variables:
* MAILOSAUR_API_KEY
* MAILOSAUR_SERVER_ID
* MAILOSAUR_SMTP_PASSWORD
* PAGER_DUTY_SERVICE_KEY
* PAGER_DUTY_API_KEY
### Command to execute Integrated Alerting Alerts tests command

`npx codeceptjs run -c pr.codecept.js tests/ia/alerts_test.js --steps`

### Command to execute all Integrated Alerting tests:

`npx codeceptjs run -c pr.codecept.js --grep '@ia'`

### Execute Integrated Alerting tests in Jenkins
* Job name - `pmm2-ui-tests`
* tag - `@ia`
* run tagged day - `yes`
* clients not needed
