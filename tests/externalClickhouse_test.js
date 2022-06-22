Feature('External Clickhouse Tests');

Scenario(
  'PMM-9550 Verify downloading server diagnostics logs @externalClickhouse',
  async ({ I, homePage }) => {
    I.say(await I.verifyCommand('docker-compose up -d -f docker-compose-clickhouse.yml'));
    await I.wait(180);
    I.say(await I.verifyCommand('docker ps -a'));
  },
);
