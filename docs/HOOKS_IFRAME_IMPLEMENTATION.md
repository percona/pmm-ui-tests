# Hooks.js: Grafana Iframe Handling Implementation

## Overview

The `hooks.js` file provides a bootstrap hook that automatically handles Grafana iframe context switching in PMM UI tests. This implementation eliminates the need to manually switch to the iframe context in every test locator, significantly reducing code complexity and maintenance overhead.

## The Problem

PMM's new UI architecture embeds Grafana within an iframe (`#grafana-iframe`). Without automated handling, every test interaction with Grafana elements would require:

1. Manually switching to the main page context
2. Waiting for the iframe to be visible
3. Switching into the iframe context
4. Performing the action
5. Switching back to the main context

**Example without hooks:**
```javascript
// Manual iframe handling (before hooks.js)
await I.switchTo();
await I.waitForVisible('#grafana-iframe', 60);
await I.switchTo('#grafana-iframe');
await I.click('.some-element');
await I.switchTo(); // switch back
```

This pattern would need to be repeated hundreds of times across the test suite, making tests verbose, error-prone, and difficult to maintain.

## The Solution: Bootstrap Hook

The `hooks.js` file is registered as a **bootstrap hook** in the CodeceptJS configuration (`pr.codecept.js`):

```javascript
const bootstrapHook = require('./tests/helper/hooks.js');

exports.config = {
  // ... other config
  bootstrap: bootstrapHook,
  // ...
}
```

Bootstrap hooks run once when CodeceptJS initializes, before any tests execute. This allows `hooks.js` to intercept and wrap helper methods globally.

## How It Works

### 1. Method Interception

The hook uses CodeceptJS's `container` to access the Playwright helper and wraps its methods:

```javascript
const helper = container.helpers('Playwright');
```

### 2. Navigation Method Override

Navigation methods (`amOnPage`, `refreshPage`, `openNewTab`, etc.) are wrapped to automatically:
- Reset the iframe context before navigation
- Execute the original navigation
- Switch to the Grafana iframe after navigation (except for specific URLs like login, help, updates)

**Code:**
```javascript
navigationMethods.forEach((methodName) => {
  applyOverride(helper, methodName, async function (original, ...args) {
    await resetContext(helper);
    await original.apply(this, args);
    
    // Skip iframe switch for certain URLs
    if (methodName === 'amOnPage' && noIframeUrls.some((url) => args[0].includes(url))) return;
    if (noIframeMethods.includes(methodName)) return;
    
    await switchToGrafana(helper);
  });
});
```

### 3. Context-Aware Method Overrides

Methods that interact with elements are wrapped to use the iframe context when available:

```javascript
applyContextOverride(helper, 'grabTextFrom', async (locator) => 
  helper.context.locator(getSelector(locator)).first().textContent()
);
```

When `helper.context` is set (iframe mode), these methods use Playwright's `frameLocator` API. Otherwise, they fall back to the original implementation.

### 4. Smart Selector Processing

The `getSelector()` function normalizes various locator formats:
- XPath: `{xpath: '//div'}` → `xpath=//div`
- CSS: `{css: '.class'}` → `.class`
- Data-testid shorthand: `$elementId` → `[data-testid="elementId"]`

This ensures locators work consistently whether passed as strings, objects, or special formats.

### 5. Automatic Context Reset

Event listeners ensure the context is reset before and after each test:

```javascript
event.dispatcher.on(event.test.before, resetContext.bind(null, helper));
event.dispatcher.on(event.test.after, resetContext.bind(null, helper));
```

## Benefits: The Shortcut Impact

### Code Reduction
- **Without hooks**: ~5-10 lines of iframe handling per interaction
- **With hooks**: 0 lines - completely transparent

For a test suite with ~1000+ element interactions, this eliminates **5,000-10,000 lines** of boilerplate code.

### Example Comparison

**Before hooks.js:**
```javascript
// filters_test.js - Manual iframe handling
await I.switchTo();
await I.waitForVisible('#grafana-iframe', 60);
await I.switchTo('#grafana-iframe');
await within(queryAnalyticsPage.data.root, () => {
  I.waitForText('No queries available for this combination of filters', 30);
});
await I.switchTo();
```

**After hooks.js:**
```javascript
// filters_test.js - Automatic iframe handling
I.waitForText('No queries available for this combination of filters', 30);
```

**Reduction**: 5 lines → 1 line (80% reduction)

### dashboardPage.js Example

**Before hooks.js:**
```javascript
await I.usePlaywrightTo('expanding collapsed rows', async ({ page }) => {
  const getCollapsedRowsLocators = async () => 
    await page.locator(this.fields.collapsedDashboardRow).all();
  let collapsedRowsLocators = await getCollapsedRowsLocators();

  while (collapsedRowsLocators.length > 0) {
    await page.keyboard.press('End');
    await collapsedRowsLocators[0].scrollIntoViewIfNeeded();
    await collapsedRowsLocators[0].click();
    collapsedRowsLocators.shift();
    collapsedRowsLocators = await getCollapsedRowsLocators();
  }
});
```

**After hooks.js:**
```javascript
let collapsedRows = await I.grabNumberOfVisibleElements(this.fields.collapsedDashboardRow);
let maxTries = 20;

while (collapsedRows > 0 && maxTries > 0) {
  I.pressKey('End');
  I.click(locate(this.fields.collapsedDashboardRow).first());
  I.wait(1);
  collapsedRows = await I.grabNumberOfVisibleElements(this.fields.collapsedDashboardRow);
  maxTries--;
}
```

**Reduction**: Complex Playwright-specific code → Simple, readable CodeceptJS syntax

## Maintenance Benefits

1. **Single point of control**: Iframe logic lives in one file
2. **Consistent behavior**: All tests handle iframes the same way
3. **Easy updates**: Changes to iframe handling require updating only `hooks.js`
4. **Reduced bugs**: Eliminates repetitive manual context switching errors
5. **Better readability**: Tests focus on business logic, not infrastructure

## Supported Methods

The following CodeceptJS methods are enhanced with automatic iframe context handling:

- **Navigation**: `amOnPage`, `refreshPage`, `openNewTab`, `switchToNextTab`, `switchToPreviousTab`
- **Interaction**: `pressKey`, `moveCursorTo`
- **Data retrieval**: `grabTextFrom`, `grabTextFromAll`
- **Waiting**: `waitForText`, `waitForDetached`, `waitForValue`
- **Advanced**: `usePlaywrightTo` (with context awareness)

## Special Cases

- **Login/Help/Updates pages**: Iframe switching is skipped for these URLs as they don't use Grafana
- **New tabs**: Iframe switching is skipped when opening new tabs
- **Keyboard actions**: Enhanced to work within iframe contexts using Playwright's keyboard API

## Conclusion

The `hooks.js` implementation represents a **massive shortcut** that:
- Eliminates thousands of lines of boilerplate code
- Makes tests more readable and maintainable
- Reduces the likelihood of context-switching bugs
- Provides a centralized, consistent approach to iframe handling

Instead of every developer needing to understand and implement iframe context switching in every test, the bootstrap hook handles it transparently, allowing tests to be written as if the iframe didn't exist.
