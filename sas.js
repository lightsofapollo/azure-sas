/**
Shared access signatures based on this document:

http://msdn.microsoft.com/en-us/library/windowsazure/dn140256.aspx
*/
var crypto = require('crypto');
var assert = require('assert');
var util = require('util');

var OPTION_TO_QUERY_PARAM = {
  signedversion: 'sv',
  signedresource: 'sr',
  tablename: 'tn',
  signedstart: 'st',
  signedexpiry: 'se',
  signedpermissions: 'sp',
  signedidentifier: 'si',
  cachecontrol: 'rscc',
  contentdisposition: 'rscd',
  contentencoding: 'rsce',
  contentlanguage: 'rscl',
  contenttype: 'rsct',
  startpk: 'startpk',
  startrk: 'startrk',
  endpk: 'endpk',
  endrk: 'endrk'
};

var DEFAULT_OPTIONS = {
  signedversion: '2013-08-15',
  signedpermissions: 'r',
  accesskey: process.env.AZURE_STORAGE_ACCESS_KEY,
  account: process.env.AZURE_STORAGE_ACCOUNT
};

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

function newlineValue(value) {
  // intentional use of == null (null or undefined value)
  if (value == null) return '\n';
  return value + '\n';
}

/**
Build the query parameters from the options based on the OPTION_TO_QUERY_PARAM map.  
@param {Object} options from service.
@return {Object} suitable for use as query parameters.
*/
function buildQueryParams(options) {
  var query = {};
  for (var key in options) {
    if (!options[key]) continue;
    if (!OPTION_TO_QUERY_PARAM[key]) continue;
    query[OPTION_TO_QUERY_PARAM[key]] = options[key];
  }
  return query;
}

/**
Format a date value in an object.

@param {String} name of property.
@param {Object} object wherein the property lives.
*/
function formatDateOption(name, object) {
  if (object[name] && typeof object[name] === 'object') {
    // ghetto hack to remove MS from the ISO-8601 date string
    object[name] = object[name].toJSON().slice(0, -5) + 'Z';
  }
}

/**
Add defaults to the given object if not defined and format dates.
*/
function formatOptions(options) {
  // some of this is boilerplate assign sane defaults.
  for (var key in DEFAULT_OPTIONS) {
    // never override anything explicitly passed even if its falsy.
    if (key in options) continue;
    options[key] = DEFAULT_OPTIONS[key];
  }

  formatDateOption('signedstart', options);
  formatDateOption('signedexpiry', options);
}

/**
Shared access signature for azure services.

@param {Object} options for signing.
@param {String} options.resource for signing.
@param {String} [options.account=process.env.AZURE_STORAGE_ACCOUNT]
@param {String} [options.accesskey=process.env.AZURE_STORAGE_ACCOUNT] for storage services.
@param {String} [options.signedversion=2012-02-12]
@param {String} [options.tablename] specific table name that is allowed (for Table only)
@param {String} [options.signedstart] signed start time.
@param {String} [options.signedexpiry] signed expiry time.
@param {String} [options.signedpermissions=r] permissions to use (like r)
@param {String} [options.signedidentifier] use a predefined permission rule stored at the resource level.
*/
function table(options) {
  // fill in the default options
  assert(options.resource, 'resource must be given');
  formatOptions(options);

  var queryParams = buildQueryParams(options);
  queryParams.tn = options.resource;

  // build the signed value
  var stringToSign = '';

  stringToSign += newlineValue(options.signedpermissions);
  stringToSign += newlineValue(options.signedstart);
  stringToSign += newlineValue(options.signedexpiry);
  stringToSign += newlineValue(
    '/' + options.account + '/' + options.resource
  );
  stringToSign += newlineValue(options.signedidentifier);
  stringToSign += newlineValue(options.signedversion);
  stringToSign += newlineValue(options.startpk);
  stringToSign += newlineValue(options.startrk);
  stringToSign += newlineValue(options.endpk);
  stringToSign += options.endrk || '';

  queryParams.sig = sign(options.accesskey, stringToSign);

  return queryParams;
}

module.exports.table = table;
