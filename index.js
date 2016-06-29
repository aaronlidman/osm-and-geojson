#!/usr/bin/env node


'use strict';
var fs = require('fs');

var geojson2osm = require('./src/geojson2osm');
var file = process.argv.slice(2)[0];
var contents = fs.readFileSync(file).toString();
// geojson2osm.geojson2osm(contents)
 process.stdout.write(geojson2osm.geojson2osm(contents));