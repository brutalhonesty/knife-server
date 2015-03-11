var request = require('request');
var url = require('url');
var queryString = require('querystring');
var cheerio = require('cheerio');

var express = require('express');
var app = express();

var MARKET_GAME = 'Counter-Strike: Global Offensive';

function searchMarket(query, count, callback) {
  var SEARCH_URL = 'http://steamcommunity.com/market/search/render/';
  var params = queryString.stringify({'query': query, 'start': '0', 'count': count});
  var fullUrl = SEARCH_URL + '?' + params;
  request(fullUrl, function (error, response, body) {
    if(error) {
      return callback(error);
    }
    if(response.statusCode === 200) {
      return callback(null, JSON.parse(body));
    }
  });
}

function parseHtml(htmlResult, pagesize, callback) {
  var $ = cheerio.load(htmlResult);
  var itemList = [];
  for(var i = 0; i < pagesize; i++) {
    var marketGame = $('div#result_' + i).children('div.market_listing_item_name_block').children('span.market_listing_game_name').text();
    if(marketGame === MARKET_GAME) {
      var item = {
        name: $('div#result_' + i).children('div.market_listing_item_name_block').children('span.market_listing_item_name').text(),
        price: $('div#result_' + i).children('div.market_listing_their_price').children('span.market_table_value').children('span').text()
      };
      itemList.push(item);
    }
  }
  return callback(null, itemList);
}

function chooseQuery() {
  var choices = ['Karambit', '★ Karambit', '★ StatTrak™ Karambit'];
  var index = Math.floor(Math.random() * choices.length) + 0;
  return choices[index];
}

app.get('/', function (req, res) {
  res.redirect('/karambit');
});

app.get('/karambit', function (req, res) {
  var count = 100;
  var query = chooseQuery();
  searchMarket(query, count, function (error, response) {
    if(error) {
      return res.json(500, {message: error});
    }
    if(response.success) {
      parseHtml(response.results_html, response.pagesize, function (error, itemList) {
        if(error) {
          return res.json(500, {message: error});
        }
        return res.json({results: itemList, total: response.total_count, query: query});
      });
    }
  });
});

var server = app.listen(5678, function () {
    console.log('Listening on port %d', server.address().port);
});
