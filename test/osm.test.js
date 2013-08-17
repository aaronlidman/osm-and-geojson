function against(name, done) {
    reqwest('data/' + name + '.xml', function(xml) {
        reqwest('data/' + name + '.json', function(json) {
            expect(osm_geojson.osm2geojson(xml)).to.eql(json);
            done();
        });
    });
}

function againstXML(name, done) {
    reqwest('data/' + name + '.json', function(json) {
        reqwest('data/' + name + '.xml', function(xml) {
            expect(osm_geojson.geojson2osm(json))
                .to.eql(new XMLSerializer().serializeToString(xml));
            done();
        });
    });
}

describe('osm to geojson', function() {
    it('parses blank osm into geojson', function() {
        expect(osm_geojson.osm2geojson('<osm></osm>')).to.eql({
            type: 'FeatureCollection',
            features: []
        });
    });

    it('parses example osm into geojson', function(done) {
        against('map', done);
    });

    it('parses example osm 2 into geojson', function(done) {
        against('map2', done);
    });
});

describe('geojson to osm', function() {
    it('simple map', function(done) {
        againstXML('map_simple', done);
    });
});
