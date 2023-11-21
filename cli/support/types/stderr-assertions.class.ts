import { test, expect } from '@playwright/test';

class StderrAssertions {
  private command: string;
  text: string;
  private readonly lines: string[];

  constructor(command: string, stdErr: string) {
    this.command = command;
    this.text = stdErr;
    this.lines = this.text.trim().split('\n').filter((item) => item.trim().length > 0);
  }

  getLines(): string[] {
    return this.lines;
  }

  async equals(expectedValue: string) {
    expect(this.text, `Verify Stdout equals ${expectedValue}!`).toBe(expectedValue);
  }

  async contains(expectedValue: string) {
    await test.step(`Verify command output contains ${expectedValue}`, async () => {
      expect(this.text, `Stdout does not contain ${expectedValue}!`).toContain(expectedValue);
    });
  }
}

export default StderrAssertions;
