class LocalStorage extends Helper {
  // eslint-disable-next-line no-underscore-dangle
  async _before() {
    const { page } = this.helpers.Playwright;

    // TODO replace with better test to the tour
    await page.addInitScript(() => {
      // Hide modal to prompt users (10) to migrate to v3
      for (let i = 0; i < 10; i++) {
        window.localStorage.setItem(`${i + 1}-grafana.pmm3.modalShown`, false);
      }

      if (window.localStorage.getItem('percona.tourTest') === true) {
        window.localStorage.removeItem('percona.showTour');
      } else {
        window.localStorage.setItem('percona.showTour', false);
      }
    });
  }
}

module.exports = LocalStorage;
