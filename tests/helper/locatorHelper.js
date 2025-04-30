const getOptionLocator = (option, exact = true) => (exact
  ? `//div[@data-testid="data-testid Select option" and .="${option}"]`
  : `//div[@data-testid="data-testid Select option" and contains(.,"${option}")]`);

const locateOption = (option) => locate(getOptionLocator(option));

module.exports = {
  getOptionLocator,
  locateOption,
};
