const getOptionLocator = (option, exact = true) => locate('[data-testid="data-testid Select option"]').withText(option);

const locateOption = (option) => locate('[data-testid="data-testid Select option"]').withText(option);

module.exports = {
  getOptionLocator,
  locateOption,
};
