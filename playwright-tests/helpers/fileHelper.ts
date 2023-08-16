import fs from 'fs';

export const fileHelper = {
  /**
   * Checks whether specified path exists or not. Just a lib wrapper.
   *
   * @param  path   path to file to evaluate
   */
  fileExists: (path: string): boolean => {
    return fs.existsSync(path);
  },

  readFile: (path: fs.PathOrFileDescriptor) => {
    try {
      return fs.readFileSync(path, 'utf-8');
    } catch (e) {
      throw new Error(`Could not read the file ${path}`);
    }
  },

  writeToFile: (path: fs.PathOrFileDescriptor, data: string | NodeJS.ArrayBufferView, failOnError = true): void => {
    try {
      fs.writeFileSync(path, data, { flag: 'w+' });
    } catch (e) {
      if (failOnError) throw new Error(`Could not write into file: ${path}, because of error: ${e}`);
    }
  },

  removeFile: (path: fs.PathLike, failOnError = true) => {
    try {
      fs.rmSync(path);
    } catch (e) {
      if (failOnError) throw new Error(`Could not write into file: ${path}, because of error: ${e}`);
    }
  },
};
