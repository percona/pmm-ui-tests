const {
    links
} = inject();

module.exports = {
    pmmSettings: {
        diagnostics: {
            iconLocator: locate('$diagnostics-label').find('div[class$="-Icon"]').as('Diagnostics tooltip'),
            text: 'You can download server logs to make the problem detection simpler. Please include this file if you are submitting a bug report.',
            link: false,
        },
        metricsResolution: {
            metricsResolutionSec: {
                iconLocator: locate('$metrics-resolution-label').find('div[class$="-Icon"]').as('Metrics resolution tooltip'),
                text: 'This setting defines how frequently the data will be collected.',
                link: links.metricsResolutionDocs,
            },
        },
        advancedSettings: {
            dataRetention: {
                iconLocator: locate('$advanced-label').find('div[class$="-Icon"]').as('Advanced settings tooltip'),
                text: 'This is the value for how long data will be stored.',
                link: links.dataRetentionDocs,
            },
            telemetry: {
                iconLocator: locate('$advanced-telemetry').find('div[class$="-Icon"]').as('Telemetry tooltip'),
                text: 'Option to send usage data back to Percona to let us make our product better.',
                link: links.telemetryDocs,
            },
            checkForUpdates: {
                iconLocator: locate('$advanced-updates').find('div[class$="-Icon"]').as('Check for updates tooltip'),
                text: 'Option to check new versions and ability to update PMM from UI.',
                link: links.checkForUpdates,
            },
            stt: {
                iconLocator: locate('$advanced-advisors').find('div[class$="-Icon"]').as('Advanced advisors tooltip'),
                text: 'Enable Advisor Checks and get updated checks from Percona.',
                link: links.advisorsDocs,
            },
            publicAddress: {
                iconLocator: locate('$public-address-label').find('div[class$="-Icon"]').as('Public Address tooltip'),
                text: 'Public Address to this PMM server.',
                link: false,
            },
            executionIntervals: {
                iconLocator: locate('$check-intervals-label').find('div[class$="-Icon"]').as('Execution intervals tooltip'),
                text: 'Interval between check runs',
                link: false,
            },
            dbaas: {
                iconLocator: locate('$advanced-dbaas').find('div[class$="-Icon"]').as('DBaaS tooltip'),
                text: 'Option to enable/disable DBaaS features. Disabling DBaaS does not suspend or remove running clusters.',
                link: links.dbaasDocs,
            },
            backupManagement: {
                iconLocator: locate('$advanced-backup').find('div[class$="-Icon"]').as('Backup management tooltip'),
                text: 'Option to enable/disable Backup Management features.',
                link: links.backupManagementDocs,
            },
            integratedAlerting: {
                iconLocator: locate('$advanced-alerting').find('div[class$="-Icon"]').as('Integrated Alerting tooltip'),
                text: 'Option to enable/disable Integrated Alerting features.',
                link: links.integratedAlertingDocs,
            },
            microsoftAzureMonitoring: {
                iconLocator: locate('$advanced-azure-discover').find('div[class$="-Icon"]').as('Microsoft Azure monitoring tooltip'),
                text: 'Option to enable/disable Microsoft Azure DB instanced discovery and monitoring',
                link: links.microsoftAzureMonitoringDocs,
            },
        },
        ssh: {
            sshKey: {
                iconLocator: locate('$ssh-key-label').find('div[class$="-Icon"]').as('SSH key tooltip'),
                text: 'Public SSH key to let you login into the server using SSH.',
                link: links.sshKeyDocs,
            },
        },
        alertManagerIntegration: {
            alertManagerUrl: {
                iconLocator: locate('$alertmanager-url-label').find('div[class$="-Icon"]').as('Alert management integration tooltip'),
                text: 'The URL of the external Alertmanager to use.',
                link: links.prometheusAlertManagerDocs,
            },
            prometheusAlertingRules: {
                iconLocator: locate('$alertmanager-rules-label').find('div[class$="-Icon"]').as('Prometheus alerting rules tooltip'),
                text: 'Alerting rules in the YAML configuration format.',
                link: links.prometheusAlertManagerDocs,
            },
        },
        perconaPlatform: {},
        communication: {
            email: {
                serverAddress: {
                    iconLocator: locate('div').after(locate('span').withText('Server Address')).as('Server address tooltip'),
                    text: 'The default SMTP smarthost used for sending emails, including port number (e.g. smtp.example.org:587)',
                    link: links.communicationDocs,
                },
                hello: {
                    iconLocator: locate('div').after(locate('span').withText('Hello')).as('Hello tooltip'),
                    text: 'The hostname to identify the SMTP server',
                    link: links.communicationDocs,
                },
                from: {
                    iconLocator: locate('div').after(locate('span').withText('From')).as('From tooltip'),
                    text: 'The sender address',
                    link: links.communicationDocs,
                },
                authType: {
                    iconLocator: locate('div').after(locate('span').withText('Auth Type')).as('Auth type tooltip'),
                    text: 'Authentication type',
                    link: links.communicationDocs,
                },
                username: {
                    iconLocator: locate('div').after(locate('span').withText('Username')).as('Username tooltip'),
                    text: 'SMTP authentication information',
                    link: links.communicationDocs,
                },
                password: {
                    iconLocator: locate('div').after(locate('span').withText('Password')).as('Password tooltip'),
                    text: 'SMTP authentication information',
                    link: links.communicationDocs,
                },
                testEmail: {
                    iconLocator: locate('$testEmail-field-container').find('div[class$="-Icon"]').as('Test email tooltip'),
                    text: 'Send a test email to this address',
                    link: false,
                },
            },
            slack: {
                slackUrl: {
                    tabButton: locate('li').find('a').withAttr({'aria-label': 'Tab Slack'}).as('Slack Tab'),
                    iconLocator: locate('div').after(locate('span').withText('URL')).as('Slack URL tooltip'),
                    text: 'Slack incoming webhook URL',
                    link: links.communicationDocs,
                },
            },
        },
    },
}