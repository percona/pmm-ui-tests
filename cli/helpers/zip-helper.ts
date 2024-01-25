import AdmZip from 'adm-zip';

export function readZipFile(pathToFile: string) {
  console.log(`Reading Zip File: "${pathToFile}"...`);
  return new AdmZip(pathToFile).getEntries().map(({ name }) => name);
}

export function readFileFromZipArchive(zipPath: string, filePath: string) {
  return new AdmZip(zipPath).readFile(filePath);
}

// export function seeEntriesInZip(filepath: string, entriesArray: any[]) {
//   const entries = readZipFile(filepath);
//   entriesArray.forEach((entry: string) => {
//     assert.ok(entries.includes(entry));
//   });
// }
