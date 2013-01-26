var scraper = require('scraper');

function scrapeTable(url, cb) {
    scraper(START_URL, function(err, $) {
	if (err) {
	    return cb(err);
	}

	function extract() {
	    var item = {};
	    var line = [];
	    $(this).children("td").each(function() {
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
		line.push(s);
	    });
	    if (line.length > 0) {
		function toNum(s) {
		    return s ?
			parseInt(s.replace(/\./g, "").replace(/,/g, "."), 10) :
			0;
		}
		item.label = line[1];
		item['2013'] = toNum(line[2]);
		item['2014'] = toNum(line[3]);
	    }
	    return item.label ? item : null;
	}

	var items = $('table#budget').children('tbody').children('tr').map(extract).toArray();
	cb(null, items);
    });
}

var START_URL = "http://www.dresden.de/de/02/035/haushalt/buergerhaushalt/ergebnishaushalt.php";
scrapeTable(START_URL, function(err, items) {
    if (err) {
	console.error(err);
	process.exit(1);
    }

    console.log("loadData(" + JSON.stringify(items.slice(2))  + ");");
});
