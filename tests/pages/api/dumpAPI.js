const { I } = inject();
const assert = require('assert');
const request = require('request');
const fs = require('fs');
const targz = require("tar.gz");
const path = require('path');
const {readdirSync} = require("fs");
const outputDir= 'tests/output/';

module.exports = {
  /**
   * Simulates adding new dashboard with custom panels via inner grafana API to keep test
   * resistance to UI changes in different Grafans versions.
   *
   * @return  {Promise<*>}      response object
   * @param serviceName
   * @param Qan
   */
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
    const body = {};
    return I.sendPostRequest('v1/management/dump/Dumps/List',body, headers);
  },

  async waitForDumpStatus(uid) {
    // 1 sec ping for getting Success status for Dumps for 60 Secs
    const dumps = await this.listDumps();
    for (let i = 0; i < 600000; i++) {
      const isSuccess = await Object.values(dumps.data)
          .flat(Infinity)
          .every(({dump_id, status}) => ((dump_id === uid && status === "DUMP_STATUS_SUCCESS")));
        if (isSuccess) {
          return dumps;
        }
      }
    return null;
  },

  async deleteDumps(uid) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const body = JSON.stringify({dump_ids:[uid]});
    return I.sendPostRequest('v1/management/dump/Dumps/Delete',body, headers);
  },

};