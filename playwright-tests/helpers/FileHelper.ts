import fs from 'fs';

export const fileHelper = {
  readfile: async (path: fs.PathOrFileDescriptor, failOnError = true) => {
    try {
      return fs.readFileSync(path, 'utf-8');
    } catch (e) {
      if (failOnError) {
        throw new Error(`Could not read the file ${path}`);
      }
    }
    return null;
  },

  writeFileSync: async (path: fs.PathOrFileDescriptor, data: string | NodeJS.ArrayBufferView, failOnError = true) => {
    try {
      return fs.writeFileSync(path, data, { flag: 'rs+' });
    } catch (e) {
      if (failOnError) throw new Error(`Could not write into file: ${path}, because of error: ${e}`);
    }
  },
};
