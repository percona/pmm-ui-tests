const assert = require('assert');
const { I } = inject();

module.exports = {
  url: '/graph/alerting/notifications',
  elements: {
  },
  buttons: {
    newContactPoint: locate('button').find('span').withText('New contact point'),
  },
  messages: {
  },
}
