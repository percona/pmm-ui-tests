const { I } = inject();

const folderWrapper = 'div[aria-label="Search section"]';

module.exports = {
  folders: {
    insight: {
      name: 'Insight',
      items: [
        'Advanced Data Exploration',
        'Home Dashboard',
        'Prometheus Exporter Status',
        'Prometheus Exporters Overview',
        'VictoriaMetrics',
        'VictoriaMetrics Agents Overview',
      ],
    },
    mongoDb: {
      name: 'MongoDB',
      items: [
        'MongoDB Cluster Summary',
        'MongoDB InMemory Details',
        'MongoDB Instance Summary',
        'MongoDB Instances Compare',
        'MongoDB Instances Overview',
        'MongoDB MMAPv1 Details',
        'MongoDB ReplSet Summary',
        'MongoDB WiredTiger Details',
      ],
    },
    mySql: {
      name: 'MySQL',
      items: [
        'HAProxy Instance Summary',
        'MySQL Amazon Aurora Details',
        'MySQL Command/Handler Counters Compare',
        'MySQL Group Replication Summary',
        'MySQL InnoDB Compression Details',
        'MySQL InnoDB Details',
        'MySQL Instance Summary',
        'MySQL Instances Compare',
        'MySQL Instances Overview',
        'MySQL MyISAM/Aria Details',
        'MySQL MyRocks Details',
        'MySQL Performance Schema Details',
        'MySQL Query Response Time Details',
        'MySQL Replication Summary',
        'MySQL Table Details',
        'MySQL TokuDB Details',
        'MySQL User Details',
        'MySQL Wait Event Analyses Details',
        'ProxySQL Instance Summary',
        'PXC/Galera Cluster Summary',
        'PXC/Galera Node Summary',
        'PXC/Galera Nodes Compare',
      ],
    },
    os: {
      name: 'OS',
      items: [
        'CPU Utilization Details',
        'Disk Details',
        'Memory Details',
        'Network Details',
        'Node Summary',
        'Node Temperature Details',
        'Nodes Compare',
        'Nodes Overview',
        'NUMA Details',
        'Processes Details',
      ],
    },
    postgreSql: {
      name: 'PostgreSQL',
      items: [
        'PostgreSQL Instance Summary',
        'PostgreSQL Instances Compare',
        'PostgreSQL Instances Overview',
      ],
    },
    experimental: {
      name: 'Experimental',
      items: [
        'Db Cluster Summary',
      ],
    },
    queryAnalytics: {
      name: 'Query Analytics',
      items: [
        'PMM Query Analytics',
      ],
    },
  },
  fields: {
    searchInput: 'input[placeholder="Search dashboards by name"]',
    collapsedFolderLocator: (folderName) => locate(folderWrapper)
      .withDescendant(locate('div').withText(folderName)),
    expandedFolderLocator: (folderName) => locate(folderWrapper).withDescendant('div').withText(folderName)
      .find('div')
      .at(1),
    folderItemLocator: (itemName) => locate(`div[aria-label="Dashboard search item ${itemName}"]`).find('a'),
  },

  waitForOpened() {
    I.waitForElement(this.fields.searchInput, 5);
  },

  async countFolders() {
    return await I.grabNumberOfVisibleElements(folderWrapper);
  },

  async getFoldersList() {
    return (await I.grabTextFromAll(
      locate('div .pointer').find('div').after('div').before('div'),
    )).map((elem) => elem.split('|')[0]);
  },

  expandFolder(name) {
    I.click(this.fields.collapsedFolderLocator(name));
    I.waitForElement(this.fields.expandedFolderLocator(name));
  },

  collapseFolder(name) {
    I.click(this.fields.expandedFolderLocator(name));
    I.waitForElement(this.fields.collapsedFolderLocator(name));
  },

  verifyDashboardsInFolderCollection(folderObject) {
    for (const item of folderObject.items) {
      I.seeElementInDOM(this.fields.folderItemLocator(item));
    }
  },
};
