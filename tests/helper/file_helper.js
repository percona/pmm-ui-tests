const Helper = codecept_helper;
const assert = require('assert');
const fs = require('fs');

class FileHelper extends Helper {
  async writeFileSync(path, data) {
    try {
      return fs.writeFileSync(path, data);
    } catch (e) {
      assert.ok(false, `Could not write into file: ${path}, because of error: ${e}`);
    }

    return null;
  }

  async readFileSync(path) {
    try {
      return fs.readFileSync(path, 'utf8');
    } catch (e) {
      assert.ok(false, `Could not write into file: ${path}, because of error: ${e}`);
    }

    return null;
  }
}

module.exports = FileHelper;
