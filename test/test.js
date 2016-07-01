var fs = require('fs');
var tape = require('tape');
var path = require('path');
var geojson2osm = require('../index.js');

tape('geojson(osmlint output) to osm  -', function(assert) {
  var geojsonFile = path.join(__dirname, '/fixtures/ramyaragupathy.geojson');
  var osmFile = path.join(__dirname, '/fixtures/ramyaragupathy.osm');
  var geojson = fs.readFileSync(geojsonFile).toString();
  var osm = fs.readFileSync(osmFile).toString();
  assert.equal(geojson2osm.geojson2osm(geojson), osm, 'Correct ramyaragupathy.geojson OSM output');
  assert.end();
});

tape('geojson(from geojson.io) to osm  -', function(assert) {
  var geojsonFile = path.join(__dirname, '/fixtures/ayacucho.geojson');
  var osmFile = path.join(__dirname, '/fixtures/ayacucho.osm');
  var geojson = fs.readFileSync(geojsonFile).toString();
  var osm = fs.readFileSync(osmFile).toString();
  assert.equal(geojson2osm.geojson2osm(geojson), osm, 'Correct ayacucho.geojson OSM output');
  assert.end();
});