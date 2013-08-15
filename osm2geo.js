var osm2geo = function(osm, metaProperties) {

    function parse(xml) {
        var string = new XMLSerializer().serializeToString(xml),
            parser = new DOMParser();
        return parser.parseFromString(string, 'text/xml');
    }

    // set the bounding box [minX,minY,maxX,maxY]; x -> long, y -> lat
    function getBounds(bounds) {
        var bbox = [];

        if (bounds.length) {
            bbox = [
                parseFloat(bounds[0].getAttribute('minlon')),
                parseFloat(bounds[0].getAttribute('minlat')),
                parseFloat(bounds[0].getAttribute('maxlon')),
                parseFloat(bounds[0].getAttribute('maxlat'))
            ];
        }

        return bbox;
    }

    // http://stackoverflow.com/a/1830844
    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    // set tags as properties
    function setProps(element) {
        var props = {},
            tags = element.getElementsByTagName('tag'),
            t = tags.length;

        while (t--) {
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

    // create a feature of given type
    function getFeature(element, type) {
        return {
            "geometry" : {
                "type" : type,
                "coordinates" : []
            },
            "type" : "Feature",
            "properties" : setProps(element)
        };
    }

    function cacheNodes() {
        var nodes = xml.getElementsByTagName('node'),
            n = nodes.length,
            coords = {},
            withTags = [];

        while (n--) {
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
            r = relations.length,
            features = [],
            done = {},
            count = 0;

        while (r--) {
            feature = getFeature(relations[r], "MultiPolygon");

            if (feature.properties.type == 'multipolygon') {
                feature.geometry.coordinates.push([]);

                var members = relations[r].getElementsByTagName('member'),
                    m = members.length;

                while (m--) {
                    done[members[m].getAttribute('ref')] = count;
                    // feature.geometry.coordinates[0].push([]);

                    // .getAttribute('role') stuff would go somewhere around here
                }

                delete feature.properties.type;
                features[count] = feature;
                count++;
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


    var xml = parse(osm),
        geo = {
            "type" : "FeatureCollection",
            "features" : []
        },
        nodesCache = cacheNodes();

    geo.bbox = getBounds(xml.getElementsByTagName('bounds'));

    Points();

    // MultiPolygons
    var relational = buildRelations(),
        ways = xml.getElementsByTagName('way');

    // Polygons/LineStrings

    for (var w = 0, x = ways.length; w < x; w += 1) {
        var feature = {},
            nds = ways[w].getElementsByTagName('nd');

        // If first and last nd are the same then its a polygon
        if (nds[0].getAttribute('ref') === nds[nds.length-1].getAttribute('ref')) {
            feature = getFeature(ways[w], "Polygon");
            feature.geometry.coordinates.push([]);
        } else {
            feature = getFeature(ways[w], "LineString");
        }

        var n = nds.length;
        while (n--) {
            var cords = nodesCache.coords[nds[n].getAttribute('ref')];

            if (feature.geometry.type === "Polygon") {
                feature.geometry.coordinates[0].push(cords);
            } else {
                feature.geometry.coordinates.push(cords);
            }
        }

        if (relational.done[ways[w].getAttribute('id')]) {
            var relWay = relational.done[ways[w].getAttribute('id')];
            relational.features[relWay].geometry.coordinates[0].push(feature.geometry.coordinates);

            // transfer the way (polygon) properties over to the relation (multipolygon)
            // no overwriting, relation tags take precedence
            for (var wayProp in feature.properties) {
                if (!relational.features[relWay].properties[wayProp]) {
                    relational.features[relWay].properties[wayProp] = feature.properties[wayProp];
                }
            }
        } else {
            geo.features.push(feature);
        }
    }

    var r = relational.features.length;
    while (r--) {
        geo.features.push(relational.features[r]);
    }

    console.log(geo);
    return geo;
};
