import { describe, it, expect } from 'vitest';

function checkEnvVar(name: string) {
  it(`should have ${name} set`, () => {
    expect(process.env[name]).toBeDefined();
    expect(process.env[name]).not.toBe('');
  });
}

describe('Environment Variables', () => {
  checkEnvVar('DATABASE_URL');
  // Add more required env vars here as needed
});
