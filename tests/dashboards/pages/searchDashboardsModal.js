const { I } = inject();

const folderWrapper = locate(I.useDataQA('data-testid Search section')).find('.pointer');

module.exports = {
  url: 'graph/dashboards',
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
        'DB Cluster Summary',
        'Environments Overview (Designed for PMM)',
        'MongoDB Collection Details',
        'MongoDB Collections Overview',
        'MongoDB Oplog Details',
        'PXC Galera Cluster Summary (experimental)',
      ],
    },
    queryAnalytics: {
      name: 'Query Analytics',
      items: [
        'PMM Query Analytics',
      ],
    },
    k8sExperimental: {
      name: 'Kubernetes (experimental)',
      items: [
        'Databases on Kubernetes - Summary',
        'Kubernetes Cluster Overview',
      ],
    },
  },
  fields: {
    searchInput: 'input[placeholder="Search for dashboards and folders"]',
    folderLocator: I.useDataQA('data-testid Search section'),
    collapsedFolderLocator: (folderName) => locate(`[aria-label="Expand folder ${folderName}"]`),
    expandedFolderLocator: (folderName) => locate(`[aria-label="Collapse folder ${folderName}"]`),
    folderItemLocator: (itemName) => I.useDataQA(`data-testid browse dashboards row ${itemName}`),
    folderItemWithTagLocator: (itemName, tag) => locate(I.useDataQA(`data-testid Dashboard search item ${itemName}`))
      .find('[aria-label="Tags"] li').withText(tag),
    itemLocator: (itemName) => locate(I.useDataQA(`data-testid Dashboard search item ${itemName}`)),
    closeButton: locate('button[aria-label="Close search"]').as('Close button'),
    folderRowLocator: locate('[data-testid^="data-testid browse dashboards row "]'),
    itemsLocator: locate('[data-testid^="data-testid Dashboard search item "]'),
  },

  waitForOpened() {
    I.waitForElement(this.fields.searchInput, 10);
  },

  async countFolders() {
    return await I.grabNumberOfVisibleElements(folderWrapper);
  },

  async getFoldersList() {
    I.waitForVisible(this.fields.folderItemLocator(this.folders.insight.name), 10);

    const text = await I.grabTextFromAll(
      this.fields.folderRowLocator,
    );

    return text.map((elem) => elem.split('|')[0]);
  },

  expandFolder(name) {
    I.waitForVisible(this.fields.collapsedFolderLocator(name), 10);
    I.click(this.fields.collapsedFolderLocator(name));
    I.waitForVisible(this.fields.expandedFolderLocator(name), 10);
    I.waitForVisible(this.fields.itemsLocator.first(), 10);
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

  openDashboard(name) {
    I.waitForVisible(this.fields.itemLocator(name), 10);
    I.click(this.fields.itemLocator(name));
  },
};
