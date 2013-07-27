###osm2geo.js
- Converts OSM xml to GeoJSON
- Coverts tags to properties
- A fork of [OSM2GO by tecoholic](https://gist.github.com/tecoholic/1396990) this version contains significant improvements
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

###geo2osm.js
- Converts GeoJSON to OSM xml
- __warning__: only points, polygons and multipolygons, standalone or in feature collections, are supported right now
    - it would be pretty easy to add the rest, I just don't have a need for them right now