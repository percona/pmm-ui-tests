# **How to test Integrated Alerting**
### Requirements :
* PMM Server 2.19.0 or higher
* Configure PMM for alerting by url 'v1/Settings/Change' with body:
    `{ enable_alerting: true }`


### Create new alert rule example:

example:
>    {
    custom_labels: {},
    disabled: true || false,
    channel_ids: [channels],
    filters: [{
        key: 'service_name',
        value: 'pmm-server-postgresql',
        type: 'EQUAL',
        }],
    for: '1s',
    severity: 'SEVERITY_CRITICAL',
    template_name: 'pmm_postgresql_too_many_connections',
    name: 'Test Rule',
    params: [{
        name: 'threshold',
        type: 'FLOAT',
        float: 1,
        }],
    }`


### You can silence/unsilence one alert if you click on the button in thr row with alert. Or you can silence/unsilence all alerts using buttons 'Silence/Unsilence All'

### Create new alert template example

> templates:
name: input_template_yml
version: 1
summary: E2E TemplateForAutomation input YML
tiers: anonymous, registered
expr: |-
max_over_time(mysql_global_status_threads_connected5m) / ignoring (job)
mysql_global_variables_max_connections
100
> [[ .threshold ]]
params:
name: threshold
summary: A percentage from configured maximum
unit: '%'
type: float
range: 0, 100
value: 80
for: 5m
severity: warning
labels:
foo: bar
annotations:
description: |-
More than [[ .threshold ]]% of MySQL connections are in use on {{ $labels.instance }}
VALUE = {{ $value }}
LABELS: {{ $labels }}
summary: MySQL too many connections (instance {{ $labels.instance }})


### Create new notifications channel example

>email: {
name: 'Email Channel',
type: 'Email',
addresses: 'some@email.com, other@email.com',
},
pagerDuty: {
name: 'PagerDuty Channel',
type: 'Pager Duty',
key: 'routingKey',
},
slack: {
name: 'Slack Channel',
type: 'Slack',
slackChannel: 'slackChannel',
},
webhook: {
name: 'Webhook Channel',
type: 'Webhook',
url: 'http://url',
max_alerts: 1,
send_resolved: true,
http_config: {
basic_auth: {
username: 'Username',
password: 'Password',
},
},
tls_config: {
ca_file_content: 'content',
cert_file_content: 'content',
insecure_skip_verify: false,
key_file_content: 'content',
server_name: 'serverName',
},
},


### You can run ui tests in file alerts_test.js locally by command. 
Before it you should change url in file pr.codecept.js to your pmm-server url

`npx codeceptjs run -c pr.codecept.js tests/ia/alerts_test.js --steps`

### To run all IA tests:

`npx codeceptjs run -c pr.codecept.js --grep '@ia'`

### You can run tests in job 
`https://pmm.cd.percona.com/view/all/job/pmm2-ui-tests` with tag `@ia`
