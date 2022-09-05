const { I } = inject();

const folderWrapper = locate(I.useDataQA('data-testid Search section')).find('.pointer');

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
    general: {
      name: 'General',
      items: [],
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
        'DB Cluster Summary',
        'Environments Overview (Designed for PMM)',
        'Environment Summary (Designed for PMM)',
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
    folderLocator: I.useDataQA('data-testid Search section'),
    collapsedFolderLocator: (folderName) => locate(folderWrapper)
      .withDescendant(locate('div').withText(folderName)),
    expandedFolderLocator: (folderName) => locate(folderWrapper).withDescendant('div').withText(folderName)
      .find('div')
      .at(1),
    folderItemLocator: (itemName) => locate(I.useDataQA(`data-testid Dashboard search item ${itemName}`)).find('a'),
    folderItemWithTagLocator: (itemName, tag) => locate(I.useDataQA(`data-testid Dashboard search item ${itemName}`))
      .find('a').withDescendant('span').withText(tag),
    closeButton: locate('button[aria-label="Close search"]').as('Close button'),
  },

  waitForOpened() {
    I.waitForElement(this.fields.searchInput, 10);
    I.waitForVisible(this.fields.folderLocator, 10);
  },

  async countFolders() {
    return await I.grabNumberOfVisibleElements(folderWrapper);
  },

  async getFoldersList() {
    return (await I.grabTextFromAll(
      '.pointer > div:nth-child(2)',
    )).map((elem) => elem.split('|')[0]);
  },

  expandFolder(name) {
    I.waitForVisible(this.fields.collapsedFolderLocator(name), 10);
    I.click(this.fields.collapsedFolderLocator(name));
    I.waitForElement(this.fields.expandedFolderLocator(name), 5);
  },

  collapseFolder(name) {
    I.waitForVisible(this.fields.expandedFolderLocator(name), 10);
    I.click(this.fields.expandedFolderLocator(name));
    I.waitForElement(this.fields.collapsedFolderLocator(name), 5);
  },

  verifyDashboardsInFolderCollection(folderObject) {
    for (const item of folderObject.items) {
      I.seeElementInDOM(this.fields.folderItemLocator(item));
      I.see(item, this.fields.folderItemLocator(item));
    }
  },
};
