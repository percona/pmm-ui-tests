const emailDefaultData = {
  type: 'email',
  serverAddress: 'test.server.com:465',
  hello: 'server.com',
  from: 'sender@mail.com',
  authType: 'None',
  username: 'test',
  password: 'test',
};

module.exports = {
  emailDefaults: emailDefaultData,
  communicationData: [
    emailDefaultData, {
      ...emailDefaultData,
      authType: 'Plain',
    }, {
      ...emailDefaultData,
      authType: 'Login',
    }, {
      ...emailDefaultData,
      authType: 'CRAM-MD5',
    }, {
      type: 'slack',
      url: 'https://hook',
    },
  ],
};
