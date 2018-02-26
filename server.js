/******************************************************
* PLEASE DO NOT EDIT THIS FILE
* the verification process may break
* ***************************************************/
// first commit
'use strict';

var fs = require('fs');
var express = require('express');
var app = express();
// var timestamp = require('unix-timestamp')
// var moment = require('moment')
// var reload = require('reload')
// var useragent = require('useragent');
var assert = require('assert');

var validUrl = require('valid-url');
var validator = require('validator');

const MongoClient = require('mongodb').MongoClient

var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/video';
let SHORT_CODE_START = 5395;

if (!process.env.DISABLE_XORIGIN) {
  app.use(function(req, res, next) {
    var allowedOrigins = ['https://fcc-url-shortner1.herokuapp.com', 'https://www.freecodecamp.com'];
    var origin = req.headers.origin || '*';
    if (!process.env.XORIG_RESTRICT || allowedOrigins.indexOf(origin) > -1) {
      console.log(origin);
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    }
    next();
  });
}

// is this working

app.use('/public', express.static(process.cwd() + '/public'));

app.route('/_api/package.json')
  .get(function(req, res, next) {
    console.log('requested');
    fs.readFile(__dirname + '/package.json', function(err, data) {
      if (err) return next(err);
      res.type('txt').send(data.toString());
    });
  });


MongoClient.connect(mongoUri, function(err, client) {
  assert.equal(null, err);
  console.log('Successfully connected to mondodb');

  const urls = 'urls';
  const database = 'heroku_4mhtfdcs'
  var db = client.db(database);

  // reload(app);
  app.route('/')
    .get(function(req, res) {
      if (req.path == '/') {
        res.sendFile(process.cwd() + '/views/index.html');
      } else {
        res.send({
          name: "hello world"
        });
      }
    });

  app.route('/new/*')
    .get(function(req, res) {
      var query = req.path;
      query = query.substr(5);
      console.log("query", query);
      // ...
      if (!validUrl.isUri(query)) {
        console.log("invalid url");

        res.send({
          error: "not a valid url-3"
        })
      } else {
        console.log("valid url");
        db.collection('urls').find({}).count(function(err, count) {
          if (err) res.send({
              error: err
            })
          console.log("count", count);
          const newCount = SHORT_CODE_START + Number(count)
          db.collection('urls').insertOne({
            url: query,
            shortCode: newCount
          }, function(err, doc) {
            assert.equal(null, err);
            console.log("doc", doc);
            res.send({
              "original_url": query,
              "short_url": "https://fcc-url-shortner1.herokuapp.com/" + newCount
            });
          });

        });

        db.collection('urls').find({}).toArray(function(err, docs) {
          console.log("docs", docs);
        });


      }
    });

  app.route('/:query')
    .get(function(req, res) {
      console.log("req", req);
      if (validator.isNumeric(req.params.query)) {
        db.collection('urls').findOne({
          shortCode: Number(req.params.query)
        }, null, function(err, doc) {
          if (doc) {
            console.log(doc);
            res.redirect(doc.url);
          } else {
            res.send({
              error: "shortCode not found"
            })
          }
        });

      } else {
        res.send({
          error: "url invalid"
        })
      }
    });




  // Respond not found to all the wrong routes
  app.use(function(req, res, next) {
    res.status(404);
    res.type('txt').send('Not found');
  });

  // Error Middleware
  app.use(function(err, req, res, next) {
    if (err) {
      res.status(err.status || 500)
        .type('txt')
        .send(err.message || 'SERVER ERROR');
    }
  })
  app.listen(process.env.PORT || 5000, function() {
    console.log('Node.js listening ...');
  });

});


