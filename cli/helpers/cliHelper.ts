import { test } from '@playwright/test';
import Output from "@support/types/output";
const shell = require('shelljs');

/**
 * Shell(sh) exec() wrapper to return handy {@link Output} object.
 *
 * @param       command   sh command to execute
 * @return      {@link Output} instance
 */
export async function createFile(pathToFile: string, content: string,  stepTitle: string = null): Promise<Output> {
  const stepName = stepTitle ? stepTitle : `Create "${pathToFile}" file with content:\n"${content}"`;
  const command = `echo: "${content}" >> ${pathToFile}`;
  const { stdout, stderr, code } = await test.step(stepName, async () => {
    console.log(command);
    return shell.echo(content).to(pathToFile);
  });
  if (stdout.length > 0) console.log(`Out: "${stdout}"`);
  return new Output(command, code, stdout, stderr);
}

/**
 * Shell(sh) exec() wrapper to use outside outside {@link test}
 * returns handy {@link Output} object.
 *
 * @param       command   sh command to execute
 * @return      {@link Output} instance
 */
export function execute(command: string): Output {
  console.log(`exec: "${command}"`);
  const { stdout, stderr, code } = shell.exec(command.replace(/(\r\n|\n|\r)/gm, ''), { silent: false });
  if (stdout.length > 0) console.log(`Out: "${stdout}"`);
  if (stderr.length > 0) console.log(`Error: "${stderr}"`);
  return new Output(command, code, stdout, stderr);
}

/**
 * Shell(sh) exec() wrapper to return handy {@link Output} object.
 *
 * @param       command   sh command to execute
 * @return      {@link Output} instance
 */
export async function exec(command: string): Promise<Output> {
  return await test.step(`Run "${command}" command`, async () => {
    return this.execute(command);
  });
}

/**
 * Silent Shell(sh) exec() wrapper to return handy {@link Output} object.
 * Provides no logs to skip huge outputs.
 *
 * @param       command   sh command to execute
 * @return      {@link Output} instance
 */
export async function execSilent(command: string): Promise<Output> {
  const { stdout, stderr, code } = await test.step(`Run "${command}" command`, async () => {
    return shell.exec(command.replace(/(\r\n|\n|\r)/gm, ''), { silent: false });
  });
  return new Output(command, code, stdout, stderr);
}

/**
 * Scrape all metrics from exporter found by Service Name
 * **Note** will not work for versions earlier 2.29.0
 * as "port" was not included in pmm-admin output
 *
 * @param   serviceName         name of the service to search for the exporter
 * @param   agentUser           username to authenticate to exporter
 * @param   agentPassword       password for specified username to authenticate to exporter
 * @param   dockerContainer     Optional! docker container name to scrape metrics from
 */
export async function getMetrics(serviceName: string, agentUser: string, agentPassword: string,
                                 dockerContainer: string = null,): Promise<string> {
  const output = await test.step(
      `Scraping "${serviceName}" metrics${dockerContainer ? `in "${dockerContainer}" container` : ''}`,
      async () => {
    const prefix = dockerContainer ? `docker exec ${dockerContainer} ` : '';
    const listCmd = `${prefix ? prefix : 'sudo '}pmm-admin list`;

    console.log(`Run: "${listCmd}"`);
    const { out, err, c } = shell.exec(listCmd.replace(/(\r\n|\n|\r)/gm, ''), { silent: false });
    if (out.length > 0) console.log(`Out: "${out}"`);
    if (err.length > 0) console.log(`Error: "${err}"`);

    const agentList = new Output(listCmd, c, out, err).getStdOutLines()

    const serviceId = agentList.find((item) => item.includes(serviceName))
        .split(' ')
        .find((item) => item.includes('/service_id/')).trim();

    const listenPort = agentList.filter((item) => item.includes(serviceId))
        .find((item) => item.includes('_exporter'))
        .split(' ').filter((item) => item.trim().length > 0)
        .at(-1);

    const scrapeCmd = `${prefix}curl -s "http://${agentUser}:${agentPassword}@127.0.0.1:${listenPort}/metrics"`;

    console.log(`Run: "${scrapeCmd}"`);
    const { stdout, stderr, code } = shell.exec(scrapeCmd.replace(/(\r\n|\n|\r)/gm, ''), { silent: false });
    if (stdout.length > 0) console.log(`Out: "${stdout}"`);
    if (stderr.length > 0) console.log(`Error: "${stderr}"`);

    return new Output(scrapeCmd, code, stdout, stderr);
  });
  await output.assertSuccess();
  //TODO: parse into map(k => v) or json
  return output.stdout
}
