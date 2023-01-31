import fs from 'fs';
import assert from 'assert';

export const fileHelper = {
	readfile: async (path, failOnError = true) => {
		try {
			return fs.readFileSync(path, 'utf-8');
		} catch (e) {
			if(failOnError) {
				throw new Error(`Could not read the file ${path}`)
			}
		}
	},

	writeFileSync: async (path, data, failOnError = true) => {
		try {
		  return fs.writeFileSync(path, data, { flag: 'rs+' });
		} catch (e) {
		  if (failOnError) throw new Error(`Could not write into file: ${path}, because of error: ${e}`);
		}
	},
}

