const { I } = inject();
const assert = require('assert');
const fs = require('fs');
const targz = require("tar.gz");

module.exports = {
  /**
   * Simulates adding new dashboard with custom panels via inner grafana API to keep test
   * resistance to UI changes in different Grafans versions.
   *
   * @return  {Promise<*>}      response object
   * @param serviceName
   */
  async createDump(serviceName) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const body =
    {
      service_names:[] || serviceName,
      start_time: new Date(new Date().toUTCString()),
      end_time: new Date(new Date().toUTCString()),
      ignore_load:true,
      export_qan:true,
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
    const request = require('request');
    return new Promise((resolve, reject) => {
      request.get(process.env.PMM_UI_URL + 'dump/' + uid + '.tar.gz', {headers: headers}, function (error, response, body) {
      }).pipe(fs.createWriteStream(output_dir + '/' + uid + '.tar.gz'))
          .on('close', function () {
            console.log('File written!');
            resolve(true);
          }).on("error", err => {
        console.log("Error writing File: " + err.message);
      });
    })
  },

  async verifyDump(uid) {
    const targzFile = output_dir + '/' + uid + '.tar.gz';
    const destnDir = output_dir + '/' + uid ;
    return new Promise((resolve, reject) => {
    targz().extract(targzFile, destnDir, function (err, finish) {
      if (err)
        console.log(err);
      if (finish)
      console.log('The extraction has ended!'); resolve(true);
    })
    })
  },

  verifyDir(){
    const destnDir = '/home/saikumar/WORKDIR/pmm-ui-tests/new';
    fs.readdir(destnDir,
        { withFileTypes: true },
        (err, files) => {
         console.log("\nCurrent directory files:");
         if (err)
           console.log(err);
         else {
           files.forEach(file => {
             console.log(file);
           })
         }})
    },

  async listDumps() {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const body = {};
    return I.sendPostRequest('v1/management/dump/Dumps/List',body, headers);
  },

  async waitForDumpStatus(uid) {
    // 30 sec ping for getting Success status for Dumps
    const dumps = await this.listDumps();
    for (let i = 0; i < 500; i++) {
      const isSuccess = Object.values(dumps.data)
          .flat(Infinity)
          .every(({dump_id, status}) => (( dump_id === uid && status === "DUMP_STATUS_SUCCESS")));
      if (isSuccess) {
        return dumps;
      }
    }
    return false;
  },

  async deleteDumps(uid) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const body = JSON.stringify({dump_ids:[uid]});
    return I.sendPostRequest('v1/management/dump/Dumps/Delete',body, headers);
  },

};
