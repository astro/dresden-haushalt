var scraper = require('scraper');

function scrapeTable(url, cb) {
    scraper(START_URL, function(err, $) {
	if (err) {
	    return cb(err);
	}

	var categories = [];
	var lines = [];
	function extract() {
	    var line = [];
	    $(this).children("td").each(function() {
		if ($(this).attr('colspan') == "5") {
		    var subtable = $(this).children('table');
		    categories.push(subtable.children('thead').find('th.col-2').text());
		    subtable.children('tbody').children('tr').each(extract);
		    categories.pop();
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
		    return s ?
			parseInt(s.replace(/\./g, "").replace(/,/g, "."), 10) :
			0;
		}
		categories.push(line[1]);
		var income1 = toNum(line[2]);
		var income2 = toNum(line[3]);
		lines.push(["2013-" + line[0], income1 > 0 ? -income1 : 0, income1 <= 0 ? -income1 : 0, "2013"].concat(categories));
		lines.push(["2014-" + line[0], income2 > 0 ? -income2 : 0, income2 <= 0 ? -income2 : 0, "2014"].concat(categories));
		categories.pop();
	    }
	}

	$('table#budget').children('tbody').children('tr').each(extract);
	cb(null, lines);
    });
}

var START_URL = "http://www.dresden.de/de/02/035/haushalt/buergerhaushalt/ergebnishaushalt.php";
scrapeTable(START_URL, function(err, lines) {
    if (err) {
	console.error(err);
	process.exit(1);
    }

    var maxFrom = Math.max.apply(Math, lines.map(function(line) {
	return line.length - 4;
    }));
    lines.forEach(function(line) {
	var lastFrom = line[line.length - 1];
	while(line.length < maxFrom + 4)
	    line.push(lastFrom);
    });
    var froms = [];
    for(var i = 0; i < maxFrom; i++)
	froms.push("from" + (i + 1));
    console.log("id,income,spent,time," + froms.join(","));
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
