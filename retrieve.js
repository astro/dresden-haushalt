var csv = require('csv');
var request = require('request');
var through = require('through2');

function fetchStream(url) {
    var headers;

    return request(url)
        .pipe(csv.parse())
        .pipe(through.obj(function objectify(cells, enc, cb) {
            if (!headers) {
                headers = cells;
            } else {
                var obj = {};
                for(var i = 0; i < headers.length && i < cells.length; i++) {
                    obj[headers[i]] = cells[i];
                }
                this.push(obj);
            }

            cb();
        }));
}

var urls = [
    "https://gist.github.com/Mic92/194089d7c97300b250f6/raw/c92513b85dc85448910c9111ff059ae45b9b7d07/haushalt-2011_12.csv",
    "https://gist.github.com/Mic92/25df212701e223886f10/raw/b8d69e3420d32046812b0ba45e08c7f0b7769fdb/haushalt-2013_14.csv",
    "https://gist.github.com/Mic92/876d8fd0190df52ffb4c/raw/9b822d8a46c337345128ce274189d518987e4494/haushaltsentwurf-2015_16.csv"
];
var tree = {};
function go() {
    if (urls.length < 1) {
        console.log(JSON.stringify(tree, 2));
        return;
    }

    fetchStream(urls.shift())
        .pipe(through.obj(function(obj, enc, cb) {
            var subtree = tree;
            ['part', 'group', 'subgroup', 'row'].forEach(function(k) {
                var key = obj[k + '-name'] || obj[k + '-id'] || obj[k + '-index'] || "";
                if (!key) {
                    return;  // next k
                }
                if (!subtree.hasOwnProperty(key)) {
                    subtree[key] = {};
                }
                subtree = subtree[key];
            });
            subtree[obj.time] = parseInt(obj.amount, 10);

            cb();
          }, go));
}
go();
