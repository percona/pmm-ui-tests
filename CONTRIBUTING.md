great in terms of usability. The same applies for types `HTTPURLProvider` vs
# Contributing to PMM UI Tests

Thank you for your interest in contributing to the Percona Monitoring and Management (PMM) UI automated tests! This document outlines the guidelines, conventions, and best practices for contributing to this repository.

---

## Table of Contents
- [Project Overview](#project-overview)
- [How to Contribute](#how-to-contribute)
- [Code Style & Patterns](#code-style--patterns)
- [Test Organization](#test-organization)
- [Environment & Setup](#environment--setup)
- [Pull Requests](#pull-requests)
- [Reporting Issues](#reporting-issues)

---

## Project Overview
- This repository contains end-to-end automated tests for PMM UI using CodeceptJS and Playwright.
- Major directories:
  - `tests/` — CodeceptJS test suites, helpers, and page objects
  - `playwright-tests/` — Playwright test suites and configs (DEPRECATED)
  - `cli/` — CLI test automation
  - `docker-compose*.yml` — PMM server and test environment orchestration

---

## How to Contribute
1. **Fork the repository** and create your branch from `v3`.
2. **Install dependencies** using `npm ci` in the root and any subproject you need (`playwright-tests/`, `cli/`).
3. **Follow the code style and patterns** described below.
4. **Test your changes locally** using the recommended script or manual steps.
5. **Lint your code**: Linting is enforced via git hooks. Fix all lint errors before committing.
6. **Open a Pull Request** with a clear description of your changes and reference any related issues.

---

## Code Style & Patterns
- **Tags:** Use tags to group and select tests. Add new tags if needed, and document them in the README.
- **Page Object Pattern:** Encapsulate UI logic in page objects (`tests/PageObjects/`, `tests/pages` , `tests/ia/pages/`).
- **APIs:** Place API automation in (`tests/pages/api`,`tests/ia/pages/api/`, etc).
- **Helpers:** Place helpers or setup logic in (`tests/helper`, etc).
- **Data-Driven Tests:** Use CodeceptJS DataTable or Playwright test annotations for parameterized tests.
- **Naming:**
  - **Acronyms:** Use `HttpUrl` not `HTTPURL` or `getHTTPURL()`. For fields, use `url` or `baseUrl` as appropriate.
  - **Methods:** Use camelCase, name as actions (e.g., `changeSorting`). Use `change` instead of `apply`. Add `Locator` postfix for locator-returning methods.
  - **Assertion methods:** Start with `verify` for readability and searchability.
  - **Test files:** Use camelCase and end with `_test` (e.g., `qanPagination_test.js`).
- **Assertions:** Use clear, explicit assertions. Prefer built-in assertion libraries. Use `I.seeElement`, `I.dontSeeElement`, etc. for CodeceptJS.
- **Locators:**
  - Avoid hardcoded locators in tests; use Page Objects.
  - Prefer stable selectors (e.g., `data-qa` attributes). Use `locate()` > CSS > XPath.
- **Test Data:**
  - Use Data Providers for repeated scenarios with different data. Add a comment explaining why.
  - Declare test variables at the top of the test.
- **Scenario Titles:**
  - Include Test Case ID for traceability (e.g., `{TEST_CASE_ID} Title {annotation}`).
  - Add group/tag annotations at the end of the title (e.g., `@pmm-pre-update`).

---

## Test Organization
- Organize tests by feature and scenario.
- Place shared logic in helpers or page objects.
- Use tags for grouping and selective execution.
- Add new test files in the appropriate directory and update the README if you introduce new tags or workflows.
- One feature per file is preferred for parallelization and maintainability.

---

## Environment & Setup
- Use Docker Compose and scripts in `testdata/` for environment orchestration.
- PMM server is required for most tests; start it locally via Docker Compose.
- For backup management and DB tests, use the setup scripts in `testdata/backup-management/`.
- Use a `.env` file for environment variables (e.g., `PMM_UI_URL`).
- See the main [README.md](README.md) for detailed setup and execution instructions.

---

## Pull Requests
- Ensure your branch is up to date with `v3` branch.
- Run all tests and ensure they pass locally before opening a PR.
- Address all lint errors and warnings.
- Provide a clear, descriptive PR title and body.
- If your change affects test execution or environment setup, update the documentation accordingly.
- Do not update Playwright or MongoDB dependencies without addressing breaking changes and documenting them in the PR.

---

## Reporting Issues
- Use GitHub Issues to report bugs, request features, or suggest improvements.
- Provide as much detail as possible, including steps to reproduce, logs, and environment information.

---

## Feedback
If any section of these guidelines is unclear or missing, please open an issue or PR to help us improve the documentation.

---

Happy testing!
