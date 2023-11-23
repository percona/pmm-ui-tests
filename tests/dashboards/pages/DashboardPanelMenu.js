const { I } = inject();

/**
 * Represents Menu of any Panel on the Dashboard (in edit mode).
 * Menu shows and hides by clicking on the Panel title
 * example call: dashboardPage.panelMenu('Custom Panel').showMenu().more().createLibraryPanel();
 */
function DashboardPanelMenu(title) {
  this.titleLocator = `header[data-testid$="${title}"]`;
  // header[@data-testid="data-testid Panel header Panel Title"]/.//div[@class="panel-menu-container dropdown open"]/ul
  this.menuLocator = `header[data-testid$="${title}"] div.open > ul`;

  const menuItemLocator = (itemTitle) => locate(this.menuLocator).find(`span[aria-label$="${itemTitle}"]`);

  const subMenuItemLocator = (itemTitle) => `li > a > span[aria-label$="${itemTitle}"]`;

  this.showMenu = () => {
    I.click(this.titleLocator);
    I.waitForVisible(this.menuLocator, 2);

    return this;
  };

  this.view = () => {
    I.click(menuItemLocator('View'));

    return this;
  };

  this.edit = () => {
    I.click(menuItemLocator('Edit'));

    return this;
  };

  this.share = () => {
    I.click(menuItemLocator('Share'));

    return this;
  };

  this.explore = () => {
    I.click(menuItemLocator('Explore'));

    return this;
  };

  this.inspect = () => {
    I.moveCursorTo(menuItemLocator('Inspect'));
    I.waitForVisible(subMenuItemLocator('Data'), 2);

    return {
      data() {
        I.click(subMenuItemLocator('Data'));
      },
      query() {
        I.click(subMenuItemLocator('Query'));
      },
      panelJson() {
        I.click(subMenuItemLocator('Panel JSON'));
      },
    };
  };

  this.more = () => {
    I.moveCursorTo(menuItemLocator('More...'));
    I.waitForVisible(subMenuItemLocator('Duplicate'), 2);

    return {
      duplicate() {
        I.click(subMenuItemLocator('Duplicate'));
      },
      copy() {
        I.click(subMenuItemLocator('Copy'));
      },
      createLibraryPanel() {
        I.click(subMenuItemLocator('Create library panel'));
      },
      hideLegend() {
        I.click(subMenuItemLocator('Hide legend'));
      },
      getHelp() {
        I.click(subMenuItemLocator('Get help'));
      },
    };
  };

  this.remove = () => {
    I.click(menuItemLocator('Remove'));

    return this;
  };
}

module.exports = { DashboardPanelMenu };
