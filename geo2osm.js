// only Point, Polygon, MultiPolygon for now
// basic structure from:
// https://github.com/JasonSanford/GeoJSON-to-Google-Maps

// todo:
    // make changeset completely optional
    // fix indexed output with multipolygon feature collection, should be flat string
var geo2osm = function(geo, changeset) {
    function togeojson(geo, properties) {
        var nodes = '',
            ways = '',
            relations = '';
        properties = properties || {};

        switch (geo.type) {
            case 'Point':
                nodes += '<node id="' + count + '" lat="' + geo.coordinates[1] +
                '" lon="' + geo.coordinates[0] + '">';
                nodes += propertiesToTags(properties);
                nodes += '</node>';
                count--;
                break;

            case 'MultiPoint':
                break;
            case 'LineString':
                break;
            case 'MultiLineString':
                break;
            case 'Polygon':
                append(polygon(geo, properties));
                break;

            case 'MultiPolygon':
                relations += '<relation id="' + count + '" changeset="' + changeset + '">';
                properties['type'] = 'multipolygon';
                count--;

                for (var i = 0; i < geo.coordinates.length; i++){

                    poly = polygon({
                        'coordinates': geo.coordinates[i]
                    }, undefined, true);

                    nodes += poly['nodes'];
                    ways += poly['ways'];
                    relations += poly['relations'];
                }

                relations += propertiesToTags(properties);
                relations += '</relation>';
                break;
        }

        function append(obj) {
            nodes += obj['nodes'];
            ways += obj['ways'];
            relations += obj['relations'];
        }

        osm = '<osm version="0.6" generator="geo2osm.js">' + nodes + ways + relations + '</osm>';

        return {
            'nodes': nodes,
            'ways': ways,
            'relations': relations,
            'osm': osm
        };
    }

    function polygon(geo, properties, multipolygon) {
        var nodes = '',
            ways = '',
            relations = '',
            role = '';
        properties = properties || {};
        multipolygon = multipolygon || false;

        if (geo.coordinates.length > 1) {
            // polygon with holes -> multipolygon
            if (!multipolygon) relations += '<relation id="' + count + '" changeset="' + changeset +'">';
            count--;
            properties['type'] = 'multipolygon';

            for (var i = 0; i < geo.coordinates.length; i++) {
                var coords = [];

                role = ((i === 0) ? 'outer' : 'inner');

                relations += '<member type="way" ref="' + count + '" role="' + role + '"/>';
                ways += '<way id="' + count + '" changeset="' + changeset + '">';
                count--;
                for (var a = 0; a < geo.coordinates[i].length-1; a++) {
                    coords.push([geo.coordinates[i][a][1], geo.coordinates[i][a][0]]);
                }
                coords = createNodes(coords, true);
                nodes += coords['nodes'];
                ways += coords['nds'];
                ways += '</way>';
            }

            if (!multipolygon) {
                relations += propertiesToTags(properties);
                relations += '</relation>';
            }
        } else {
            // polygon -> way
            var coords = [];
            ways += '<way id="' + count + '" changeset="' + changeset + '">';
            if (multipolygon) relations += '<member type="way" ref="' + count + '" role="outer"/>';
            count--;
            for (var j = 0; j < geo.coordinates[0].length-1; j++) {
                coords.push([geo.coordinates[0][j][1], geo.coordinates[0][j][0]]);
            }
            coords = createNodes(coords, true);
            nodes += coords['nodes'];
            ways += coords['nds'];
            ways += propertiesToTags(properties);
            ways += '</way>';
        }

        return {
            'nodes': nodes,
            'ways': ways,
            'relations': relations
        };
    }

    function propertiesToTags(properties) {
        var tags = '';
        for (var tag in properties) {
            if (properties[tag] != null) {
                tags += '<tag k="' + tag + '" v="' + properties[tag] + '"/>';
            }
        }
        return tags;
    }

    function createNodes(coords, repeatLastND) {
        var nds = '',
            nodes = '',
            length = coords.length;
        repeatLastND = repeatLastND || false;
            // for polygons

        for (var a = 0; a < length; a++) {
            if (repeatLastND && a === 0) {
                repeatLastND = count;
            }

            nds += '<nd ref="' + count + '"/>';
            nodes += '<node id="' + count + '" lat="' + coords[a][0] +'" lon="' + coords[a][1] +
            '" changeset="' + changeset + '"/>';

            if (repeatLastND && a === length-1) {
                nds += '<nd ref="' + repeatLastND + '"/>';
            }
            count--;
        }
        return {'nds': nds, 'nodes': nodes};
    }

    var obj,
        count = -1;
    changeset = changeset || false;

    switch (geo.type) {
        case 'FeatureCollection':
            if (geo.features) {
                var temp = {
                    'nodes': '',
                    'ways': '',
                    'relations': ''
                };
                obj = [];
                for (var i = 0; i < geo.features.length; i++){
                    obj.push(togeojson(geo.features[i].geometry, geo.features[i].properties));
                }
                temp['osm'] = '<osm version="0.6" generator="geo2osm.js">';
                for (var n = 0; n < obj.length; n++) {
                    temp['nodes'] += obj[n]['nodes'];
                    temp['ways'] += obj[n]['ways'];
                    temp['relations'] += obj[n]['relations'];
                }
                temp['osm'] += temp['nodes'] + temp['ways'] + temp['relations'];
                temp['osm'] += '</osm>';
                obj = temp['osm'];
            } else {
                console.log('Invalid GeoJSON object: FeatureCollection object missing \"features\" member.');
            }
            break;

        case 'GeometryCollection':
            if (geo.geometries) {
                obj = [];
                for (var j = 0; j < geo.geometries.length; j++){
                    obj.push(togeojson(geo.geometries[j]));
                }
            } else {
                console.log('Invalid GeoJSON object: GeometryCollection object missing \"geometries\" member.');
            }
            break;

        case 'Feature':
            if (geo.properties && geo.geometry) {
                obj = togeojson(geo.geometry, geo.properties);
            } else {
                console.log('Invalid GeoJSON object: Feature object missing \"properties\" or \"geometry\" member.');
            }
            break;

        case 'Point':
        case 'MultiPoint':
        case 'LineString':
        case 'MultiLineString':
        case 'Polygon':
        case 'MultiPolygon':
            if (geo.coordinates) {
                obj = togeojson(geo);
            } else {
                console.log('Invalid GeoJSON object: Geometry object missing \"coordinates\" member.');
            }
            break;

        default:
            console.log('Invalid GeoJSON object: GeoJSON object must be one of \"Point\", \"LineString\",' +
                '\"Polygon\", \"MultiPolygon\", \"Feature\", \"FeatureCollection\" or \"GeometryCollection\".');
    }

    return obj;
};
