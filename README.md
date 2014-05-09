# azure-sign

Azure signing utilities for node (just table service right now)

The goal is to provide a way to grant access keys to your azure resources
(like querying a table from the browser) with a very small footprint.

## Configuration

Like the node azure client(s) the credentials are taken from environment variables by default:

  - `AZURE_STORAGE_ACCOUNT` : used in the "resource" parameter
  - `AZURE_STORAGE_ACCESS_KEY` : used to generate `sig` query parameter and sign the other params

See the [azure docs](http://msdn.microsoft.com/en-us/library/windowsazure/ee395415.aspx) for more details

## Usage

The [tests](/*_test.js) are written in an end-to-end style see them
for actual usage (making calls to azure)

### sas

```js
var signTable = require('azure-sign/table');

var expires = new Date();
// good for an hour
expires.setHours(expires.getHours() + 1);

// sign a table resource
var queryParams = table.sas({
  // this must be lowercase even if your table is uppercase, etc...
  resource: 'tablename',

  // allow reads
  signedpermissions: 'r',

  signedexpiry: expires
});

// query params is suitable for use in any table query that is supported
// via reads

// a quick example using superagent

var superagent = require('superagent');

superagent.get('https://mytable.table.core.windows.net/mytable()').
  query('$filter', '(PartitionKey eq "mypartition")').
  // turn on json mode
  set('Accept', 'application/json');
  end(function(err, result) {
    var json = result.res.body;
  });
```

### sharedKey

```js
var superagent = requrie('superagent');
var signTable = require('azure-sign/table');

var now = new Date().toUTCString();
var url = 'https://' + tableService.host + '/' + tableName + '()';
var req = superagent('GET', url);

// These are all required headers
req.set('Content-Type', 'application/json');
req.set('Date', now)
req.set('x-ms-date', now)
req.set('x-ms-version', '2013-08-15');

var headers = {
  'Content-Type': req.get('Content-Type'),
  'Date': req.get('Date')
};

var signed = signTable.sharedKey({
  method: req.method,
  headers: headers,
  resource: tableName + '()'
});

req.set('Authorization', signed);

// now your request is authenticated go for it!
// ... yay

```

## TODO

  - add SAS signing for blobs
  - add SAS signing for queue
