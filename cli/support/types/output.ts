import {  expect } from '@playwright/test';

class Output {
  command: string;
  code: number;
  stdout: string;
  stderr: string;

  constructor(command: string, exitCode: number, stdOut: string, stdErr: string) {
    this.command = command;
    this.code = exitCode;
    this.stdout = stdOut;
    this.stderr = stdErr;
  }

  assertSuccess() {
    expect(this.code, `"${this.command}" expected to exit with 0! Error: "${this.stderr}"`).toEqual(0);
  }
}

export default Output;
