Feature('Generic PMM Server CLI Tests');

Scenario('PMM-T1862 Verify all processes in PMM server are running under non-root user', async ({ I }) => {
  const pmmServerContainerId = await I.verifyCommand('docker ps --filter "name=pmm-server" --format "{{ .ID }}"');

  const processesUser = (await I.verifyCommand(`docker top ${pmmServerContainerId} | awk '{print $1 " " $8}'`))
    .replace('UID CMD\n', '')
    .split('\n');

  console.log(`User is: ${processesUser}`);

  const nonEc2UserProcesses = processesUser.filter((processUser) => !processUser.includes('ec3-user'));

  I.assertTrue(nonEc2UserProcesses.length === 0);
});
