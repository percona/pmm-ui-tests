const assert = require('assert');

const {I,
} = inject();

Feature('Tests for Dump Tool');

Before(async ({ I }) => {
    await I.Authorize();
    I.setRequestTimeout(60000);
});

Scenario(
    'Create Dump Archive and verify its successful @dump',
    async ({ dumpAPI, dumpPage }) => {
        const resp = await dumpAPI.createDump('');
        const uid = JSON.parse(JSON.stringify(resp));
        I.amOnPage(dumpPage.url);
        await dumpAPI.waitForDumpStatus(uid.dump_id);
        await dumpPage.verifyDumpVisible(uid.dump_id);

        //await dumpAPI.deleteDumps(uid.dump_id);
    },)

Scenario(
    'Verify for Edit Buttons Enabled for Dump @dump',
    async ({ dumpAPI, dumpPage }) => {
        const resp = await dumpAPI.createDump('');
        const uid = JSON.parse(JSON.stringify(resp));
        await dumpAPI.waitForDumpStatus(uid.dump_id);
        I.amOnPage(dumpPage.url);
        await I.click(dumpPage.fields.status(uid.dump_id));
        await dumpPage.verifyDownloadEnabled();
        await dumpPage.verifyDeleteEnabled();
        await dumpPage.verifySFTPEnabled();

        //await dumpAPI.deleteDumps(uid.dump_id);
    },)

Scenario(
    'Download and Verify Dump Archive @dump',
    async ({ dumpAPI, dumpPage, I }) => {
        const resp = await dumpAPI.createDump('');
        const uid = JSON.parse(JSON.stringify(resp));
        await dumpAPI.waitForDumpStatus(uid.dump_id);

        I.amOnPage(dumpPage.url);
        await dumpPage.verifyDumpVisible(uid.dump_id);
        await dumpAPI.downloadDump(uid.dump_id);
        await dumpAPI.verifyDump(uid.dump_id);
        dumpAPI.verifyDir();
        //await dumpAPI.deleteDumps(uid.dump_id);
    },)

Scenario(
    'Check Dump Archives can be sent to Support @dump',
    async ({ dumpAPI, dumpPage }) => {
        const resp = await dumpAPI.createDump('');
        const uid = JSON.parse(JSON.stringify(resp));
        await dumpAPI.waitForDumpStatus(uid.dump_id);

        I.amOnPage(dumpPage.url);
        await I.click(dumpPage.fields.status(uid.dump_id));
        await dumpPage.verifySFTPEnabled();
        await I.click(dumpPage.fields.sendSupportButton);
        await dumpPage.verifySFTP();
        //await dumpAPI.deleteDumps(uid.dump_id);
    },)
Scenario(
    'Verify Dump logs are visible @dump',
    async ({ dumpAPI, dumpPage }) => {
        const resp = await dumpAPI.createDump('');
        const uid = JSON.parse(JSON.stringify(resp));
        await dumpAPI.waitForDumpStatus(uid.dump_id);

        I.amOnPage(dumpPage.url);
        await dumpPage.verifyLogsVisible(uid.dump_id);
        //await dumpAPI.deleteDumps(uid.dump_id);
    },
);
