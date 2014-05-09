suite('table', function() {
  var subject = require('./table');
  var azure = require('azure');
  var tableName = 'SuperTableWoot';
  var request = require('superagent-promise');
  var tableService;

  // create the table to test against
  setup(function(done) {
    tableService = azure.createTableService();
    tableService.createTableIfNotExists(tableName, done);
  });

  suite('#sharedKey', function() {
    var task = {
      PartitionKey: 'hometasks',
      RowKey: 'xfoo',
      Description: 'Wash Dishes'
    };

    // insert a row
    setup(function(done) {
      tableService.insertOrReplaceEntity(tableName, task, done);
    });

    test('query a table', function() {
      // read some table data.
      var now = new Date().toUTCString();
      var url = 'https://' + tableService.host + '/' + tableName + '()';
      var req = request('GET', url);
      req.set('Content-Type', 'application/json');
      req.set('Date', now)
      req.set('x-ms-date', now)
      req.set('x-ms-version', '2013-08-15');

      var headers = {
        'Content-Type': req.get('Content-Type'),
        'Date': req.get('Date')
      };

      var signed = subject.sharedKey({
        method: req.method,
        headers: headers,
        resource: tableName + '()'
      });

      req.set('Authorization', signed);

      req.set('Accept', 'application/json;odata=fullmetadata');
      req.query('$filter', '(PartitionKey eq "hometasks" and RowKey eq "1")');
      req.query('$top', '1');

      return req.end().then(function(result) {
        if (result.error) throw result.error;
        var body = result.res.body.value[0];

        assert.equal(body.PartitionKey, task.PartitionKey);
        assert.equal(body.RowKey, task.RowKey);
        assert.equal(body.Description, task.Description);
      });
    });

  });

  suite('#sas', function() {
    var task = {
      PartitionKey: 'hometasks',
      RowKey: 'xfoo',
      Description: 'Wash Dishes'
    };

    // insert a row
    setup(function(done) {
      tableService.insertOrReplaceEntity(tableName, task, done);
    });

    test('query a table', function() {
      // read some table data.
      var url = 'https://' + tableService.host + '/' + tableName + '()';

      var params = subject.sas({
        signedpermissions: 'r',
        resource: tableName.toLowerCase(),
        signedexpiry: new Date(Date.now() + 60 * 1000)
      });

      var req = request('GET', url).query(params);
      req.set('Accept', 'application/json;odata=fullmetadata');
      req.query('$filter', '(PartitionKey eq "hometasks" and RowKey eq "1")');
      req.query('$top', '1');

      return req.end().then(function(result) {
        var body = result.res.body.value[0];

        assert.equal(body.PartitionKey, task.PartitionKey);
        assert.equal(body.RowKey, task.RowKey);
        assert.equal(body.Description, task.Description);
      });
    });

  });
});
