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
    resetAll: '$qan-filters-reset-all',
    showSelected: '$qan-filters-show-selected',
  },
  elements: {
    spinner: locate('$pmm-overlay-wrapper').find('//i[contains(@class,"fa-spinner")]'),
    // tests fail if locate is used
    disabledResetAll: '//button[@data-testid="qan-filters-reset-all" and @disabled ]',
    environmentLabel: '//span[contains(text(), "Environment")]',
    filterName: 'span.checkbox-container__label-text',
  },
  requests: {
    getReportPath: '/v0/qan/GetReport',
    getFiltersPath: '/v0/qan/Filters/Get',
  },

  getFilterSectionLocator: (filterSectionName) => `//span[contains(text(), '${filterSectionName}')]`,

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
    const locator = `//span[contains(text(), '${section}')]/parent::p/following-sibling::div//span[contains(@class, 'checkbox-container__label-text') and contains(text(), '${filter}')]/ancestor::span/following-sibling::span/a`;

    if (visibility) {
      I.waitForElement(locator, 3);
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

  applyFilter(filterName) {
    const filterToApply = `//span[contains(@class, 'checkbox-container__label-text') and contains(text(), '${filterName}')]`;

    I.waitForVisible(this.fields.filterBy, 3);
    I.fillField(this.fields.filterBy, filterName);
    I.waitForVisible(filterToApply, 3);
    I.forceClick(filterToApply);
    I.waitForDetached(this.elements.spinner, 3);
    I.waitForElement(this.fields.filterBy, 3);
    // workaround for clearing the field completely
    I.forceClick(this.fields.filterBy);
    adminPage.customClearField(this.fields.filterBy);
    I.wait(2);
  },

  applyFilterInSection(section, filter) {
    const filterLocator = `//span[contains(text(), '${section}')]/parent::p/following-sibling::div//span[contains(@class, 'checkbox-container__label-text') and contains(text(), '${filter}')]`;

    I.waitForVisible(this.fields.filterBy, 3);
    I.fillField(this.fields.filterBy, filter);
    I.waitForVisible(filterLocator, 3);
    I.click(filterLocator);
  },

  checkFilterExistInSection(section, filter) {
    const filterLocator = `//span[contains(text(), '${section}')]/parent::p/following-sibling::div//span[contains(@class, 'checkbox-container__label-text') and contains(text(), '${filter}')]`;

    I.waitForVisible(this.fields.filterBy, 3);
    I.fillField(this.fields.filterBy, filter);
    I.waitForVisible(filterLocator, 3);
    I.seeElement(filterLocator);
  },

  async verifySectionItemsCount(filterSection, expectedCount) {
    const sectionLocator = `//span[contains(text(), '${filterSection}')]/ancestor::p/following-sibling::`
      + 'div//span[contains(@class, "checkbox-container__checkmark")]';

    I.fillField(this.fields.filterBy, filterSection);
    I.waitForVisible(`//span[contains(text(), '${filterSection}')]`, 3);
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

  applyShowAllLink(groupName) {
    const showAllLink = this.getFilterGroupCountSelector(groupName);

    I.waitForVisible(showAllLink, 3);
    I.forceClick(showAllLink);
  },

  async applyShowTop5Link(groupName) {
    const showTop5Link = `//span[contains(text(), '${groupName}')]/following-sibling::span[contains(text(), 'Show top 5')]`;

    I.waitForVisible(showTop5Link, 3);
    I.click(showTop5Link);
  },

  checkDisabledFilter(groupName, filter) {
    const filterLocator = `//span[contains(text(), '${groupName}')]/parent::p/following-sibling::div[@data-testid='filter-checkbox-${filter}']//input[contains(@name, '${filter}') and @disabled]`;

    I.waitForElement(filterLocator, 3);
  },

  async verifySelectedFilters(filters) {
    I.click(this.buttons.showSelected);
    I.waitForVisible(this.elements.filterName, 3);
    const currentFilters = await I.grabTextFrom(this.elements.filterName);

    for (let i = 0; i <= filters.length - 1; i++) {
      assert.ok(currentFilters[i].includes(filters[i]), `The filter '${filters[i]}' has not been found!`);
    }
  },

  async verifyShortcutAttributes(href, filterValue) {
    const shortCutLocator = locate(`$filter-checkbox-${filterValue}`).find('a');
    const linkText = await I.grabAttributeFrom(shortCutLocator, 'href');
    const target = await I.grabAttributeFrom(shortCutLocator, 'target');

    assert.ok(linkText.includes(href), `The redirection link on QAN Filter section was expected ${href} but the href attribute found was ${linkText}`);
    assert.ok(target === '_blank', `The redirection link on QAN Filter section was expected "_blank" but the href attribute found was ${target}`);
  },
};
