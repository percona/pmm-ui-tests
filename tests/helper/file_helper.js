const Helper = codecept_helper;
const assert = require('assert');
const fs = require('fs');

class FileHelper extends Helper {
  async writeFileSync(path, data, writeOptional = false) {
    try {
      return fs.writeFileSync(path, data, { flag: 'rs+' });
    } catch (e) {
      if (!writeOptional) assert.ok(false, `Could not write into file: ${path}, because of error: ${e}`);
    }

    return null;
  }

  async readFileSync(path, readOptional = false) {
    try {
      return fs.readFileSync(path, 'utf8');
    } catch (e) {
      if (!readOptional) assert.ok(false, `Could not read into file: ${path}, because of error: ${e}`);
    }

    return null;
  }
}

module.exports = FileHelper;
