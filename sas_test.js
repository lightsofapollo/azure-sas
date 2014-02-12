suite('sas', function() {
  var subject = require('./sas');
  var azure = require('azure');
  var tableName = 'SuperTableWoot';
  var request = require('superagent-promise');
  var tableService;

  // create the table to test against
  setup(function(done) {
    tableService = azure.createTableService();
    tableService.createTableIfNotExists(tableName, done);
  });

  suite('sign table', function() {
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

      var params = subject.table({
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
