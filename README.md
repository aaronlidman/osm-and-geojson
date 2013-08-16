### osm & geojson

- Converts [OSM XML](http://wiki.openstreetmap.org/wiki/OSM_XML) to [GeoJSON](http://www.geojson.org/)
- A fork of [OSM2GEO by tecoholic](https://gist.github.com/tecoholic/1396990), this version contains significant improvements
    - removed jQuery dependency
    - quicker loops
    - node caching

original OSM2GEO | this version | difference
--- | --- | ---
299.013ms   | 21.145ms  | +14.14x
11476.108ms | 123.353ms | +93.03x (~5 square miles)
843.194ms   | 37.430ms  | +22.53x
1463.834ms  | 47.444ms  | +30.85x
431.721ms   | 28.938ms  | +14.92x
(using random areas around Los Angeles County from xapi)

- Converts GeoJSON to OSM xml
- __warning__: only points, polygons, and multipolygons (standalone or in feature collections) are supported right now
    - it would be pretty easy to add the rest, I just don't have a need for them right now

### usage

Include `osm_geojson.js` in your page for a browser, or

    npm install osm-and-geojson

### api

```js
osm_geojson.osm2geojson(osmXmlStringOrDOM)
```

Parse and convert a string of OSM XML to a GeoJSON object.

```js
osm_geojson.geojson2osm(GeoJSONObject)
```

Parse and convert a GeoJSON object into OSM XML.

### [WTFPL License](http://en.wikipedia.org/wiki/WTFPL)
