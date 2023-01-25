const apiHelper = {
  confirmTour: async (page) => {
    await page.route('**/v1/user', (route) => route.fulfill({
      status: 200,
      body: JSON.stringify({
        user_id: 1,
        product_tour_completed: true,
        alerting_tour_completed: true,
      }),
    }));
  },
};

export default apiHelper;
