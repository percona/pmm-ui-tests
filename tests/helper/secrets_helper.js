class CustomSecret {
  // eslint-disable-next-line no-useless-constructor,no-empty-function
  constructor(secret) {}

  static sendSecret(sendSecret) {
    return secret(JSON.stringify(sendSecret));
  }
}

module.exports = new CustomSecret();
module.exports.sendSecret = CustomSecret.sendSecret;
