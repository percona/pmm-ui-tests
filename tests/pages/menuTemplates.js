const { I } = inject();

const mouseOverMenu = (menuObj) => {
  I.moveCursorTo(menuObj.locator);
  I.waitForVisible(menuObj.menu.heading.locator, 2);
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
  this.name = name;
  this.path = path;
  this.headingLocator = locate('a[class="side-menu-header-link"]').withText(name);
  this.locator = locate('a[class="sidemenu-link"]')
    .before(locate('ul[role="menu"]').withDescendant(this.headingLocator));
  this.menu = {
    heading: new MenuOption(this.name, this.headingLocator, this.path),
  };
  if (menuOptions != null) {
    Object.entries(menuOptions).forEach(([key, value]) => {
      this.menu[key] = value;
    });
  }

  this.showMenu = () => {
    mouseOverMenu(this);
  };
  this.click = () => {
    I.click(this.locator);
  };
}

/**
 * Internal menu option template for the left navigation Grafana menu
 *
 * @param   label       name of the option
 * @param   locator     locator to interact with the option
 * @param   path        "expected" url path to be opened on click
 * @param   menuLevel   required to handle interaction, optional for the top level
 * @constructor
 */
function MenuOption(label, locator, path, menuLevel = 1) {
  this.label = label;
  this.locator = locator;
  this.path = path;
  this.click = () => {
    I.moveCursorTo(locate('div[class="sidemenu-item dropdown"]').withDescendant(locate(this.locator)));
    for (let i = 1; i < menuLevel; i++) {
      I.moveCursorTo(locate('li').withChild('ul').withDescendant(locate(this.locator)).at(i));
    }

    I.waitForVisible(this.locator, 2);
    I.click(this.locator);
  };
}

/**
 * Encapsulates constant locator of {@link MenuOption} for the left navigation Grafana menu.
 * Just to keep constructor simple.
 *
 * @param   label       name of the option
 * @param   path        "expected" url path to be opened on click
 * @param   menuLevel   required to handle interaction, optional for the top level
 * @returns             {MenuOption} instance
 */
const menuOption = (label, path, menuLevel = 1) => {
  return new MenuOption(label, locate('a').withText(label).inside('ul'), path, menuLevel);
};

/**
 * A sub level "menu object" of the Grafana menu. Should used in the {@link LeftMenu}
 *
 * @param   name          name of the menu item appears as menu heading
 * @param   path          "expected" url path to be opened on click; '#' is non-clickable sub menu
 * @param   menuOptions   an object collection of {@link MenuOption} and/or {@link SubMenu}
 * @constructor
 */
function SubMenu(name, path = '#', menuOptions) {
  this.name = name;
  this.path = path;
  this.headingLocator = locate('a[class="side-menu-header-link"]').withText(name);
  this.locator = locate('a[class="sidemenu-link"]')
    .before(locate('ul[role="menu"]').withDescendant(this.headingLocator));
  this.menu = { };
  if (menuOptions != null) {
    Object.entries(menuOptions).forEach(([key, value]) => {
      this.menu[key] = value;
    });
  }

  if (path !== '#') {
    this.click = () => {
      I.moveCursorTo(locate('div[class="sidemenu-item dropdown"]').withDescendant(locate(this.locator)));
      I.waitForVisible(this.locator, 2);
      I.click(this.locator);
    };
  }
}

module.exports = { LeftMenu, SubMenu, menuOption };
