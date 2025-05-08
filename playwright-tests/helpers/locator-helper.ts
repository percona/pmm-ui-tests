export const getOptionLocator = (option: string, exact = true) => (exact
    ? `//div[@data-testid="data-testid Select option" and .="${option}"]`
    : `//div[@data-testid="data-testid Select option" and contains(.,"${option}")]`);