class ApiHelper extends Helper {
  // eslint-disable-next-line no-underscore-dangle
  async _before() {
    const { page } = this.helpers.Playwright;

    // mock user details call to prevent the product tour from showing
    await page.route('**/v1/user', (route) => route.fulfill({
      status: 200,
      body: JSON.stringify({
        user_id: 1,
        product_tour_completed: true,
      }),
    }));
  }
}

module.exports = ApiHelper;
