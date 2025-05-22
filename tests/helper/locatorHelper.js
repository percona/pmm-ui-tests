const locateOption = (option) => locate('[data-testid="data-testid Select option"]').withText(option);

module.exports = {
  locateOption,
};
