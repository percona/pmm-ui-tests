# PMM UI Tests — AI Agent Development Guide

<!-- SINGLE ENTRY POINT for all AI coding assistants (Claude Code, Cursor, GitHub Copilot, etc.)
     Compatibility shims: CLAUDE.md, .cursorrules, .github/copilot-instructions.md
     Last reviewed: 2026-03 -->

## PMM Context

This repository is part of [Percona Monitoring and Management (PMM)](https://github.com/percona/pmm). For the product-wide overview, architecture, and domain model, see [copilot-instructions.md](https://github.com/percona/pmm/blob/v3/.github/copilot-instructions.md) in the main PMM repo.

**Role in PMM**: The largest PMM E2E test suite — browser-based UI tests and `pmm-admin` CLI tests. Contains two test stacks: a large **CodeceptJS** suite (JavaScript) and a newer **Playwright Test** suite (TypeScript), plus a dedicated CLI test project.

**Communicates with**: PMM Server (via browser + REST API), PMM Client (`pmm-admin` CLI). Works alongside [pmm-qa](https://github.com/percona/pmm-qa) (CI orchestration, Playwright E2E, Helm tests) and the monorepo's `/api-tests` (Go API integration tests).

## PMM QA Testing Landscape

| Repository | Test Type | Framework | Language | Target |
|------------|-----------|-----------|----------|--------|
| [pmm-qa](https://github.com/percona/pmm-qa) | Browser E2E, Helm, CI orchestration | Playwright, Bats | TypeScript, Shell | PMM UI, Kubernetes |
| **pmm-ui-tests** (this repo) | Browser E2E (large), CLI automation | CodeceptJS + Playwright, Playwright Test | JavaScript, TypeScript | PMM UI, pmm-admin CLI |
| [pmm/api-tests](https://github.com/percona/pmm/tree/main/api-tests) | API integration | Go `testing` + Swagger clients | Go | PMM REST APIs |

## Architecture

### Dual Test Stack

This repo contains **two parallel E2E stacks** plus a CLI project:

| Stack | Location | Config | Language | Status |
|-------|----------|--------|----------|--------|
| **CodeceptJS** | `tests/` | `pr.codecept.js` | JavaScript | Large, mature suite (~70+ page objects, extensive feature coverage) |
| **Playwright Test** | `playwright-tests/` | `playwright-tests/playwright.config.ts` | TypeScript | Newer, growing suite — used in CI via `pmm-ui-tests.yml` |
| **CLI (Playwright)** | `cli/` | `cli/playwright.config.ts` | TypeScript | `pmm-admin` CLI automation |

### How They Connect to PMM

```
pmm-ui-tests
  → Browser (Chromium via Playwright)
    → PMM Server UI (Grafana + PMM pages)
      → REST API calls for setup/assertions
        → pmm-managed → PostgreSQL / VictoriaMetrics / ClickHouse

cli/
  → pmm-admin CLI (shell execution)
    → PMM Server API
```

## Directory Structure

```
pmm-ui-tests/
├── pr.codecept.js                      # CodeceptJS main config
├── codeceptConfigHelper.js             # Page object injection + parallel chunking
├── package.json                        # Root deps: codeceptjs, playwright, mocha, axios, DB drivers
├── docker-compose.yml                  # PMM Server + MySQL/Mongo/Postgres
├── docker-compose-*.yml                # Variants: SSL, AMI, Allure, encryption, etc.
│
├── tests/                              # CodeceptJS test suite (large)
│   ├── *_test.js                       # Top-level feature files
│   ├── upgrade/                        # Upgrade scenario tests
│   ├── QAN/                            # Query Analytics tests
│   ├── configuration/                  # Settings and config tests
│   ├── backup/                         # Backup/restore tests
│   ├── ia/                             # Integrated alerting tests
│   ├── advisors/                       # Advisor checks tests
│   ├── dashboards/                     # Dashboard verification tests
│   ├── remoteInstances/                # Remote instance tests
│   ├── server-admin/                   # Server administration tests
│   ├── cli/                            # CLI-related UI tests
│   ├── qa-integration/                 # Cross-component integration tests
│   ├── pages/                          # Page objects (~70+ modules)
│   │   ├── api/                        # API page objects (inventoryAPI, settingsAPI, etc.)
│   │   ├── dashboards/                 # Dashboard page objects
│   │   └── ...                         # Feature-specific page objects
│   ├── helper/                         # Helpers (Grafana auth, hooks, locators)
│   ├── custom_steps.js                 # Extended CodeceptJS actor (I)
│   └── fixtures/                       # Test fixtures
│
├── playwright-tests/                   # Playwright Test suite (newer)
│   ├── playwright.config.ts            # Config: PMM_UI_URL, Chromium, single worker
│   ├── package.json                    # Separate deps: @playwright/test
│   ├── tests/
│   │   ├── inventory/                  # Inventory tests
│   │   ├── configuration/              # Configuration tests
│   │   └── upgrade/                    # Upgrade tests
│   ├── pages/                          # Class-based page objects (TypeScript)
│   │   ├── common.page.ts              # Base page class
│   │   ├── dashboards/
│   │   ├── qan/
│   │   └── login/
│   ├── api/                            # API clients for test setup
│   │   ├── api.ts
│   │   ├── server.api.ts
│   │   └── helpers/api-helper.ts
│   └── helpers/
│       ├── test-helper.ts              # test.extend with page object fixtures
│       └── grafana-helper.ts           # Authorization helper
│
├── cli/                                # CLI test project (Playwright Test)
│   ├── playwright.config.ts            # Config: 6 workers, testDir: './tests'
│   ├── tests/*.spec.ts                 # pmm-admin CLI test specs
│   ├── helpers/                        # CLI-specific helpers
│   ├── support/                        # Support utilities
│   └── test-setup/
│       └── docker-compose-*.yml        # CLI-specific PMM environments
│
├── testdata/                           # Shared test data
│   ├── backup-management/mongodb/      # MongoDB replica + PBM setup scripts
│   ├── docker-db-setup-scripts/        # Database initialization
│   ├── mysql/, pgsql/, mongodb/        # DB-specific fixtures (SQL, certs)
│   ├── ia/                             # Alerting test data
│   └── external-services/              # External service configs
│
├── utils/                              # Small utilities
│   ├── triggerAdvisors.js              # Advisor trigger script
│   └── ssh-connect.exp                 # SSH expect script
│
└── .github/workflows/
    ├── ci.yml                          # PR lint + matrix E2E (calls pmm-qa)
    ├── pmm-ui-tests.yml                # Reusable Playwright runner
    └── pmm-ui-tests-matrix.yml         # Matrix dispatch (rbac, inventory, etc.)
```

## CodeceptJS Suite (`tests/`)

### Configuration

- **Config**: `pr.codecept.js`
- **Base URL**: `PMM_UI_URL` env var (default `http://localhost/`)
- **Browser**: Chromium via Playwright helper
- **Auth**: `ADMIN_PASSWORD` env var (default `admin`)
- **Custom locator**: `data-testid` plugin for `I.useDataQA()` helpers
- **Parallel**: `codeceptConfigHelper.js` splits tests into "dependent" and "independent" chunks

### Page Object Injection

`codeceptConfigHelper.js` maps ~70+ names to page object modules:

```javascript
// Injected via include: { loginPage, dashboardPage, inventoryAPI, ... }
const { loginPage, dashboardPage } = inject();
```

### Test Pattern (CodeceptJS)

```javascript
Feature('MySQL Dashboards @dashboards @mysql');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario('Verify MySQL Overview dashboard @nightly', async ({ I, dashboardPage }) => {
  // Navigate and verify
  dashboardPage.open('mysql-overview');
  I.waitForVisible(dashboardPage.fields.panelTitle);
  // ...assertions
});
```

### Tags

Tests use `@tag` annotations in titles for CI filtering: `@dashboards`, `@qan`, `@settings`, `@backup`, `@inventory`, `@rbac`, `@nightly`, `@not-ui-pipeline`, `@grafana-pr`, `@stt`, `@fb-alerting`, etc.

### Running CodeceptJS

```bash
# Install dependencies
npm ci

# Run all PR-scoped tests
npm run e2e

# Run specific tag
npx codeceptjs run --grep @dashboards -c pr.codecept.js

# Run specific file
npx codeceptjs run tests/verifyMysqlDashboards_test.js -c pr.codecept.js
```

## Playwright Test Suite (`playwright-tests/`)

### Configuration

- **Config**: `playwright-tests/playwright.config.ts`
- **Base URL**: `PMM_UI_URL` env var (default `https://localhost`)
- **Browser**: Chromium project, single worker
- **Reporter**: HTML report

### Page Objects (TypeScript)

Class-based page objects extending a common base:

```typescript
export class ServicesPage extends CommonPage {
  async addService(page: Page, serviceName: string) {
    await page.getByTestId('add-service-btn').click();
    // ...
  }
}
```

### Fixtures

`helpers/test-helper.ts` uses Playwright's `test.extend` for page object injection:

```typescript
export const test = base.extend<Fixtures>({
  servicesPage: async ({}, use) => { await use(new ServicesPage()); },
  qanPage: async ({}, use) => { await use(new QanPage()); },
});
```

### Running Playwright Test

```bash
cd playwright-tests

# Install dependencies
npm ci
npx playwright install-deps
npx playwright install chromium

# Run all tests
npx playwright test

# Run specific tag
npx playwright test --grep @inventory

# Run RBAC tests
npm run e2e:rbac
```

## CLI Tests (`cli/`)

- **Framework**: Playwright Test (TypeScript)
- **Target**: `pmm-admin` CLI commands
- **Workers**: 6 (parallelized)
- **Setup**: Dedicated docker-compose files in `cli/test-setup/`

## Patterns and Conventions

### Do
- Use **Page Object Model** — encapsulate selectors and actions in page classes
- Use **`data-testid`** locators (stable across Grafana upgrades)
- Tag tests with `@tag` annotations for CI filtering
- Make tests **idempotent** — clean up created resources via API in teardown
- Use API helpers for test setup (creating services, agents) instead of UI clicks
- Use Playwright's `test.step()` for readable Playwright Test structure
- Use `I.Authorize()` (CodeceptJS) or `grafanaHelper.authorize(page)` (Playwright) for auth
- **New tests should go in `playwright-tests/`** (TypeScript, Playwright Test) unless extending existing CodeceptJS feature files

### Don't
- Don't use CSS class selectors for Grafana elements — they change with Grafana upgrades
- Don't hardcode `PMM_UI_URL` or `ADMIN_PASSWORD` — use env vars
- Don't mix CodeceptJS and Playwright Test patterns in the same test file
- Don't add tests to `tests/` (CodeceptJS) for new features — prefer `playwright-tests/`
- Don't skip resource cleanup — CI runs share server state

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PMM_UI_URL` | `http://localhost/` (Codecept) / `https://localhost` (Playwright) | PMM Server URL |
| `ADMIN_PASSWORD` | `admin` | Grafana/PMM admin password |
| `PMM_SERVER_IMAGE` | `perconalab/pmm-server:3-dev-latest` | PMM Server Docker image |
| `NODE_TLS_REJECT_UNAUTHORIZED` | `0` (Codecept) | Accept self-signed certs |

## CI Pipeline

- **`ci.yml`**: On PRs — lints `tests/`, then calls `pmm-qa` E2E matrix workflow
- **`pmm-ui-tests.yml`**: Reusable Playwright runner — provisions PMM Server, sets up clients, runs `playwright-tests/` with `--grep` filtering
- **`pmm-ui-tests-matrix.yml`**: Dispatch jobs (rbac, inventory, config, etc.) reusing `pmm-ui-tests.yml`

## Key Files to Reference

### CodeceptJS
- `pr.codecept.js` — main config (helpers, plugins, test roots)
- `codeceptConfigHelper.js` — page object mapping and parallel chunking
- `tests/custom_steps.js` — extended actor methods
- `tests/helper/grafana_helper.js` — Grafana auth helper
- `tests/pages/` — page object modules

### Playwright Test
- `playwright-tests/playwright.config.ts` — config
- `playwright-tests/helpers/test-helper.ts` — fixture-based page object injection
- `playwright-tests/helpers/grafana-helper.ts` — auth helper
- `playwright-tests/pages/` — TypeScript page objects
- `playwright-tests/api/` — API client helpers

### CLI
- `cli/playwright.config.ts` — CLI test config
- `cli/tests/` — CLI test specs

### Environment
- `docker-compose.yml` — local PMM Server + databases
- `testdata/` — DB setup scripts, certs, fixtures
