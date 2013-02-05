/**************************************************************************
 *                 OSM2GEO - OSM to GeoJSON converter
 * OSM to GeoJSON converter takes in a .osm XML file as input and produces
 * corresponding GeoJSON object.
 *
 * AUTHOR: P.Arunmozhi <aruntheguy@gmail.com>
 * DATE  : 26 / Nov / 2011
 * LICENSE : WTFPL - Do What The Fuck You Want To Public License
 * LICENSE URL: http://sam.zoy.org/wtfpl/
 *
 * USAGE: This script contains a single function -> geojson osm2geo(osmXML)
 * It takes in a .osm (xml) as parameter and retruns the corresponding
 * GeoJson object.
 *
 * Quotes vary a bit (between single ' and double ") in order to stick to
 * strict JSON syntax.
 *
 * ***********************************************************************/
var osm2geo = function(osm) {
    var xml = parse(osm),
        geo = {
            "type" : "FeatureCollection",
            "features" : []
        };

    function parse(xml) {
        var string = new XMLSerializer().serializeToString(xml),
            parser = new DOMParser();
        return parser.parseFromString(string, 'text/xml');
    }

    // set the bounding box [minX,minY,maxX,maxY]; x -> long, y -> lat
    function getBounds(bounds) {
        var bbox = [];

        if (bounds.length) {
            bbox.push(+bounds[0].getAttribute('minlon'));
            bbox.push(+bounds[0].getAttribute('minlat'));
            bbox.push(+bounds[0].getAttribute('maxlon'));
            bbox.push(+bounds[0].getAttribute('maxlat'));
        }

        return bbox;
    }

    geo.bbox = getBounds(xml.getElementsByTagName('bounds'));

    // set properties for a feature
    function setProps(element){
        var properties = {},
            tags = element.getElementsByTagName('tag'),
            t = tags.length;

        while (t--) {
            properties[tags[t].getAttribute('k')] = tags[t].getAttribute('v');
        }

        return properties;
    }

    // create a feature of given type
    function getFeature(element, type){
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
            coords = {};
            withTags = [];

        while (n--) {
            var tags = nodes[n].getElementsByTagName('tag');

            coords[nodes[n].getAttribute('id')] =
                [nodes[n].getAttribute('lon'), nodes[n].getAttribute('lat')];

            if (tags.length) withTags.push(nodes[n]);
        }

        return {
            coords: coords,
            withTags: withTags
        };
    }

    var ways = xml.getElementsByTagName('way'),
        nodesCache = cacheNodes();

    var w = ways.length;
    while (w--) {
        var feature = {},
            nds = ways[w].getElementsByTagName('nd');

        // If first and last nd are same, then its a polygon
        if (nds[0].getAttribute('ref') === nds[nds.length-1].getAttribute('ref')) {
            feature = getFeature(ways[w], "Polygon");
            feature.geometry.coordinates.push([]);
        } else {
            feature = getFeature(ways[w], "LineString");
        }

        var n = nds.length;
        while (n--) {
            var cords = nodesCache.coords[nds[n].getAttribute('ref')];

            // If polygon push it inside the cords[[]]
            if (feature.geometry.type === "Polygon") {
                feature.geometry.coordinates[0].push(cords);
            } else {
                feature.geometry.coordinates.push(cords);
            }
        }

        geo.features.push(feature);
    }
    
    var points = nodesCache.withTags;

    var p = points.length;
    while (p--) {
        var feature = getFeature(points[p], "Point");

        feature.geometry.coordinates.push(points[p].getAttribute('lon'));
        feature.geometry.coordinates.push(points[p].getAttribute('lat'));

        geo.features.push(feature);
    }

    return geo;
};
