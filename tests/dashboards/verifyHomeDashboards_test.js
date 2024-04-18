Feature('Test Dashboards collection inside the Folders');

const panels = new DataTable(['panelName', 'dashboardType', 'dashboardName', 'dashboard']);

panels.add(['Disk Space Total', 'singleNode', 'Disk Details', 'osDiskDetails']);
panels.add(['Disk Reads', 'singleNode', 'Disk Details', 'osDiskDetails']);
panels.add(['Disk Writes', 'singleNode', 'Disk Details', 'osDiskDetails']);
panels.add(['Total RAM', 'singleNode', 'Memory Details', 'osMemoryDetails']);
panels.add(['Virtual Memory Total', 'multipleNodes', 'Nodes Overview', 'osNodesOverview']);
panels.add(['Monitored Nodes', 'multipleNodes', 'Nodes Overview', 'osNodesOverview']);
panels.add(['Total Virtual CPUs', 'multipleNodes', 'Nodes Overview', 'osNodesOverview']);

Before(async ({ I }) => {
  await I.Authorize();
});

Data(panels).Scenario(
  '@PMM-T1565 Verify ability to access OS dashboards with correct filter setup from Home Dashboard @nightly @dashboards',
  async ({
    I, current, dashboardPage, homePage,
  }) => {
    const {
      panelName, dashboardType, dashboardName, dashboard,
    } = current;

    await homePage.open();

    const expectedDashboard = dashboardPage[dashboard];

    I.click(dashboardPage.fields.openFiltersDropdownLocator('Node Name'));
    const nodeNames = await I.grabTextFromAll(dashboardPage.fields.allFilterDropdownOptions);
    const currentPanelValue = await I.grabTextFrom(dashboardPage.panelDataByTitle(panelName));

    I.click(dashboardPage.fields.filterDropdownOptionsLocator(nodeNames[0]));
    I.click(dashboardPage.fields.filterDropdownOptionsLocator(nodeNames[1]));
    I.click(dashboardPage.fields.refresh);

    // The data will not change if the initial value was 0.0
    if (currentPanelValue.startsWith('0')) {
      I.wait(5);
    } else {
      I.waitForInvisible(locate(dashboardPage.panelDataByTitle(panelName)).withText(currentPanelValue), 20);
    }

    const expectedNodeName = dashboardType === 'singleNode'
      ? nodeNames.sort()[0]
      : await I.grabTextFrom(dashboardPage.fields.openFiltersDropdownLocator('Node Name'));

    I.click(dashboardPage.fields.clickablePanel(panelName));

    // Wait for tab to open
    I.wait(2);
    I.switchToNextTab();
    // need to skip PMM tour modal window due to new tab opening
    await dashboardPage.clickSkipPmmTour();

    I.waitForElement(dashboardPage.fields.dashboardTitle(dashboardName), 60);
    I.seeInCurrentUrl(expectedDashboard.clearUrl);
    await I.waitForText(expectedNodeName, 20, dashboardPage.fields.openFiltersDropdownLocator('Node Name'));
    await dashboardPage.expandEachDashboardRow();

    await dashboardPage.verifyMetricsExistence(expectedDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(expectedDashboard.noDataElements);
  },
);
