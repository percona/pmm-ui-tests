const emailDefaults = {
  type: 'email',
  serverAddress: 'test.server.com',
  hello: 'Hey there',
  from: 'sender@mail.com',
  authType: 'None',
  username: 'test',
  password: 'test',
};

module.exports = {
  communicationData: [
    emailDefaults, {
      ...emailDefaults,
      authType: 'Plain',
    }, {
      ...emailDefaults,
      authType: 'Login',
    }, {
      ...emailDefaults,
      authType: 'CRAM-MD5',
    }, {
      type: 'slack',
      url: 'https://hook',
    },
  ],
};
