[![Build Status](https://travis-ci.org/Rub21/geojson2osm.svg?branch=master)](https://magnum.travis-ci.com/Rub21/geojson2osm)

https://travis-ci.org/Rub21/geojson2osm.svg?branch=master
## geojson2osm

Convert gejson files to osm file.

## Usage
	
	npm install geojson2osm

Example:

```
geojson2osm file.geojson > file.osm

```

or


```js
var geojson2osm = require('geojson2osm');
var geo = {
    "type": "FeatureCollection",
    "features": [{
          "type": "Feature",
          "properties": {
            "building:colour": #9F8169
			"building:levels":21
			"building":yes
			"height":57
			},
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -434.2249470949173,
              -13.15996269397843
            ],
            [
              -434.2249470949173,
              -13.159751140560356
            ],
            [
              -434.2242631316185,
              -13.159751140560356
            ],
            [
              -434.2242631316185,
              -13.15996269397843
            ],
            [
              -434.2249470949173,
              -13.15996269397843
            ]
          ]
        ]
      }
    }
  ]
}
geojson2osm.geojson2osm(geo);
```

### Testing

```
npm test

```
