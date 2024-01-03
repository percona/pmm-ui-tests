const assert = require('assert');

const {I,
} = inject();

Feature('Tests for Dump Tool');

Before(async ({ I }) => {
    await I.Authorize();
    I.setRequestTimeout(60000);
});

Scenario(
    'Create Dump Archive and Verify its successful in UI @dump',
    async ({ dumpAPI, dumpPage }) => {
        const resp = await dumpAPI.createDump([]);
        const uid = JSON.parse(JSON.stringify(resp));

        I.amOnPage(dumpPage.url);
        // Required wait as delete in previous test takes time to reload page content.
        I.wait(5);
        await dumpAPI.waitForDumpStatus(uid.dump_id);
        dumpPage.verifyDumpVisible(uid.dump_id);
        await dumpAPI.deleteDumps(uid.dump_id);
    },)

Scenario(
    'Verify Edit Buttons are Enabled for Dump @dump',
    async ({ dumpAPI, dumpPage }) => {
        const resp = await dumpAPI.createDump([]);
        const uid = JSON.parse(JSON.stringify(resp));
        await dumpAPI.waitForDumpStatus(uid.dump_id);
        I.amOnPage(dumpPage.url);
        // Required wait as delete in previous test takes time to reload page content.
        I.wait(5);
        await I.click(dumpPage.fields.status(uid.dump_id));
        dumpPage.verifyDownloadEnabled();
        dumpPage.verifyDeleteEnabled();
        dumpPage.verifySFTPEnabled();
        await dumpAPI.deleteDumps(uid.dump_id);
    },)

Scenario(
    'Download and Verify Dump Archive with QAN enabled @dump',
    async ({ dumpAPI, dumpPage, I }) => {
        const resp = await dumpAPI.createDump([], true);
        const uid = JSON.parse(JSON.stringify(resp));
        await dumpAPI.waitForDumpStatus(uid.dump_id);

        I.amOnPage(dumpPage.url);
        // Required wait as delete in previous test takes time to reload page content.
        I.wait(5);
        dumpPage.verifyDumpVisible(uid.dump_id);
        await dumpAPI.downloadDump(uid.dump_id);
        const result = await dumpAPI.verifyDump(uid.dump_id);
            I.assertEqual(
                2,
                result.isDir,
                `Expected 2 folders in the archive but found ${result.isDir}`,
            );
            I.assertEqual(
                2,
                result.isFile,
                `Expected 2 files in the archive but found ${result.isFile}`,
            );
        await dumpAPI.deleteDumps(uid.dump_id);
    },)

Scenario(
    'Download and Verify Dump Archive with QAN disabled @dump',
    async ({ dumpAPI, dumpPage, I }) => {
            const resp = await dumpAPI.createDump([],false);
            const uid = JSON.parse(JSON.stringify(resp));
            await dumpAPI.waitForDumpStatus(uid.dump_id);

            I.amOnPage(dumpPage.url);
            // Required wait as delete in previous test takes time to reload page content.
            I.wait(5);
            dumpPage.verifyDumpVisible(uid.dump_id);
            await dumpAPI.downloadDump(uid.dump_id);
            const result = await dumpAPI.verifyDump(uid.dump_id);
            I.assertEqual(
                1,
                result.isDir,
                `Expected 1 folders in the archive but found ${result.isDir}`,
            );
            I.assertEqual(
                2,
                result.isFile,
                `Expected 2 files in the archive but found ${result.isFile}`,
            );
            await dumpAPI.deleteDumps(uid.dump_id);
    },)

Scenario(
    'Check Dump Archives can be sent to Support in UI @dump',
    async ({ dumpAPI, dumpPage }) => {
        const resp = await dumpAPI.createDump([]);
        const uid = JSON.parse(JSON.stringify(resp));
        await dumpAPI.waitForDumpStatus(uid.dump_id);

        I.amOnPage(dumpPage.url);
        // Required wait as delete in previous test takes time to reload page content.
        I.wait(5);
        await I.click(dumpPage.fields.status(uid.dump_id));
        dumpPage.verifySFTPEnabled();
        await I.click(dumpPage.fields.sendSupportButton);
        dumpPage.verifySFTP();
        await dumpAPI.deleteDumps(uid.dump_id);
    },)
Scenario(
    'Verify Dump extraction logs are visible @dump',
    async ({ dumpAPI, dumpPage }) => {
        const resp = await dumpAPI.createDump([]);
        const uid = JSON.parse(JSON.stringify(resp));
        await dumpAPI.waitForDumpStatus(uid.dump_id);

        I.amOnPage(dumpPage.url);
        // Required wait as delete in previous test takes time to reload page content.
        I.wait(5);
        dumpPage.verifyLogsVisible(uid.dump_id);
        await dumpAPI.deleteDumps(uid.dump_id);
    },
);

Scenario(
    'Verify details of Dump based on Service Name @dump-test',
    async ({ dumpAPI, dumpPage }) => {
        const resp = await dumpAPI.createDump(['pmm-server-postgresql']);
        const uid = JSON.parse(JSON.stringify(resp));
        await dumpAPI.waitForDumpStatus(uid.dump_id);

        I.amOnPage(dumpPage.url);
        // Required wait as delete in previous test takes time to reload page content.
        I.wait(5);
        await dumpPage.verifyService(uid.dump_id);
        I.waitForText('pmm-server-postgresql');
        await dumpAPI.deleteDumps(uid.dump_id);
    },
);
