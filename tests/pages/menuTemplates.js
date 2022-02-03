const { I } = inject();

const mouseOverMenu = (locator, elementToWait) => {
  I.moveCursorTo(locator);
  I.waitForVisible(elementToWait, 2);
};

/**
 * The left navigation Grafana menu template. A top level "menu object".
 *
 * @param   name          name of the menu item appears as menu heading
 * @param   path          "expected" url path to be opened on click
 * @param   menuOptions   an object collection of {@link MenuOption} and/or {@link SubMenu}
 * @constructor
 */
function LeftMenu(name, path, menuOptions) {
  this.headingLocator = locate(`ul[aria-label="${name}"]`).find('a').withText(name);
  this.locator = `a[aria-label="${name}"]`;
  this.menu = {
    heading: new MenuOption(name, name, this.headingLocator, path),
  };
  if (menuOptions != null) {
    Object.entries(menuOptions).forEach(([key, value]) => {
      this.menu[key] = value;
    });
  }

  this.showMenu = () => {
    mouseOverMenu(this.locator, this.headingLocator);
  };
  this.click = () => {
    I.click(this.locator);
  };
}

/**
 * Internal menu option template for the left navigation Grafana menu
 * The only repeatable markup part is <li> on each level preceding the target menu option,
 * where the 1st level is top menu and the last is option to click.
 *
 * @param   menuName    required to handle interaction
 * @param   label       name of the option
 * @param   locator     locator to interact with the option
 * @param   path        "expected" url path to be opened on click
 * @param   menuLevel   required to handle interaction, optional for the top level
 * @constructor
 */
function MenuOption(menuName, label, locator, path, menuLevel = 1) {
  this.label = label;
  this.locator = locator;
  this.path = path;
  this.click = () => {
    new LeftMenu(menuName, '').showMenu();
    /* top level menu options text is nested <div> and should be excluded from loop */
    for (let i = 2; i <= menuLevel; i++) {
      this.locator = `(//li[descendant::a[contains(text(), "${label}")]])`;
      I.moveCursorTo(`${this.locator}[position()=${i}]`);
    }

    /* top level menu options are handled without loop and locator from the argument */
    I.waitForVisible(this.locator === locator ? locator : `${this.locator}[last()]`, 2);
    I.click(this.locator === locator ? locator : `${this.locator}[last()]`);
  };
}

/**
 * Encapsulates constant locator of {@link MenuOption} for the left navigation Grafana menu.
 * Just to keep constructor simple.
 *
 * @param   menuName    required to handle interaction
 * @param   label       name of the option
 * @param   path        "expected" url path to be opened on click
 * @param   menuLevel   required to handle interaction, optional for the top level
 * @returns             {MenuOption} instance
 */
const menuOption = (menuName, label, path, menuLevel = 1) => {
  return new MenuOption(menuName, label, locate('a').withDescendant(locate('div').withText(label)).inside('ul'), path, menuLevel);
};

/**
 * A sub level "menu object" of the Grafana menu. Should used in the {@link LeftMenu}
 *
 * @param   topMenuName    name of the top level menu
 * @param   name          name of the menu item appears as menu heading
 * @param   path          "expected" url path to be opened on click; '#' is non-clickable sub menu
 * @param   menuOptions   an object collection of {@link MenuOption} and/or {@link SubMenu}
 * @constructor
 */
function SubMenu(topMenuName, name, path, menuOptions) {
  this.menu = { };
  if (menuOptions != null) {
    Object.entries(menuOptions).forEach(([key, value]) => {
      this.menu[key] = value;
    });
  }

  if (path !== '#') {
    this.click = () => {
      menuOption(topMenuName, name, path).click();
    };
  }
}

module.exports = {
  LeftMenu, SubMenu, menuOption,
};
