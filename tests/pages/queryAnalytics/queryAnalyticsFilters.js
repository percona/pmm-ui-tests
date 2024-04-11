const assert = require('assert');

const { I } = inject();

class QueryAnalyticsFilters {
  constructor() {
    this.fields = {
      filterBy: locate('//input[@data-testid="filters-search-field"]'),
      filterCheckboxes: locate('//div[contains(@data-testid, "filter-checkbox")]'),
      filterCheckBoxesInGroup: (groupName) => this.fields.filterGroup(groupName).find('//div[contains(@data-testid, "filter-checkbox")]'),
      filterGroup: (groupName) => locate(`//span[@data-testid="checkbox-group-header" and text()="${groupName}"]/parent::p/parent::div`),
      filterByExactName: (filterName) => locate(`//div[@data-testid="filter-checkbox-${filterName}"]`),
      filterByName: (filterName) => locate(`//div[contains(@data-testid, "filter-checkbox-${filterName}")]`),
      filterByNameAndGroup: (filterName, groupName) => this.fields.filterGroup(groupName).find(`//div[@data-testid="filter-checkbox-${filterName}"]`),
      filterPercentageByNameAndGroup: (filterName, groupName) => this.fields.filterByNameAndGroup(filterName, groupName).find('//span').at(3),
      filterName: locate('//span[@class="checkbox-container__label-text"]'),
      checkedFilters: () => this.fields.filterCheckboxes.find('//input[@type="checkbox" and @checked]//following-sibling::span[@class="checkbox-container__label-text"]'),
      filterHeaders: locate('//span[@data-testid="checkbox-group-header"]'),
    };
    this.buttons = {
      showSelected: locate('$qan-filters-show-selected'),
      resetAll: locate('$qan-filters-reset-all'),
    };
    this.labels = {
      filterGroups: [
        'Environment',
        'Cluster',
        'Replication Set',
        'Database',
        'Node Name',
        'Service Name',
        'User Name',
        'Node Type',
        'Service Type',
        'Command Type',
      ],
    };
  }

  async getFilterPercentage(filterName, groupName) {
    return this.fields.filterPercentageByNameAndGroup(filterName, groupName);
  }

  filterBy(filterName) {
    I.fillField(this.fields.filterBy, filterName);
  }

  selectFilter(filterName) {
    I.usePlaywrightTo('Select QAN Filter', async ({ page }) => {
      const locator = await page.locator(this.fields.filterByExactName(filterName).value);

      await locator.waitFor({ state: 'attached' });
      await locator.click();
    });
  }

  selectFilterInGroup(filterName, groupName) {
    I.usePlaywrightTo('Select QAN Filter', async ({ page }) => {
      const locator = await page.locator(this.fields.filterByNameAndGroup(filterName, groupName).value);

      await locator.waitFor({ state: 'attached' });
      await locator.click();
    });
  }

  selectFilterInGroupAtPosition(groupName, position) {
    I.usePlaywrightTo('Select QAN Filter', async ({ page }) => {
      const locator = await page.locator(this.fields.filterCheckBoxesInGroup(groupName).value);

      await locator.nth(position - 1).waitFor({ state: 'attached' });
      await locator.nth(position - 1).click();
    });
  }

  selectContainFilter(filterName) {
    I.usePlaywrightTo('Select QAN Filter', async ({ page }) => {
      const locator = await page.locator(this.fields.filterByName(filterName).value);

      await locator.waitFor({ state: 'attached' });
      await locator.click();
    });
  }

  async verifySelectedFilters(filters) {
    I.click(this.buttons.showSelected);
    I.waitForVisible(this.fields.filterName, 20);
    const currentFilters = await I.grabTextFrom(this.fields.filterName);

    for (let i = 0; i <= filters.length - 1; i++) {
      assert.ok(currentFilters[i].includes(filters[i]), `The filter '${filters[i]}' has not been found!`);
    }
  }

  async verifyCountOfFiltersDisplayed(expectedCount, expectedResult, timeoutInSeconds = 10) {
    let count = 0;

    for (let i = 0; i < timeoutInSeconds; i++) {
      count = await I.grabNumberOfVisibleElements(this.fields.filterCheckboxes);

      switch (expectedResult) {
        case 'smaller':
          if (count < expectedCount) return;

          break;
        case 'equals':
          if (count === expectedCount) return;

          break;
        case 'bigger':
          if (count > expectedCount) return;

          break;
        default:
          throw new Error(`Expected Result: "${expectedResult}" is not supported.`);
      }
      I.wait(1);
    }

    throw new Error(`Real value: ${count} is not ${expectedResult} then/to: ${expectedCount}`);
  }

  showSelectedFilters() {
    I.usePlaywrightTo('click', async ({ page }) => {
      const locator = await page.locator(this.buttons.showSelected.value);

      await locator.waitFor({ state: 'attached' });
      await locator.click();
    });
  }

  async verifyCheckedFilters(expectedFilters) {
    const checkedFilters = await I.grabTextFromAll(this.fields.checkedFilters());
    const notCheckedFilters = [];

    for (const expectedFilter of expectedFilters) {
      if (!checkedFilters.includes(expectedFilter)) {
        notCheckedFilters.push(expectedFilter);
      }
    }

    assert.ok(notCheckedFilters.length === 0, `Expected filters "${expectedFilters}" are not euqal to checked filters: "${checkedFilters}. `);
  }
}

module.exports = new QueryAnalyticsFilters();
module.exports.QueryAnalyticsFilters = QueryAnalyticsFilters;
