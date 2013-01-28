var scraper = require('scraper');
var resolve = require('url').resolve;
var async = require('async');

function scrapeTable(url, cb) {
    scraper(url, function(err, $) {
	if (err) {
	    return cb(err);
	}

	function extract() {
	    var item = {};
	    var line = [];
	    $(this).children("th, td").each(function() {
		if ($(this).attr('colspan') == "5") {
		    var subtable = $(this).children('table');
		    var category = subtable.children('thead').find('th.col-2').text();
		    var income1 = subtable.children('thead').find('th.col-3').text();
		    var income2 = subtable.children('thead').find('th.col-4').text();
		    var sub = subtable.children('tbody').children('tr').map(extract).toArray();
		    item.label = category;
		    item['2013'] = toNum(income1);
		    item['2014'] = toNum(income2);
		    item.sub = sub;
		    return;
		}

		var s = $(this).text();
		if (s == "Details") {
		    var href = $(this).find('a').attr('href');
		    line.push(resolve(url, href));
		} else
		    line.push(s);
	    });
	    if (line.length == 3) {
		item.label = line[0];
		item['2013'] = toNum(line[1]);
		item['2014'] = toNum(line[2]);
	    } else if (line.length > 3) {
		function toNum(s) {
		    return s ?
			parseInt(s.replace(/\./g, "").replace(/,/g, "."), 10) :
			0;
		}
		item.label = line[1];
		item['2013'] = toNum(line[2]);
		item['2014'] = toNum(line[3]);
		item.subLink = line[4];
	    }
	    return item.label ? item : null;
	}

	var items = $('#budget, #budget-detail').children('tbody').children('tr').map(extract).toArray();
	cb(null, items);
    });
}

var START_URL = "http://www.dresden.de/de/02/035/haushalt/buergerhaushalt/ergebnishaushalt.php";
scrapeTable(START_URL, function(err, items) {
    if (err) {
	console.error(err);
	process.exit(1);
    }

    items = items.slice(2);
    var subLinkItems = [];
    function findSubLinks(items) {
	items.forEach(function(item) {
	    if (item.subLink)
		subLinkItems.push(item);
	    if (item.sub)
		findSubLinks(item.sub);
	});
    }
    findSubLinks(items);
    async.forEachSeries(subLinkItems, function(subLinkItem, cb) {
	var scrapeStart = new Date().getTime();
	scrapeTable(subLinkItem.subLink, function(error, items) {
	    console.error("subItems", subLinkItem.subLink, JSON.stringify(items));
	    if (items) {
		delete subLinkItem.subLink;
		console.error("subLinkItem", subLinkItem.label, items.length);
		subLinkItem.sub = items;
	    }
	    var scrapeEnd = new Date().getTime();
	    setTimeout(function() {
		cb(error);
	    }, Math.max(1, scrapeStart + 10000 - scrapeEnd));
	});
    }, function(error) {
	if (error)
	    console.error(error.stack || error.message || error);

	console.log("loadData(" + JSON.stringify(items)  + ");");
    });
});
