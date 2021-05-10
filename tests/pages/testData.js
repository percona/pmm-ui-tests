module.exports = {
  communicationData: [{
    type: 'email',
    serverAddress: 'test.server.com',
    hello: 'Hey there',
    from: 'sender',
    authType: 'None',
    username: '',
    password: '',
  }, {
    type: 'email',
    serverAddress: 'test.server.com',
    hello: 'Hey there',
    from: 'sender',
    authType: 'Plain',
    username: 'test',
    password: 'test',
  }, {
    type: 'email',
    serverAddress: 'test.server.com',
    hello: 'Hey there',
    from: 'sender',
    authType: 'Login',
    username: 'test',
    password: 'test',
  }, {
    type: 'email',
    serverAddress: 'test.server.com',
    hello: 'Hey there',
    from: 'sender',
    authType: 'CRAM-MD5',
    username: 'test',
    password: 'test',
  }, {
    type: 'slack',
    url: 'https://hook',
  },
  ],
};
