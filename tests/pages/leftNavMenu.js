const { I } = inject();
const assert = require('assert');

const mouseOverMenu = (menuObj) => {
  I.moveCursorTo(menuObj.locator);
  I.waitForVisible(menuObj.menu.heading.locator, 2);
};

module.exports = {
  search: {
    locator: '<div className="sidemenu-item dropdown"><a className="sidemenu-link"><span className="icon-circle sidemenu-icon"><div className="css-1vzus6i-Icon"></div></span></a>',
    path: '?search=open',
    menu: {
      heading: {
        locator: '<li className="side-menu-header"><a className="side-menu-header-link"><span className="sidemenu-item-text">Search</span></a></li>',
        path: '?search=open',
        click: () => { I.click(this.locator); },
      },
    },
    showMenu: () => { mouseOverMenu(this); },
    click: () => { I.click(this.locator); },
  },
  create: {
    locator: '',
    path: '',
    menu: {
      heading: {
        locator: '',
        path: '',
      },
      dashboard: {
        locator: '',
        path: '/graph/dashboard/new?orgId=1',
      },
      folder: {
        locator: '',
        path: '/graph/dashboards/folder/new',
      },
      import: {
        locator: '',
        path: '/graph/dashboard/import',
      },
    },
  },
  dashboards: {
    locator: '',
    path: '',
    menu: {
      heading: {
        locator: '',
        path: '',
      },
      home: {
        locator: '',
        path: '/graph/d/pmm-home/home-dashboard?orgId=1&refresh=1m',
      },
      manage: {
        locator: '',
        path: '/graph/dashboards',
      },
      playlists: {
        locator: '',
        path: '/graph/playlists',
      },
      snapshots: {
        locator: '',
        path: '/graph/dashboard/snapshots',
      },
    },
  },
  pmmDashboards: {
    locator: '',
    path: 'graph/d/pmm-home/home-dashboard?orgId=1&refresh=1m',
    menu: {
      heading: {
        locator: '',
        path: 'graph/d/pmm-home/home-dashboard?orgId=1&refresh=1m',
      },
      queryAnalytics: {
        locator: '',
        path: '/graph/d/pmm-qan/pmm-query-analytics',
      },
      systemNode: {
        locator: '',
        path: '',
        menu: {
          nodeOverview: {
            locator: '',
            path: '/graph/d/node-instance-overview/',
          },
          nodeSummary: {
            locator: '',
            path: '/graph/d/node-instance-summary/',
            menu: {
              cpuUtilizationDetails: {
                locator: '',
                path: '/graph/d/node-cpu/cpu-utilization-details',
              },
              disk: {
                locator: '',
                path: '/graph/d/node-disk/disk-details',
              },
              memory: {
                locator: '',
                path: '/graph/d/node-memory/memory-details',
              },
              network: {
                locator: '',
                path: '/graph/d/node-network/network-details',
              },
              temperature: {
                locator: '',
                path: '/graph/d/node-temp/node-temperature-details',
              },
              numa: {
                locator: '',
                path: '/graph/d/node-memory-numa/numa-details',
              },
              processes: {
                locator: '',
                path: '/graph/d/node-cpu-process/processes-details',
              },
            },
          },
        },
      },
      mySql: {
        locator: '',
        path: '/graph/d/mysql-instance-overview/mysql-instances-overview',
        menu: {
          ha_HighAvailability: {
            locator: '',
            path: '',
            menu: {
              mySqlGroupReplicationSummary: {
                locator: '',
                path: '/graph/d/mysql-group-replicaset-summary/mysql-group-replication-summary',
              },
              mySQLReplicationSummary: {
                locator: '',
                path: '/graph/d/mysql-replicaset-summary/mysql-replication-summary',
              },
              pxc_galeraClusterSummary: {
                locator: '',
                path: '/graph/d/pxc-cluster-summary/pxc-galera-cluster-summary',
              },
              pxc_galeraNodeSummary: {
                locator: '',
                path: '/graph/d/pxc-node-summary/pxc-galera-node-summary',
              },
              pxc_galeraNodesCompare: {
                locator: '',
                path: '/graph/d/pxc-nodes-compare/pxc-galera-nodes-compare',
              },
            },
          },
          mySqlOverview: {
            locator: '',
            path: '/graph/d/mysql-instance-overview/mysql-instances-overview',
          },
          mySqlSummary: {
            locator: '',
            path: '/graph/d/mysql-instance-summary/mysql-instance-summary',
            menu: {
              MySqlCommand_HandlerCountersCompare: {
                locator: '',
                path: '/graph/d/mysql-commandhandler-compare/mysql-command-handler-counters-compare',
              },
              mySqlInnoDbCompressionDetails: {
                locator: '',
                path: '/graph/d/mysql-innodb-compression/mysql-innodb-compression-details',
              },
              mySqlInnoDbDetails: {
                locator: '',
                path: '/graph/d/mysql-innodb/mysql-innodb-details',
              },
              mySqlPerformanceSchemaDetails: {
                locator: '',
                path: '/graph/d/mysql-performance-schema/mysql-performance-schema-details',
              },
              mySqlQueryResponseTimeDetails: {
                locator: '',
                path: '/graph/d/mysql-queryresponsetime/mysql-query-response-time-details',
              },
              mySqlTableDetails: {
                locator: '',
                path: '/graph/d/mysql-table/mysql-table-details',
              },
              mySqlTokuDbDetails: {
                locator: '',
                path: '/graph/d/mysql-tokudb/mysql-tokudb-details',
              },
              mySqlUserDetails: {
                locator: '',
                path: '/graph/d/mysql-user/mysql-user-details',
              },
              mySqlWaitEventAnalysesDetails: {
                locator: '',
                path: '/graph/d/mysql-waitevents-analysis/mysql-wait-event-analyses-details',
              },
              mySqlMyIsam_AriaDetails: {
                locator: '',
                path: '/graph/d/mysql-myisamaria/mysql-myisam-aria-details',
              },
              mySqlMyRocksDetails: {
                locator: '',
                path: '/graph/d/mysql-myrocks/mysql-myrocks-details',
              },
              mySqlAmazonAuroraDetails: {
                locator: '',
                path: '/graph/d/mysql-amazonaurora/mysql-amazon-aurora-details',
              },
            },
          },
        },
      },
      mongoDb: {
        locator: '',
        path: '/graph/d/mongodb-instance-overview/mongodb-instances-overview',
        menu: {
          ha_HighAvailability: {
            locator: '',
            path: '#',
            menu: {
              mongoDbClusterSummary: {
                locator: '',
                path: '/graph/d/mongodb-cluster-summary/mongodb-cluster-summary',
              },
              mongoDbReplSetSummary: {
                locator: '',
                path: '/graph/d/mongodb-replicaset-summary/mongodb-replset-summary',
              },
            },
          },
          mongoDbInstanceOverview: {
            locator: '',
            path: '/graph/d/mongodb-instance-overview/mongodb-instances-overview',
          },
          mongoDbInstanceSummary: {
            locator: '',
            path: '/graph/d/mongodb-instance-summary/mongodb-instance-summary',
            menu: {
              mongoDbInMemoryDetails: {
                locator: '',
                path: '/graph/d/mongodb-inmemory/mongodb-inmemory-details',
              },
              mongoDbMmaPv1Details: {
                locator: '',
                path: '/graph/d/mongodb-mmapv1/mongodb-mmapv1-details',
              },
              mongoDbWiredTigerDetails: {
                locator: '',
                path: '/graph/d/mongodb-wiredtiger/mongodb-wiredtiger-details',
              },
            },
          },
        },
      },
      postgreSql: {
        locator: '',
        path: '',
        menu: {
          postgreSqlOverview: {
            locator: '',
            path: '/graph/d/postgresql-instance-overview/postgresql-instances-overview',
          },
          postgreSqlSummary: {
            locator: '',
            path: '/graph/d/postgresql-instance-summary/postgresql-instance-summary',
          },
        },
      },
      proxySql: {
        locator: '',
        path: '/graph/d/proxysql-instance-summary/proxysql-instance-summary',
      },
      haProxy: {
        locator: '',
        path: '/graph/d/haproxy-instance-summary/haproxy-instance-summary',
      },
    },
  },
  explore: {
    locator: '',
    path: '/graph/explore',
    menu: {
      heading: {
        locator: '',
        path: '/graph/explore',
      },
    },
  },
  alerting: {
    locator: '',
    path: '',
    menu: {
      heading: {
        locator: '',
        path: '',
      },
      alertRules: {
        locator: '',
        path: '/graph/alerting/list',
      },
      notificationChannels: {
        locator: '',
        path: '/graph/alerting/notifications',
      },
    },
  },
  configuration: {
    locator: '',
    path: '',
    menu: {
      heading: {
        locator: '',
        path: '',
      },
      pmmInventory: {
        locator: '',
        path: '/graph/inventory/services',
        menu: {
          inventoryList: {
            locator: '',
            path: '/graph/inventory/services',
          },
          addInstance: {
            locator: '',
            path: '/graph/add-instance',
          },
        },
      },
      settings: {
        locator: '',
        path: '/graph/settings/metrics-resolution',
      },
      dataSources: {
        locator: '',
        path: '/graph/datasources',
      },
      users: {
        locator: '',
        path: '/graph/org/users',
      },
      teams: {
        locator: '',
        path: '/graph/org/teams',
      },
      plugins: {
        locator: '',
        path: '/graph/plugins',
      },
      preferences: {
        locator: '',
        path: '/graph/org',
      },
      apiKeys: {
        locator: '',
        path: '/graph/org/apikeys',
      },
    },
  },
  serverAdmin: {
    locator: '',
    path: '',
    menu: {
      heading: {
        locator: '',
        path: '',
      },
      users: {
        locator: '',
        path: '/graph/admin/users',
      },
      orgs: {
        locator: '',
        path: '/graph/admin/orgs',
      },
      settings: {
        locator: '',
        path: '/graph/admin/settings',
      },
      stats: {
        locator: '',
        path: '/graph/admin/stats',
      },
    },
  },
};
