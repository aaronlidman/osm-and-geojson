The original OSM2GEO was a bit slow for my needs so I spent some time improving it today.
original: https://gist.github.com/tecoholic/1396990

###Improvements
- general syntax cleanup
- removed jQuery dependency
- quicker loops
- node caching

###Benchmarks
```
original    | improved  | difference
--------------------------------
299.013ms   | 21.145ms  | +14.14x 
11476.108ms | 123.353ms | +93.03x (~5 square miles)
843.194ms   | 37.430ms  | +22.53x
1463.834ms  | 47.444ms  | +30.85x
431.721ms   | 28.938ms  | +14.92x
```
(using random areas around Los Angeles County from xapi)

aaronlidman@gmail.com