var express = require('express');
var app = express();
var moment = require('moment');

const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

client.connect();

client.query('SELECT table_schema,table_name FROM information_schema.tables;', (err, res) => {
  if (err) throw err;
  console.log("BEGIN");
  for (let row of res.rows) {
    console.log("ROW");
    console.log(JSON.stringify(row));
  }
  console.log("END");
  client.end();
});

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {
  response.send('Hello World!')
})

app.get('/send/create', function(request, response) {
  response.send('Creating a Send.')
})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
