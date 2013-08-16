var osm2geo = function(osm, metaProperties) {

    function parse(xml) {
        if (typeof xml == 'string') {
            var parser = new DOMParser();
            xml = parser.parseFromString(xml, 'text/xml');
        }
        return xml;
    }

    function Bounds() {
        var bounds = xml.getElementsByTagName('bounds'),
            bbox = [];
        if (bounds.length) {
            bbox = [
                parseFloat(bounds[0].getAttribute('minlon')),
                parseFloat(bounds[0].getAttribute('minlat')),
                parseFloat(bounds[0].getAttribute('maxlon')),
                parseFloat(bounds[0].getAttribute('maxlat'))
            ];
        }
        geo.bbox = bbox;
    }

    // http://stackoverflow.com/a/1830844
    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    // set tags as properties
    function setProperties(element) {
        var props = {},
            tags = element.getElementsByTagName('tag');

        for (var t = 0; t < tags.length; t++) {
            if (isNumber(tags[t].getAttribute('v'))) {
                props[tags[t].getAttribute('k')] = parseFloat(tags[t].getAttribute('v'));
            } else {
                props[tags[t].getAttribute('k')] = tags[t].getAttribute('v');
            }
        }

        // a few extra, possibly useful, properties
        if (metaProperties) {
            if (element.getAttribute('id')) props.osm_id = parseFloat(element.getAttribute('id'));
            if (element.getAttribute('user')) props.osm_lastEditor = element.getAttribute('user');
            if (element.getAttribute('version')) props.osm_version = parseFloat(element.getAttribute('version'));
            if (element.getAttribute('changeset')) props.osm_lastChangeset = parseFloat(element.getAttribute('changeset'));
            if (element.getAttribute('timestamp')) props.osm_lastEdited = element.getAttribute('timestamp');
        }

        return sortObject(props);
    }

    function getFeature(element, type) {
        return {
            "geometry" : {
                "type" : type,
                "coordinates" : []
            },
            "type" : "Feature",
            "properties" : setProperties(element)
        };
    }

    function cacheNodes() {
        var nodes = xml.getElementsByTagName('node'),
            coords = {},
            withTags = [];

        for (var n = 0; n < nodes.length; n++) {
            var tags = nodes[n].getElementsByTagName('tag');

            coords[nodes[n].getAttribute('id')] = [
                parseFloat(nodes[n].getAttribute('lon')),
                parseFloat(nodes[n].getAttribute('lat'))
            ];

            if (tags.length) withTags.push(nodes[n]);
        }

        return {
            coords: coords,
            withTags: withTags
        };
    }

    // http://stackoverflow.com/a/1359808
    function sortObject(o) {
        var sorted = {},
        key, a = [];
        for (key in o) {
            if (o.hasOwnProperty(key)) {
                a.push(key);
            }
        }
        a.sort();
        for (key = 0; key < a.length; key++) {
            sorted[a[key]] = o[a[key]];
        }
        return sorted;
    }

    function Points() {
        var points = nodeCache.withTags;

        for (var p = 0, r = points.length; p < r; p += 1) {
            var feature = getFeature(points[p], "Point");

            feature.geometry.coordinates = [
                parseFloat(points[p].getAttribute('lon')),
                parseFloat(points[p].getAttribute('lat'))
            ];

            geo.features.push(feature);
        }
    }

    function cacheWays() {
        var ways = xml.getElementsByTagName('way'),
            out = {};

        for (var w = 0; w < ways.length; w++) {
            var feature = {},
                nds = ways[w].getElementsByTagName('nd');

            if (nds[0].getAttribute('ref') === nds[nds.length-1].getAttribute('ref')) {
                feature = getFeature(ways[w], "Polygon");
                feature.geometry.coordinates.push([]);
            } else {
                feature = getFeature(ways[w], "LineString");
            }

            for (var n = 0; n < nds.length; n++) {
                var cords = nodeCache.coords[nds[n].getAttribute('ref')];
                if (feature.geometry.type === "Polygon") {
                    feature.geometry.coordinates[0].push(cords);
                } else {
                    feature.geometry.coordinates.push(cords);
                }
            }

            out[ways[w].getAttribute('id')] = feature;
        }

        return out;
    }

    function Relations() {
        var relations = xml.getElementsByTagName('relation');

        for (var r = 0; r < relations.length; r++) {
            var feature = getFeature(relations[r], "MultiPolygon");

            if (feature.properties.type == 'multipolygon') {
                var members = relations[r].getElementsByTagName('member');

                // osm doesn't keep roles in order, so we do this twice
                for (var m = 0; m < members.length; m++) {
                    if (members[m].getAttribute('role') == 'outer') {
                        assignWay(members[m]);
                    }
                }

                for (var n = 0; n < members.length; n++) {
                    if (members[n].getAttribute('role') == 'inner') {
                        assignWay(members[n]);
                    }
                }

                delete feature.properties.type;
            } else {
                // more relation types here
                // http://taginfo.openstreetmap.us/relations
            }

            if (feature.geometry.coordinates.length) geo.features.push(feature);
        }

        function assignWay(member) {
            var ref = member.getAttribute('ref'),
                way = wayCache[ref];

            if (way && member.getAttribute('role') == 'outer') {
                feature.geometry.coordinates.push(way.geometry.coordinates);
                if (way.properties) {
                    // exterior polygon properties can move to the multipolygon
                    // but multipolygon (relation) tags take precedence
                    for (var prop in way.properties) {
                        if (!feature.properties[prop]) {
                            feature.properties[prop] = prop;
                        }
                    }
                }
            } else if (way && member.getAttribute('role') == 'inner'){
                if (feature.geometry.coordinates.length > 1) {
                    // do a point in polygon against each outer
                    // this determines which outer the inner goes with
                    for (var a = 0; a < feature.geometry.coordinates.length; a++) {
                        if (pointInPolygon(
                                way.geometry.coordinates[0][0],
                                feature.geometry.coordinates[a][0])
                        ) {
                            feature.geometry.coordinates[a].push(way.geometry.coordinates[0]);
                            break;
                        }
                    }
                } else {
                    feature.geometry.coordinates[0].push(way.geometry.coordinates[0]);
                }
            }

            wayCache[ref] = false;
        }
    }

    function Ways() {
        for (var w in wayCache) {
            if (wayCache[w]) {
                geo.features.push(wayCache[w]);
            }
        }
    }

    // https://github.com/substack/point-in-polygon/blob/master/index.js
    function pointInPolygon(point, vs) {
        var x = point[0], y = point[1];
        
        var inside = false;
        for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            var xi = vs[i][0], yi = vs[i][1];
            var xj = vs[j][0], yj = vs[j][1];
            
            var intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        
        return inside;
    }

    var xml = parse(osm),
        geo = {
            "type" : "FeatureCollection",
            "features" : []
        },
        nodeCache = cacheNodes(),
        wayCache = cacheWays();

    Bounds();
    Points();
    Relations();
    Ways();

    return geo;
};
