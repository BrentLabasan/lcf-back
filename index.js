var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var app = express();
app.use(cors()); // https://www.npmjs.com/package/cors
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var moment = require('moment');
var StellarSdk = require('stellar-sdk');
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

app.get('/', function (request, response) {
  response.send('Hello World!')
})

app.get('/send/create', function (request, response) {
  response.send('Creating a Send.')
})



// http://theusualstuff.com/handle-form-data-express-get-post-method/
//route the GET request to the specified path, "/user". 
//This sends the user information to the path  
app.post('/send/create', function (req, res) {
  // console.log(req);
  if (!req.body.Destination || !req.body.TokenName || !req.body.Amount) {
    res.end("ERROR: A required data field is missing. Ensure provide Destination, TokenName, and Amount data fields.");
  }

  response = {
    TokenName: req.body.TokenName,
    Amount: req.body.Amount,
    Destination: req.body.Destination,
    SendStart: req.body.SendStart
  };

  //this line is optional and will print the response on the command prompt
  //It's useful so that we know what infomration is being transferred 
  //using the server
  console.log(response);

  //convert the response in JSON format
  res.end(JSON.stringify(response));
});





app.listen(app.get('port'), function () {
  console.log("Node app is running at localhost:" + app.get('port'))
})
