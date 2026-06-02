import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

type PackageJson = {
  scripts?: Record<string, string>;
};

const repoRoot = path.resolve(__dirname, '../../../../..');

function readJson(relativePath: string): PackageJson {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf8')) as PackageJson;
}

function readText(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('workspace truthfulness scripts', () => {
  it('defines explicit root scripts for prisma generation and honest mobile test execution', () => {
    const rootPackage = readJson('package.json');
    const scripts = rootPackage.scripts ?? {};

    expect(scripts['prisma:generate']).toBe(
      'pnpm --filter @designli-challenge/api prisma:generate',
    );
    expect(scripts['prisma:migrate:deploy']).toBe(
      'pnpm --filter @designli-challenge/api prisma:migrate:deploy',
    );
    expect(scripts.setup).toBe(
      'pnpm install && pnpm prisma:generate && pnpm prisma:migrate:deploy',
    );
    expect(scripts.test).toBe('pnpm test:api && pnpm test:mobile');
    expect(scripts['test:mobile']).toBe('pnpm --filter @designli-challenge/mobile test');
    expect(scripts['typecheck:api']).toBe('pnpm --filter @designli-challenge/api typecheck');
  });

  it('keeps Prisma generation explicit instead of hidden behind API quality prehooks', () => {
    const apiPackage = readJson('apps/api/package.json');
    const scripts = apiPackage.scripts ?? {};

    expect(scripts['prisma:generate']).toBe('prisma generate');
    expect(scripts['prisma:migrate:deploy']).toBe('prisma migrate deploy');
    expect(scripts.prebuild).toBeUndefined();
    expect(scripts.pretest).toBeUndefined();
    expect(scripts.typecheck).toBe('tsc --noEmit');
    expect(scripts.pretypecheck).toBeUndefined();
  });

  it('removes false-green mobile test flags and contaminated workspace metadata', () => {
    const mobilePackage = readJson('apps/mobile/package.json');
    const scripts = mobilePackage.scripts ?? {};
    const workspaceYaml = readText('pnpm-workspace.yaml');

    expect(scripts.test).toBe('jest --runInBand');
    expect(scripts.test).not.toContain('passWithNoTests');
    expect(workspaceYaml).not.toContain('set this to true or false');
  });
});
