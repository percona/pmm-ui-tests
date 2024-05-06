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
    filterByValues: (filterValue) => locate(`//div[contains(@data-testid, "filter-checkbox-${filterValue}")]`),
    filterValuesByFilterName: (filterName) => locate(`//span[@data-testid="checkbox-group-header" and text()="${filterName}"]/parent::p/parent::div//div[contains(@data-testid, "filter-checkbox")]`),
    filterHeaders: locate(I.useDataQA('checkbox-group-header')),
    filterValues: locate('//span[@data-testid="checkbox-group-header"]/parent::p/parent::div//div[contains(@data-testid, "filter-checkbox")]'),
  },
  requests: {
    getReportPath: '/v0/qan/GetReport',
    getFiltersPath: '/v0/qan/Filters/Get',
  },

  getFilterSectionLocator: (section) => `//div[./p/span[@data-testid="checkbox-group-header" and contains(text(), "${section}")]]`,

  getFilterGroupCountSelector: (groupName) => `//span[contains(text(), '${groupName}')]/following-sibling::span[contains(text(), 'Show all')]`,

  getFilterLocator: (filterValue) => `//span[@class="checkbox-container__label-text" and contains(text(), "${filterValue}")]`
    + '/../span[@class="checkbox-container__checkmark"]',

  checkLink(section, filter, visibility) {
    const dashboardLink = locate(`$filter-checkbox-${filter}`).find('a');
    const locator = locate(dashboardLink).inside(this.getFilterSectionLocator(section));

    if (visibility) {
      I.waitForElement(locator, 30);
    } else {
      I.dontSeeElement(locator);
    }
  },

  async waitForFiltersToLoad() {
    await I.waitForDetached(this.elements.spinner, 60);
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
