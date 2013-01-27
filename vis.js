var W = 640, H = 480;
var PAD_TOP = 16;

var history = [];

function plot(data) {
    /* Presort by size */
    data = data.sort(function(a, b) {
	var diff1 = Math.abs(a['2013'] - a['2014']);
	var diff2 = Math.abs(b['2013'] - b['2014']);
	if (diff1 > diff2)
	    return -1;
	else if (diff1 < diff2)
	    return 1;
	else
	    return 0;
    });

    var dates = ['2013', '2014'];
    var totalsSpent = [0, 0], totalsIncome = [0, 0];
    data.forEach(function(d) {
	for(var i = 0; i < dates.length; i++) {
	    var date = dates[i];
	    if (d[date] < 0) {
		d[date + ':y2'] = totalsSpent[i];
		totalsSpent[i] += Math.sqrt(-d[date]);
		d[date + ':y1'] = totalsSpent[i];
	    } else {
		d[date + ':y1'] = -totalsIncome[i];
		totalsIncome[i] += Math.sqrt(d[date]);
		d[date + ':y2'] = -totalsIncome[i];
	    }
	}
    });
    var minY = 0, maxY = 0;
    for(var i = 0; i < dates.length; i++) {
	if (-totalsIncome[i] < minY)
	    minY = -totalsIncome[i];
	if (totalsSpent[i] > maxY)
	    maxY = totalsSpent[i];
    }
    function mapX(x) {
	return x * W / (2 * dates.length - 1);
    }
    function mapY(y) {
	return (y - minY) * (H - PAD_TOP) / (maxY - minY) + PAD_TOP;
    }

    var body = d3.select('body');
    /* Clean up: */
    body.select('svg').remove();

    var svg = body.append('svg')
	.attr('width', W)
	.attr('height', H);

    svg.selectAll('.date')
	.data(dates).enter()
	.append('text')
	.attr('x', function(date, i) {
	    return mapX(i * 2 + 0.5);
	})
	.attr('y', PAD_TOP - 4)
	.attr('fill', 'black')
	.attr('text-anchor', 'middle')
	.text(function(date) { return date; });

    var hovertexts;
    svg.selectAll('.line')
	.data(data).enter()
	.append('path')
	.attr('class', "line")
	.attr('fill', function(d) {
	    return strColor(d.label);
	})
	.attr('stroke', "black")
	.attr('stroke-width', "0.5")
 	.attr('d', function(d) {
	    var x = -2, dx = dates.length * 2 - 1;
	    var bottoms = [];
	    var tops = [];
	    dates.forEach(function(date) {
		x += 2;

		var y1 = d[date + ':y1'];
		var y2 = d[date + ':y2'];
		bottoms.unshift([mapX(x + 1), mapY(y1)],
				[mapX(x), mapY(y1)]);
		tops.push([mapX(x), mapY(y2)],
			  [mapX(x + 1), mapY(y2)]);
	    });
	    var prevX, prevY;
	    var d1 = bottoms.map(function(p, i) {
		if (i == 0) {
		    return "M " + Math.floor(p[0]) + " " + Math.floor(p[1]);
		} else if (i % 2 == 1) {
		    prevX = p[0];
		    prevY = p[1];
		    return "L " + Math.floor(p[0]) + " " + Math.floor(p[1]);
		} else {
		    return ["C",
			    Math.floor(0.75 * p[0] + 0.25 * prevX), Math.floor(prevY),
			    Math.floor(0.75 * prevX + 0.25 * p[0]), Math.floor(p[1]),
			    Math.floor(p[0]), Math.floor(p[1])
			   ].join(" ");
		}
	    });
	    var d2 = tops.map(function(p, i) {
		if (i == 0) {
		    return "L " + Math.floor(p[0]) + " " + Math.floor(p[1]);
		} else if (i % 2 == 1) {
		    prevX = p[0];
		    prevY = p[1];
		    return "L " + Math.floor(p[0]) + " " + Math.floor(p[1]);
		} else {
		    return ["C",
			    Math.floor(0.75 * p[0] + 0.25 * prevX), Math.floor(prevY),
			    Math.floor(0.75 * prevX + 0.25 * p[0]), Math.floor(p[1]),
			    Math.floor(p[0]), Math.floor(p[1])
			   ].join(" ");
		}
	    });
	    return d1.join(" ") + " " + d2.join(" ") + " Z";
	}).on('mouseover', function(d) {
	    if (!d.hovering) {
		d3.select(this)
		    .attr('stroke-width', "1.5")
		    .attr('z-index', 1);
		hovertexts = svg.selectAll('.hovertext')
		    .data([""].concat(dates)).enter()
		    .append('text')
		    .attr('class', "hovertext")
		    .attr('x', function(date, i) {
			if (i == 0)
			    return Math.floor(mapX((dates.length * 2 - 1) / 2));
			else
			    return Math.floor(mapX((i - 1) * 2 + 0.5));
		    })
		    .attr('y', function(date, i) {
			if (i == 0) {
			    var y = Math.min.apply(Math, dates.map(function(date) {
				return d[date + ':y2'];
			    }));
			    return Math.floor(mapY(y) + 9);
			} else
			    return Math.floor(mapY(d[date + ':y1']) - 7);
		    })
		    .attr('fill', "black")
		    .attr('font-weight', function(date, i) {
			return i == 0 ? "bold" : "normal";
		    })
		    .attr('text-anchor', 'middle')
		    .attr('dominant-baseline', 'middle')
		    .text(function(date, i) {
			if (i == 0)
			    return d.label;
			else
			    return d[date] + " €";
		    });
		d.hovering = true;
	    }
	}).on('mouseout', function(d) {
	    if (d.hovering) {
		hovertexts.remove();
		d3.select(this)
		    .attr('stroke-width', "0.5")
		    .attr('z-index', 0);
		delete d.hovering;
	    }
	}).on('click', function(d) {
	    if (d.sub) {
		history.push(data);
		plot(d.sub);
	    }
	});

    // svg.style('height', 0).transition().duration(500).style('height', W);

    svg.append('line')
	.attr('x1', mapX(0))
	.attr('y1', mapY(0))
	.attr('x2', mapX(dates.length * 2 - 1))
	.attr('y2', mapY(0))
	.attr('stroke', 'red')
	.attr('stroke-dasharray', "4px");
}

function strColor(s) {
    var rgb = [0, 0, 0];
    for(var i = 0; i < s.length; i++) {
	var c = s.charCodeAt(i);
	rgb[0] += 37 * (c & 0x0f);
	rgb[1] += 29 * (c & 0xf0);
	rgb[2] += 23 * (c & 0xa8);
    }
    for(i = 0; i < 3; i++)
	rgb[i] = (rgb[i] % 128) + 128;
    return "rgb(" + [rgb].join(",") + ")";
}

function loadData(data) {
    d3.select('body').append('p')
	.append('a')
	.attr('class', "back")
	.attr('href', "#")
	.on('click', function() {
	    var data = history.pop();
	    if (data)
		plot(data);
	})
	.text("Ebene hoch");

    plot(data);
}
