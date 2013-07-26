// only Point, Polygon, MultiPolygon for now
// basic structure from:
// https://github.com/JasonSanford/GeoJSON-to-Google-Maps
var geo2osm = function(geo, changeset) {
    function togeojson(geo, properties) {
        var nodes = '',
            ways = '',
            relations = '';

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
                if (geo.coordinates.length > 1) {
                    relations += '<relation id="' + count + '" changeset="' + changeset +'">';
                    count--;

                    for (var i = 0; i < geo.coordinates.length; i++) {
                        var coords = [];

                        relations += '<member type="way" ref="' + count + '" ';
                        if (i === 0) {
                            relations += 'role="outer"/>';
                        } else {
                            relations += 'role="inner"/>';
                        }

                        ways += '<way id="' + count + '" changeset="' + changeset + '">';
                        for (var a = 0; a < geo.coordinates[i].length-1; a++) {
                            coords.push([geo.coordinates[i][a][1], geo.coordinates[i][a][0]]);
                        }
                        coords = createNodes(coords, true);
                        nodes += coords['nodes'];
                        ways += coords['nds'];
                        ways += '</way>';
                    }

                    relations += propertiesToTags(properties);
                    relations += '</relation>';
                } else {
                    // just a simple polygon
                    for (var j = 0; j < geo.coordinates[0].length; j++) {

                    }
                }
                break;

        }

        return {
            'nodes': nodes,
            'ways': ways,
            'relations': relations
        };
    }

    function propertiesToTags(properties) {
        console.log('yep');
        console.log(properties);
        var tags = '';
        for (var tag in properties) {
            console.log(tag);
            tags += '<tag k="' + tag + '" v="' + properties[tag] + '"/>';
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
        console.log(nodes);
        console.log(nds);
        return {'nds': nds, 'nodes': nodes};
    }

    var obj,
        count = -1;
    changeset = changeset || false;

    switch (geo.type) {
        case 'FeatureCollection':
            if (geo.features) {
                obj = [];
                for (var i = 0; i < geo.features.length; i++){
                    obj.push(togeojson(geo.features[i].geometry, geo.features[i].properties));
                }
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
                obj = togeojson(geo.geometry);
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
            console.log('Invalid GeoJSON object: GeoJSON object must be one of \"Point\", \"LineString\", \"Polygon\", \"MultiPolygon\", \"Feature\", \"FeatureCollection\" or \"GeometryCollection\".');
    }

    return obj;
};
