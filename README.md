## OSM & GeoJSON

- Converts [OSM XML](http://wiki.openstreetmap.org/wiki/OSM_XML) to [GeoJSON](http://www.geojson.org/)
- Also converts the inverse, GeoJSON to OSM XML
- This is a fork of [OSM2GEO by tecoholic](https://gist.github.com/tecoholic/1396990) with some improvements
    - vanilla JS, no dependencies
    - multipolygon support
    - browser or nodejs
- __warning:__ When converting GeoJSON to OSM XML only points, polygons, and multipolygons (standalone or in feature collections) are supported right now

## Usage
- for the browser
    - `<script src='osm_geojson.js'></script>`
- for nodejs
    - `npm install osm-and-geojson`

## API

- ####`osm_geojson.osm2geojson(osmXmlStringOrDOM)`
    - Parse and convert a string of OSM XML to a GeoJSON object. Add an optional second argument of `true`, `osm_geojson.osm2geojson(yourOsm, true)` to include metadata about the item in the properties, namespaced `osm_*`.

- ####`osm_geojson.geojson2osm(GeoJSONObject)`
    - Parse and convert a GeoJSON object into OSM XML.

---
OSM & GeoJSON was written in the [Orange Public Library](http://www.flickr.com/photos/twobears2/5163373046/in/set-72157625352078650). Always upstairs, the window seats are awesome but really tough to get. More often than not I'd get stuck with one of the middle tables where foot traffic was a bit much and outlets are hard to come by.
