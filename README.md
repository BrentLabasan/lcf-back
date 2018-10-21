# lcf-back

The API backend for [LabasanCryptoFountain.com](http://LabasanCryptoFountain.com).

It is a barebones Node.js app using Express 4, cloned from https://github.com/heroku/node-js-sample.

Postgress (PG) NPM package is listed in the package.json, but I'm not using it.

## TLDR

```sh
npm install

BEFORE
npm start
NOW
heroku local
We'll be using "heroku local" to start local development, because this process allows us to read environment variables from the .env file in the project folder. Specifically, the .env contains the credentials for the MariaDB database that's being provided by Heroku.
TODO elaborate even more on this. Give the links for other people to set this up for themselves.
```

Your app should now be running on [localhost:5000](http://localhost:5000/).

## Deploying to Heroku
Make sure you have [Node.js](http://nodejs.org/) and the [Heroku Toolbelt](https://toolbelt.heroku.com/) installed.


```
heroku create <app_name>
git push heroku master
heroku open
```