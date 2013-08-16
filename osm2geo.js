var osm2geo = function(osm, metaProperties) {

    function parse(xml) {
        // should only serialize and parse if needed, right?
            // is typeof (object/string) enough?
        var string = new XMLSerializer().serializeToString(xml),
            parser = new DOMParser();
        return parser.parseFromString(string, 'text/xml');
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

    function buildRelations() {
        var relations = xml.getElementsByTagName('relation'),
            features = [],
            done = {},
            mpolyCount = 0;

        for (var r = 0; r < relations.length; r++) {
            feature = getFeature(relations[r], "MultiPolygon");

            if (feature.properties.type == 'multipolygon') {
                var members = relations[r].getElementsByTagName('member');
                for (var m = 0; m < members.length; m++) {
                    if (members[m].getAttribute('role') == 'outer') {
                        feature.geometry.coordinates.push([[]]);
                    } else {
                        // how do you know which outer the inner goes with?
                            // osm doesn't make a distinction, geojson does
                        // polygon-in-polygon logic required?
                        // right now I'm pushing all inners on the first outer
                        if (!feature.geometry.coordinates[0]) {
                            feature.geometry.coordinates.push([[]]);
                            // this is lame, we can do better
                        }
                        feature.geometry.coordinates[0].push([]);
                    }

                    var length = feature.geometry.coordinates.length-1;
                    done[members[m].getAttribute('ref')] = [
                        mpolyCount,
                        length,
                        feature.geometry.coordinates[length].length-1
                    ];
                    // [index of multipolygon, index of polygon inside multi, index of coords in poly]
                    // basically the exact location to insert the way into
                }

                delete feature.properties.type;
                features.push(feature);
                mpolyCount++;
            } // might get to other types in the future
        }

        return {
            features: features,
            done: done
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
        var points = nodesCache.withTags;

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
                var cords = nodesCache.coords[nds[n].getAttribute('ref')];
                if (feature.geometry.type === "Polygon") {
                    feature.geometry.coordinates[0].push(cords);
                } else {
                    feature.geometry.coordinates.push(cords);
                }
            }

            out[ways[w].getAttribute('id')] = feature;
        }
    }

    var xml = parse(osm),
        geo = {
            "type" : "FeatureCollection",
            "features" : []
        },
        nodesCache = cacheNodes(),
        wayCache = cacheWays();

    Bounds();
    Points();
    var relational = buildRelations();
    // should be able to remove buildRelations
    // Relations();
    // Ways();

    for (var r = 0; r < relational.features.length; r++) {
        geo.features.push(relational.features[r]);
    }

    return geo;
};
