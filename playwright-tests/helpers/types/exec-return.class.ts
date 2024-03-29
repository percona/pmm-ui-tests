import { test, expect } from '@playwright/test';
import { ExecOutputReturnValue } from 'shelljs';

// TODO: try to refactor it with ExecReturn extends ExecOutputReturnValue
class ExecReturn {
  command: string;
  code: number;
  stdout: string;
  stderr: string;

  constructor(command: string, returnObj: ExecOutputReturnValue) {
    this.command = command;
    this.code = returnObj.code;
    this.stdout = returnObj.stdout;
    this.stderr = returnObj.stderr;
  }

  getStdOutLines(): string[] {
    return this.stdout.trim().split('\n').filter((item) => item.trim().length > 0);
  }

  async assertSuccess() {
    await test.step(`Verify "${this.command}" command executed successfully`, async () => {
      expect(this.code, `"${this.command}" expected to exit with 0! Error: "${this.stderr || this.stdout}"`).toEqual(0);
    });
  }

  async exitCodeEquals(expectedValue: number) {
    await test.step(`Verify "${this.command}" command exit code is ${expectedValue}`, async () => {
      expect(this.code, `"${this.command}" expected to exit with ${expectedValue}! Output: "${this.stdout}"`).toEqual(expectedValue);
    });
  }

  async outContains(expectedValue: string) {
    await test.step(`Verify command output contains ${expectedValue}`, async () => {
      expect(this.stdout, `Stdout does not contain ${expectedValue}!`).toContain(expectedValue);
    });
  }

  async outNotContains(expectedValue: string) {
    await test.step(`Verify command output contains ${expectedValue}`, async () => {
      expect(this.stdout, `Stdout does not contain ${expectedValue}!`).not.toContain(expectedValue);
    });
  }

  async outContainsMany(expectedValues: string[]) {
    for (const val of expectedValues) {
      await test.step(`Verify command output contains ${val}`, async () => {
        expect.soft(this.stdout, `Stdout does not contain '${val}'!`).toContain(val);
      });
    }
    expect(
      test.info().errors,
      `'Contains all elements' failed with ${test.info().errors.length} error(s):\n${this.getErrors()}`,
    ).toHaveLength(0);
  }

  private getErrors(): string {
    const errors: string[] = [];
    for (const obj of test.info().errors) {
      errors.push(`\t${obj.message?.split('\n')[0]}`);
    }
    return errors.join('\n');
  }
}
export default ExecReturn;
