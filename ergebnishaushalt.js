var scraper = require('scraper');

function scrapeTable(url, cb) {
    scraper(START_URL, function(err, $) {
	if (err) {
	    return cb(err);
	}

	var lines = [];
	function extract() {
	    var line = [];
	    $(this).children("th, td").each(function() {
		if ($(this).attr('colspan') == "5") {
		    var subtable = $(this).children('table');
		    subtable.children('thead').children('tr').each(extract);
		    subtable.children('tbody').children('tr').each(extract);
		    return;
		}

		var s = $(this).text();
		line.push(s);
	    });
	    if (line.length > 0) {
		var last = line[line.length - 1];
		if (last == "" || last == "Details")
		    line.pop();

		function toNum(s) {
		    return parseInt(s.replace(/\./g, "").replace(/,/g, "."), 10);
		}
		lines.push(["2013-" + line[0], toNum(line[2]), "2013", line[1]]);
		lines.push(["2014-" + line[0], toNum(line[3]), "2014", line[1]]);
	    }
	}

	$('table#budget tr').each(extract);
	cb(null, lines);
    });
}

var START_URL = "http://www.dresden.de/de/02/035/haushalt/buergerhaushalt/ergebnishaushalt.php";
scrapeTable(START_URL, function(err, lines) {
    if (err) {
	console.error(err);
	process.exit(1);
    }

    console.log("id,amount,time,from");
    lines.slice(2).forEach(function(line) {
    	var csv = line.map(function(s) {
    	    if (typeof s == 'string' && s.indexOf('"') >= 0)
    		throw "unexpected quote";
    	    else if (typeof s == 'string' && s.indexOf(",") >= 0)
    		return '"' + s + '"';
    	    else
    		return s;
    	}).join(",");
    	console.log(csv);
    });
});
