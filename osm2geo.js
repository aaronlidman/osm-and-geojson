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
 * DEPENDENCY: OSM2GEO entirely depends on jQuery for the XML parsing and
 * DOM traversing. Make sure you include <script src="somewhere/jquery.js">
 * </script> before you include osm2geo.js
 *
 * USAGE: This script contains a single function -> geojson osm2geo(osmXML)
 * It takes in a .osm (xml) as parameter and retruns the corresponding 
 * GeoJson object.
 *
 * ***********************************************************************/
var osm2geo = function(osm){
    // Check wether the argument is a Jquery object and act accordingly
    // Assuming it as a raw server response for now
    var $xml = jQuery(osm);
    // Initialize the empty GeoJSON object
    var geo = {
        "type" : "FeatureCollection",
        "features" : []
    };
    // setting the bounding box [minX,minY,maxX,maxY]; x -> long, y -> lat
    function getBounds(bounds){
        var bbox = new Array;
        bbox.push(parseFloat(bounds.attr("minlon")));
        bbox.push(parseFloat(bounds.attr("minlat")));
        bbox.push(parseFloat(bounds.attr("maxlon")));
        bbox.push(parseFloat(bounds.attr("maxlat")));
        return bbox;
    }
    geo["bbox"] = getBounds($xml.find("bounds"));

    // Function to set props for a feature
    function setProps(element){
        var properties = {};
        var tags = $(element).find("tag");
        tags.each(function(index, tag){
            properties[$(tag).attr("k")] = $(tag).attr("v");
        });
        return properties;
    }
    // Generic function to create a feature of given type
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
    // Ways
    var $ways = $("way", $xml);
    $ways.each(function(index, ele){
        var feature = new Object;
        // List all the nodes
        var nodes = $(ele).find("nd");
        // If first and last nd are same, then its a polygon
        if($(nodes).last().attr("ref") === $(nodes).first().attr("ref")){
            feature = getFeature(ele, "Polygon");
            feature.geometry.coordinates.push([]);
        }else{
            feature = getFeature(ele, "LineString");
        }
        nodes.each(function(index, nd){
            var node = $xml.find("node[id='"+$(nd).attr("ref")+"']"); // find the node with id ref'ed in way
            var cords = [parseFloat(node.attr("lon")), parseFloat(node.attr("lat"))]; // get the lat,lon of the node
            // If polygon push it inside the cords[[]]
            if(feature.geometry.type === "Polygon"){
                feature.geometry.coordinates[0].push(cords);
            }// if just Line push inside cords[]
            else{
                feature.geometry.coordinates.push(cords);
            }
        });
       // Save the LineString in the Main object
        geo.features.push(feature);
    });
    
    // Points (POI)
    var $points = $("node:has('tag')", $xml);
    $points.each(function(index, ele){
        var feature = getFeature(ele, "Point");
        feature.geometry.coordinates.push(parseFloat($(ele).attr('lon')));
        feature.geometry.coordinates.push(parseFloat($(ele).attr('lat')));
       // Save the point in Main object
        geo.features.push(feature);
    });
    // Finally return the GeoJSON object
    return geo;

};
