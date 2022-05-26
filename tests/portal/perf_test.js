Feature('Portal Integration with PMM');

Scenario(
  'PMM-T398 PMM-T809 Verify Connect to Percona Portal elements @portal @pre-pmm-portal-upgrade',
  async ({ I }) => {
    await I.Authorize();
    const newTabs = await I.openNewTabs(10);

    for (const tab of newTabs) {
      I.navigateTabTo(tab, '').then(async () => I.say(`Page load time was ${await I.getPageTimeLoad(tab)}ms`));
    }

    for (const tab of newTabs) {
      I.getPageTimeToInteractive('http://192.168.100.13');
    }

    I.say('New Window Opened');
  },
);
