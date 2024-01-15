const { I } = inject();
const assert = require('assert');
const request = require('request');
const fs = require('fs');
const targz = require("tar.gz");
const path = require('path');
const {readdirSync} = require("fs");
const outputDir= 'tests/output/';

module.exports = {
  async createDump(serviceName, Qan = true) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const defaultTime = new Date();
    defaultTime.setMinutes(defaultTime.getMinutes() - 5);

    const body =
    {
      service_names: serviceName || [],
      start_time: new Date(defaultTime.toUTCString()),
      end_time: new Date(new Date().toUTCString()),
      ignore_load: true,
      export_qan: Qan,
    };

    const resp = await I.sendPostRequest('v1/management/dump/Dumps/Start', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to create Dump Archive. Response message is ${resp.data.message}`,
    );

    return resp.data;
  },

  async downloadDump(uid) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const targzFile = outputDir + '/' + uid + '.tar.gz';
    const destnDir = outputDir + '/' + uid ;

    return new Promise((resolve, reject) => {
      request.get(process.env.PMM_UI_URL + 'dump/' + uid + '.tar.gz', {headers: headers}, function (error, response, body) {
      }).pipe(fs.createWriteStream(targzFile))
          .on('close', function() {
            targz().extract(targzFile, destnDir)
            resolve(true);
          })
    })
  },

  async verifyDump(uid){
    await new Promise(resolve => {setTimeout(resolve, 10000)});
    const destnDir = outputDir + '/' + uid ;
    let isDir=0;
    let isFile=0;
    if (fs.existsSync(destnDir)) {
      const contents = readdirSync(destnDir);
      contents.forEach((item) => {
        const fullPath = path.join(destnDir, item);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          isDir = isDir + 1;
        } else if (stats.isFile()) {
          isFile = isFile + 1;
        }
      });
    }
    return {isDir, isFile};
    },

  async listDumps() {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    return I.sendPostRequest('v1/management/dump/Dumps/List', {}, headers);
  },

  async getDumpStatus(uid) {
    const dump = await this.listDumps();
    const { dumps } = dump.data;
    return dumps.find((item) => item.dump_id === uid && item.status === 'DUMP_STATUS_SUCCESS');
  },

  async waitForDumpStatus(uid, timeout = 60) {
    await I.asyncWaitFor(async () => this.getDumpStatus(uid), timeout);
  },

  async deleteDump(uid) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const body = JSON.stringify({dump_ids:[uid]});
    return I.sendPostRequest('v1/management/dump/Dumps/Delete',body, headers);
  },

};
