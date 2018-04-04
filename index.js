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

// const client = new Client({
//   connectionString: process.env.DATABASE_URL,
//   ssl: true,
// });

// client.connect();

// client.query('SELECT table_schema,table_name FROM information_schema.tables;', (err, res) => {
//   if (err) throw err;
//   console.log("BEGIN");
//   for (let row of res.rows) {
//     console.log("ROW");
//     console.log(JSON.stringify(row));
//   }
//   console.log("END");
//   client.end();
// });

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
app.post('/sends/create', function (req, res) {
  // console.log(req);

  if (!req.body.Destination || !req.body.TokenName || !req.body.Amount) {
    res.status(404).end(req.body.Destination + req.body.TokenName + req.body.Amount + "ERROR: A required data field is missing. SOLUTION: Ensure provide Destination, TokenName, and Amount data fields.");
  }

  const DESTINATION = req.body.Destination.toUpperCase();
  const TOKEN_NAME = req.body.TokenName.toUpperCase();
  const AMOUNT = req.body.Amount;

  let tokenNames = ["XLM", "SECOND", "MINUTE", "HOUR", "DAY", "WEEK", "MONTH", "YEAR", "MASLOW1", "MASLOW2", "MASLOW3", "MASLOW4", "MASLOW5"];
  if (tokenNames.indexOf(TOKEN_NAME) < 0) {
    res.end("ERROR: " + TOKEN_NAME + " is not a supported token. SOLUTION: Resend API request with supported token");
  }

  if (!(AMOUNT >= 1)) {
    res.end("ERROR: The fountain's minimum send amount is 1. SOLUTION: Resend API request with correct amount.");
  }

  // Step 1: Ensure public address/key is valid.
  if (StellarSdk.StrKey.isValidEd25519PublicKey(DESTINATION)) {
    // address isValidEd25519PublicKey
    // console.log("corr")
    let server = new StellarSdk.Server('https://horizon.stellar.org');
    server.accounts()
      .accountId(DESTINATION)
      .call().then((r) => {
        console.log(r);

        let result = JSON.parse(JSON.stringify(r)); // April 4 2018 deleted logs to finaggle this

        // Step 2:  Ensure account has at least 4.5 XLM to cover base fee.s
        if (result.balances[result.balances.length - 1].balance >= 4.5) {
          // alert("Account has more than 4.5");

        } else {
          // alert("Account has less than 4.5");
          res.end("ERROR: Destination account does not have enough XLM (4.5) in baseline funds to support all Time Saved Tokens. SOLUTION: Put more XLM into that account.");
        }

        // Step 3: Ensure account can accept asset. 
        let canAcceptToken = false;
        result.balances.forEach((b) => {
          if (b.asset_code) {
            // console.log("typeof b.asset_code", typeof b.asset_code);
            // console.log("compare balances accepted vs. tab's token", this.props.selectedToken.toUpperCase(), b.asset_code.toUpperCase()); // from front end code
            if (TOKEN_NAME === b.asset_code.toUpperCase()) {
              canAcceptToken = true;
              // There's no built-in ability to break in forEach. https://stackoverflow.com/a/2641374
            }
          }
        });
        console.log(canAcceptToken);
        if (canAcceptToken) {
          // Account can accept token.

          // The source account is the account we will be signing and sending from.
          var sourceSecretKey = process.env["SECRET_KEY_" + TOKEN_NAME];

          // Derive Keypair object and public key (that starts with a G) from the secret
          var sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecretKey);
          var sourcePublicKey = sourceKeypair.publicKey();

          var receiverPublicKey = DESTINATION;

          // Configure StellarSdk to talk to the horizon instance hosted by Stellar.org
          // To use the live network, set the hostname to 'horizon.stellar.org'
          var server = new StellarSdk.Server('https://horizon.stellar.org');

          // Uncomment the following line to build transactions for the live network. Be
          // sure to also change the horizon hostname.
          StellarSdk.Network.usePublicNetwork();
          // StellarSdk.Network.useTestNetwork();

          // Transactions require a valid sequence number that is specific to this account.
          // We can fetch the current sequence number for the source account from Horizon.
          server.loadAccount(sourcePublicKey)
            .then(function (account) {
              const asset;
              if (TOKEN_NAME === 'XLM') {
                asset = StellarSdk.Asset.native();
              } if (TOKEN_NAME.length >= 1 && TOKEN_NAME.length <= 12) {
                asset = new Asset(TOKEN_NAME, process.env["ISSUER_KEY_" + TOKEN_NAME]);
              } else {

              }

              var transaction = new StellarSdk.TransactionBuilder(account)
                // Add a payment operation to the transaction
                .addOperation(StellarSdk.Operation.payment({
                  destination: receiverPublicKey,
                  // The term native asset refers to lumens
                  asset: asset,
                  // Specify 350.1234567 lumens. Lumens are divisible to seven digits past
                  // the decimal. They are represented in JS Stellar SDK in string format
                  // to avoid errors from the use of the JavaScript Number data structure.
                  amount: '350.1234567',
                }))
                // Uncomment to add a memo (https://www.stellar.org/developers/learn/concepts/transactions.html)
                // .addMemo(StellarSdk.Memo.text('Hello world!'))
                .build();

              // Sign this transaction with the secret key
              // NOTE: signing is transaction is network specific. Test network transactions
              // won't work in the public network. To switch networks, use the Network object
              // as explained above (look for StellarSdk.Network).
              transaction.sign(sourceKeypair);

              // Let's see the XDR (encoded in base64) of the transaction we just built
              console.log(transaction.toEnvelope().toXDR('base64'));

              // Submit the transaction to the Horizon server. The Horizon server will then
              // submit the transaction into the network for us.
              server.submitTransaction(transaction)
                .then(function (transactionResult) {
                  console.log(JSON.stringify(transactionResult, null, 2));
                  console.log('\nSuccess! View the transaction at: ');
                  console.log(transactionResult._links.transaction.href);
                })
                .catch(function (err) {
                  console.log('An error has occured:');
                  console.log(err);
                });
            })
            .catch(function (e) {
              console.error(e);
            });

        } else {
          res.end("ERROR: Destination account is not set up to accept " + TOKEN_NAME + ". SOLUTION: Set up destination account to accept " + TOKEN_NAME + ".");
        }

      });
  } else { // if query entered into field isn't a valid public key
    res.end("ERROR: Account address " + DESTINATION + " is not a valid address. SOLUTION: Provide address in Ed25519 format.");
    // this.setState({ addressIsValid: false, hasEnoughXlm: false, canAcceptToken: false });
  }

  // DESTINATION, TOKEN_NAME, and AMOUNT have been validated.

  // old code
  response = {
    TokenName: req.body.TokenName,
    Amount: req.body.Amount,
    Destination: req.body.Destination,
    SendStart: req.body.SendStart
  };
  console.log(response);
  //convert the response in JSON format
  // res.end(JSON.stringify(response));

  // BEGIN TOKEN SENDING PROCESS !!

});





app.listen(app.get('port'), function () {
  console.log("Node app is running at localhost:" + app.get('port'))
})
