window.loadData = (function() {

var W = 640, H = 480;
var PAD_TOP = 16;

function formatCurrency(n) {
    var s = "" + n;
    var l = [];
    while(s.length > 3) {
        l.unshift(s.slice(s.length - 3));
        s = s.slice(0, s.length - 3);
    }
    l.unshift(s);
    return l.join(".").replace(/^-\./, "-");
}

var history = [];

function plot(data) {
    var categories = [];
    for(var k in data) {
        var category = {
            label: k,
            sub: data[k]
        };
        function sumUp(data) {
            for(var k in data) {
                if (/^\d{4}$/.test(k)) {
                    if (!category.hasOwnProperty(k)) {
                        category[k] = 0;
                    }
                    category[k] += data[k];
                } else {
                    sumUp(data[k]);
                }
            }
        }
        sumUp(data[k]);
        categories.push(category);
    }

    function sig(x) {
	return x < 0 ? -1 : 1;
    }

    var dates = ['2011', '2012', '2013', '2014', '2015', '2016'];
    var minY = 0, maxY = 0;
    dates.forEach(function(date) {
        categories.forEach(function(d) {
	    if (typeof d[date] != 'number') {
                d[date] = 0;
	    }
        });
        categories = categories.sort(function(d1, d2) {
            if (d1[date] == 0 && d2[date] != 0) {
                return -1;
            } else if (d1[date] != 0 && d2[date] == 0) {
                return 1;
            } else if (d1[date] < 0 && d2[date] < 0) {
                return d2[date] - d1[date];
            } else {
                return d1[date] - d2[date];
            }
        });
        var yIncome = 0;
        var ySpent = 0;
        categories.forEach(function(d) {
            if (d[date] <= 0) {
		d[date + ':y2'] = ySpent;
		ySpent += /*Math.sqrt*/ (-d[date]);
		d[date + ':y1'] = ySpent;
	    } else if (d[date] > 0) {
		d[date + ':y1'] = -yIncome;
		yIncome += /*Math.sqrt*/ (d[date]);
		d[date + ':y2'] = -yIncome;
	    }
	});
        if (-yIncome < minY) {
            minY = -yIncome;
        }
        if (ySpent > maxY) {
            maxY = ySpent;
        }
    });
    function mapX(x) {
	return x * W / (2 * dates.length - 1);
    }
    function mapY(y) {
	return (y - minY) * (H - PAD_TOP) / (maxY - minY) + PAD_TOP;
    }

    var container = d3.select('article');
    /* Clean up: */
    container.select('svg').remove();

    var svg = container.append('svg')
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
	.attr('font-weight', 'bold')
	.attr('text-anchor', 'middle')
	.text(function(date) { return date; });

    var hovertexts;
    svg.selectAll('.line')
	.data(categories).enter()
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
			var y2Min = Math.min.apply(Math, dates.map(function(date) {
				return d[date + ':y2'];
			}));
			if (i == 0)
			    return Math.floor(mapY(y2Min) - 7);
			else
			    return Math.floor(Math.max(
						  mapY(d[date + ':y1']) - 7,
						  mapY(y2Min) + 7));
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
			    return formatCurrency(d[date]) + " €";
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
	}).attr('style', function(d) {
	    if (d.sub)
		return "cursor: pointer";
	    else
		return "";
	}).on('click', function(d) {
	    if (d.sub) {
		history.push({ label: d.label, data: data });
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

    var historyList = d3.select('nav ul')
	.selectAll('li')
	.data(history);
    historyList.enter()
	.append('li')
	.text(function(h) {
	    return "Verlasse " + h.label;
	})
	.on('click', function(h) {
	    var h1;
	    do {
		h1 = history.pop();
	    } while(h1 !== h && history.length > 0);
	    plot(h.data);
	})
    historyList.exit().remove();
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

return function loadData(data) {
    plot(data);
}

})();
