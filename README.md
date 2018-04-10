# lcf-back

The API backend for [LabasanCryptoFountain.com](http://LabasanCryptoFountain.com).

It is a barebones Node.js app using Express 4, cloned from https://github.com/heroku/node-js-sample.

Postgress (PG) NPM package is listed in the package.json, but I'm not using it.

## TLDR

```sh
npm install
npm start
```

Your app should now be running on [localhost:5000](http://localhost:5000/).

## Deploying to Heroku
Make sure you have [Node.js](http://nodejs.org/) and the [Heroku Toolbelt](https://toolbelt.heroku.com/) installed.


```
heroku create <app_name>
git push heroku master
heroku open
```