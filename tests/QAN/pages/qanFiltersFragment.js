const assert = require('assert');

const { I, adminPage } = inject();

module.exports = {
  root: '.overview-filters',
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
  fields: {
    filterBy: '$filters-search-field',
    filterCheckboxes: '.checkbox-container__checkmark',
  },
  buttons: {
    refresh: I.useDataQA('data-testid RefreshPicker run button'),
    resetAll: '$qan-filters-reset-all',
    showSelected: locate('$qan-filters-show-selected'),
  },
  elements: {
    spinner: locate('$pmm-overlay-wrapper').find('//i[contains(@class,"fa-spinner")]'),
    // tests fail if locate is used
    disabledResetAll: '//button[@data-testid="qan-filters-reset-all" and @disabled ]',
    environmentLabel: '//span[contains(text(), "Environment")]',
    filterItem: (section, filter) => `//span[contains(text(), '${section}')]/parent::p/following-sibling::div//span[contains(@class, 'checkbox-container__label-text') and contains(text(), '${filter}')]`,
    filterName: 'span.checkbox-container__label-text',
    filterByExactValue: (filterValue) => locate(`//div[@data-testid="filter-checkbox-${filterValue}"]`),
    filterByValues: (filterValue) => locate(`//div[contains(@data-testid, "filter-checkbox-${filterValue}")]`),
    filterValuesByFilterName: (filterName) => locate(`//span[@data-testid="checkbox-group-header" and text()="${filterName}"]/parent::p/parent::div//div[contains(@data-testid, "filter-checkbox")]`),
    filterHeaders: locate('//span[@data-testid="checkbox-group-header"]'),
    filterValues: locate('//span[@data-testid="checkbox-group-header"]/parent::p/parent::div//div[contains(@data-testid, "filter-checkbox")]'),
  },
  requests: {
    getReportPath: '/v0/qan/GetReport',
    getFiltersPath: '/v0/qan/Filters/Get',
  },

  getFilterSectionLocator: (section) => `//div[./p/span[@data-testid="checkbox-group-header" and contains(text(), "${section}")]]`,

  getFilterGroupLocator: (filterName) => `//div[@class='filter-group__title']//span[contains(text(), '${filterName}')]`,

  getFilterGroupCountSelector: (groupName) => `//span[contains(text(), '${groupName}')]/following-sibling::span[contains(text(), 'Show all')]`,

  getFilterLocator: (filterValue) => `//span[@class="checkbox-container__label-text" and contains(text(), "${filterValue}")]`
    + '/../span[@class="checkbox-container__checkmark"]',

  async getPercentage(filterType, filter) {
    return await I.grabTextFrom(
      `//span[contains(text(), '${filterType}')]/../../descendant::span[contains(text(), '${filter}')]/../../following-sibling::span/span`,
    );
  },

  checkLink(section, filter, visibility) {
    const dashboardLink = locate(`$filter-checkbox-${filter}`).find('a');
    const locator = locate(dashboardLink).inside(this.getFilterSectionLocator(section));

    if (visibility) {
      I.waitForElement(locator, 30);
    } else {
      I.dontSeeElement(locator);
    }
  },

  async getCountOfFilters(groupName) {
    const showAllLink = this.getFilterGroupCountSelector(groupName);

    return (await I.grabTextFrom(showAllLink)).slice(10, 12);
  },

  waitForFiltersToLoad() {
    I.waitForDetached(this.elements.spinner, 60);
  },

  async waitForFilterVisible(filterName, timeout) {
    await I.asyncWaitFor(async () => {
      I.click(this.buttons.refresh);

      return I.seeElement(this.elements.filterItem('Service Name', filterName));
    }, timeout);
  },

  async expandAllFilters() {
    for (let i = 0; i < 4; i++) {
      const numOfElementsFilterCount = await I.grabNumberOfVisibleElements(
        this.getFilterGroupCountSelector(this.filterGroups[i]),
      );

      if (numOfElementsFilterCount === '1') {
        I.click(this.getFilterGroupCountSelector(this.filterGroups[i]));
        I.waitForVisible(
          `//section[@class='aside__filter-group']//span[contains(text(), '${this.filterGroups[i]}')]/../button[contains(text(), 'Show top 5')]`,
          30,
        );
      }
    }
  },

  async clickFilter(filterName) {
    await I.usePlaywrightTo('click', async ({ page }) => {
      const locator = await page.locator(this.elements.filterByExactValue(filterName).value);

      await locator.waitFor({ state: 'attached' });
      await locator.click();
    });
  },

  async showSelectedFilters() {
    await I.usePlaywrightTo('click', async ({ page }) => {
      const locator = await page.locator(this.buttons.showSelected.value);

      await locator.waitFor({ state: 'attached' });
      await locator.click();
    });
  },

  async selectFilter(filterName) {
    const filterToApply = `//span[contains(@class, 'checkbox-container__label-text') and contains(text(), '${filterName}')]`;
    const filterItemCheckbox = locate('span').before(filterToApply);

    I.waitForVisible(this.fields.filterBy, 30);
    I.fillField(this.fields.filterBy, filterName);
    I.waitForElement(filterToApply);
  },

  async applyFilter(filterName) {
    const filterToApply = `//span[contains(@class, 'checkbox-container__label-text') and contains(text(), '${filterName}')]`;
    const filterItemCheckbox = locate('span').before(filterToApply);

    I.waitForVisible(this.fields.filterBy, 30);
    I.fillField(this.fields.filterBy, filterName);
    I.waitForElement(filterToApply);
    I.forceClick(filterToApply);
    I.waitForEnabled(filterItemCheckbox);
    I.waitForDetached(this.elements.spinner, 30);
    I.waitForElement(this.fields.filterBy, 30);
    // workaround for clearing the field completely
    I.forceClick(this.fields.filterBy);
    adminPage.customClearField(this.fields.filterBy);
    I.wait(2);
  },

  applySpecificFilter(filterName) {
    const filterToApply = `//span[contains(@class, 'checkbox-container__label-text') and text()='${filterName}']`;

    I.waitForVisible(this.fields.filterBy, 30);
    I.fillField(this.fields.filterBy, filterName);
    I.waitForVisible(filterToApply, 20);
    I.forceClick(filterToApply);
    I.waitForDetached(this.elements.spinner, 30);
    I.waitForElement(this.fields.filterBy, 30);
    // workaround for clearing the field completely
    I.forceClick(this.fields.filterBy);
    adminPage.customClearField(this.fields.filterBy);
    I.wait(2);
  },
  applyFilterInSection(section, filter) {
    const filterLocator = `//span[contains(text(), '${section}')]/parent::p/following-sibling::div//span[contains(@class, 'checkbox-container__label-text') and contains(text(), '${filter}')]`;

    I.waitForVisible(this.fields.filterBy, 30);
    I.fillField(this.fields.filterBy, filter);
    I.waitForVisible(filterLocator, 20);
    I.click(filterLocator);
  },

  checkFilterExistInSection(section, filter) {
    const filterLocator = `//span[contains(text(), '${section}')]/parent::p/following-sibling::div//span[contains(@class, 'checkbox-container__label-text') and contains(text(), '${filter}')]`;

    I.waitForVisible(this.fields.filterBy, 30);
    I.fillField(this.fields.filterBy, filter);
    I.waitForVisible(filterLocator, 20);
    I.seeElement(filterLocator);
  },

  async verifySectionItemsCount(filterSection, expectedCount) {
    const sectionLocator = `//span[contains(text(), '${filterSection}')]/ancestor::p/following-sibling::`
      + 'div//span[contains(@class, "checkbox-container__checkmark")]';

    I.fillField(this.fields.filterBy, filterSection);
    I.waitForVisible(`//span[contains(text(), '${filterSection}')]`, 30);
    const countOfFiltersInSection = await I.grabNumberOfVisibleElements(sectionLocator);

    assert.equal(countOfFiltersInSection, expectedCount, `There should be '${expectedCount}' visible links`);
  },

  async verifyCountOfFilterLinks(expectedCount, before) {
    const count = await I.grabNumberOfVisibleElements(this.fields.filterCheckboxes);

    if (!before) {
      assert.ok(count >= expectedCount, `The value ${count} should be same or bigger than ${expectedCount}`);
    }

    if (before) {
      assert.ok(count !== expectedCount, `The value: ${count} different than: ${expectedCount}`);
    }
  },

  // Expected Result can be smaller, equals, bigger
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
      await I.wait(1);
    }

    throw new Error(`Real value: ${count} is not ${expectedResult} then/to: ${expectedCount}`);
  },

  applyShowAllLink(groupName) {
    const showAllLink = this.getFilterGroupCountSelector(groupName);

    I.waitForVisible(showAllLink, 30);
    I.forceClick(showAllLink);
  },

  async applyShowAllLinkIfItIsVisible(groupName) {
    const showAllLink = this.getFilterGroupCountSelector(groupName);
    const numOfShowAllLinkSectionCount = await I.grabNumberOfVisibleElements(showAllLink);

    if (numOfShowAllLinkSectionCount) {
      this.applyShowAllLink(groupName);
    }
  },

  checkDisabledFilter(groupName, filter) {
    const filterLocator = `//span[contains(text(), '${groupName}')]/parent::p/following-sibling::div[@data-testid='filter-checkbox-${filter}']//input[contains(@name, '${filter}') and @disabled]`;

    I.waitForElement(filterLocator, 20);
  },

  async verifySelectedFilters(filters) {
    I.click(this.buttons.showSelected);
    I.waitForVisible(this.elements.filterName, 20);
    const currentFilters = await I.grabTextFrom(this.elements.filterName);

    for (let i = 0; i <= filters.length - 1; i++) {
      assert.ok(currentFilters[i].includes(filters[i]), `The filter '${filters[i]}' has not been found!`);
    }
  },

  async verifyShortcutAttributes(href, filterValue, timeRangeValue) {
    let shortCutLocator = locate(`$filter-checkbox-${filterValue}`).find('a');

    if (filterValue === 'mongodb_rs1_2') {
      shortCutLocator = '//div[contains(@data-testid, "filter-checkbox-mongodb_rs1_2")]//a';
    }

    await I.waitForVisible(shortCutLocator, 20);
    const linkText = await I.grabAttributeFrom(shortCutLocator, 'href');
    const target = await I.grabAttributeFrom(shortCutLocator, 'target');

    assert.ok(linkText.includes(timeRangeValue), `The redirection link from QAN Filter section was expected to have selected Time range ${href} but the href attribute found was ${linkText}`);
    assert.ok(linkText.includes(href), `The redirection link on QAN Filter section was expected ${href} but the href attribute found was ${linkText}`);
    assert.ok(target === '_blank', `The redirection link on QAN Filter section was expected "_blank" but the href attribute found was ${target}`);
  },
};
