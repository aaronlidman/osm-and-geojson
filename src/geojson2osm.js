'use strict';

var geojson2osm = {};
geojson2osm.geojson2osm = function(geojson) {
  function togeojson(geo, properties) {
    if (typeof geo === 'string') geo = JSON.parse(geo);
    var nodes = '',
      ways = '',
      relations = '';
    properties = properties || {};
    switch (geo.type) {
      case 'Point':
        append(Point(geo, properties));
        break;
      case 'MultiPoint':
        break;
      case 'LineString':
        append(LineString(geo, properties));
        break;
      case 'MultiLineString':
        append(MultiLineString(geo, properties));
        break;
      case 'Polygon':
        append(Polygon(geo, properties));
        break;
      case 'MultiPolygon':
        break;
    }

    function append(obj) {
      nodes += obj.nodes;
      ways += obj.ways;
      relations += obj.relations;
    }
    return {
      nodes: nodes,
      ways: ways,
      relations: relations
    };
  }

  function Point(geo, properties) {
    var nodes = '';
    var coord = roundCoords([geo.coordinates]);
    nodes += '<node lat="' + coord[0][1] + '" lon="' + coord[0][0] + '" ' + propertiesEdit(properties) + '>';
    nodes += propertiesToTags(properties);
    nodes += '</node>';
    count--;
    return {
      nodes: nodes
    };
  }

  function propertiesEdit(properties) {
    var attributes = '';
    var hasId = false;
    var hasChangeset = false;
    for (var attrb in properties) {
      if (attrb.indexOf('@') > -1) {
        if (attrb === '@timestamp') {
          var date = new Date(properties[attrb] * 1000);
          attributes += attrb.replace('@', '') + '="' + date.toISOString() + '" ';
        } else if (attrb === '@id') {
          attributes += attrb.replace('@', '') + '="' + properties[attrb] + '" ';
          hasId = true;
        } else if (attrb === '@changeset') {
          attributes += attrb.replace('@', '') + '="' + properties[attrb] + '" ';
          hasChangeset = true;
        } else {
          attributes += attrb.replace('@', '') + '="' + properties[attrb] + '" ';
        }
      }
    }
    if (!hasId) {
      attributes += ' id="' + count + '" ';
    }
    if (!hasChangeset) {
      attributes += ' changeset="false" ';
    }
    return attributes;
  }

  function LineString(geo, properties) {
    var nodes = '',
      ways = '';
    var coords = [];
    ways += '<way visible="true" ' + propertiesEdit(properties) + '>';
    count--;
    for (var i = 0; i <= geo.coordinates.length - 1; i++) {
      coords.push([geo.coordinates[i][1], geo.coordinates[i][0]]);
    }
    coords = createNodes(coords, false);
    nodes += coords.nodes;
    ways += coords.nds;
    ways += propertiesToTags(properties);
    ways += '</way>';
    return {
      nodes: nodes,
      ways: ways
    };
  }

  function MultiLineString(geo, properties) {
    var nodes = '',
      ways = '';
    var coords = [];
    ways += '<way visible="true" ' + propertiesEdit(properties) + ' >';
    count--;
    for (var i = 0; i <= geo.coordinates[0].length - 1; i++) {
      coords.push([geo.coordinates[0][i][1], geo.coordinates[0][i][0]]);
    }
    coords = createNodes(coords, false);
    nodes += coords.nodes;
    ways += coords.nds;
    ways += propertiesToTags(properties);
    ways += '</way>';
    return {
      nodes: nodes,
      ways: ways
    };
  }

  function Polygon(geo, properties) {
    var nodes = '',
      ways = '';
    var coords = [];
    ways += '<way visible="true" ' + propertiesEdit(properties) + ' >';
    count--;
    for (var i = 0; i <= geo.coordinates[0].length - 1; i++) {
      coords.push([geo.coordinates[0][i][1], geo.coordinates[0][i][0]]);
    }
    coords = createNodes(coords, false);
    nodes += coords.nodes;
    ways += coords.nds;
    ways += propertiesToTags(properties);
    ways += '</way>';
    return {
      nodes: nodes,
      ways: ways
    };
  }

  function propertiesToTags(properties) {
    var tags = '';
    for (var tag in properties) {
      if (properties[tag] !== null && tag && tag.indexOf('@') === -1) {
        tags += '<tag k="' + tag + '" v="' + properties[tag].toString().replace(/"/g, '').replace(/&/g, '').replace('<', '&lt;').replace('<', '&gt;') + '"/>';
      }
    }
    return tags;
  }

  function roundCoords(coords) {
    for (var a = 0; a < coords.length; a++) {
      coords[a][0] = Math.round(coords[a][0] * 1000000) / 1000000;
      coords[a][1] = Math.round(coords[a][1] * 1000000) / 1000000;
    }
    return coords;
  }

  function createNodes(coords, repeatLastND) {
    var nds = '',
      nodes = '',
      length = coords.length;
    repeatLastND = repeatLastND || false;
    coords = roundCoords(coords);
    for (var a = 0; a < length; a++) {
      if (hash.hasOwnProperty(coords[a])) {
        nds += '<nd ref="' + hash[coords[a]] + '"/>';
      } else {
        hash[coords[a]] = count;
        if (repeatLastND && a === 0) {
          repeatLastND = count;
        }
        nds += '<nd ref="' + count + '"/>';
        nodes += '<node id="' + count + '" lat="' + coords[a][0] + '" lon="' + coords[a][1] + '" changeset="' + changeset + '"/>';

        if (repeatLastND && a === length - 1) {
          nds += '<nd ref="' + repeatLastND + '"/>';
        }
      }
      count--;
    }
    return {
      'nds': nds,
      'nodes': nodes
    };
  }
  var hash = {};
  var count = -1;
  var changeset = 'false';
  var osm_file = '';
  if (typeof geojson === 'string') geojson = JSON.parse(geojson);
  switch (geojson.type) {
    case 'FeatureCollection':
      var temp = {
        nodes: '',
        ways: '',
        relations: ''
      };
      var obj = [];
      for (var i = 0; i < geojson.features.length; i++) {
        obj.push(togeojson(geojson.features[i].geometry, geojson.features[i].properties));
      }
      for (var n = 0; n < obj.length; n++) {
        if (obj[n].nodes !== 'undefined') {
          temp.nodes += obj[n].nodes;
        }
        if (obj[n].ways !== 'undefined') {
          temp.ways += obj[n].ways;
        }
        if (obj[n].relations !== 'undefined') {
          temp.relations += obj[n].relations;
        }
      }
      temp.osm = '<?xml version="1.0" encoding="UTF-8"?><osm version="0.6" generator="https://github.com/Rub21/geojson2osm">';
      temp.osm += temp.nodes + temp.ways + temp.relations;
      temp.osm += '</osm>';
      osm_file = temp.osm;
      break;
    default:
      console.log('default');
      break;
  }
  return osm_file;
};
if (typeof module !== 'undefined') module.exports = geojson2osm;