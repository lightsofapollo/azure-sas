var crypto = require('crypto');

/**
Azure verifies much of what we send it by checking the input vs a signed version of the input.

The value is signed with a sha256 algorithm and the key is the base64 decoded value of access key.
*/
function sign(accessKey, value) {
  // start by decoding the access key
  var decodedKey = new Buffer(accessKey, 'base64');

  // encrypt the value and encode it with base64
  return crypto.createHmac('sha256', decodedKey).update(value).digest('base64');
}


module.exports = sign;
