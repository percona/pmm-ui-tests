const getOptionLocator = (option, exact = true) => (exact
  ? `//div[@data-testid="data-testid Select option"]//*[text()="${option}"]`
  : `//div[@data-testid="data-testid Select option"]//*[contains(text(), "${option}")]`);

const locateOption = (option) => locate(getOptionLocator(option));

module.exports = {
  getOptionLocator,
  locateOption,
};
