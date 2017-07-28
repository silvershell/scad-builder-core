# scad-builder-core
Library to translating JavaScript to .scad code


## Installation

```bash
npm install scad-builder-core
```

## Usage

as Node module :

```javascript

const {
  call, comment, func, generateScad, GeneratorScad, genImportSrc, 
  square, circle, scircle, polygon, 
  cube, sphere, cylinder, polyhedron, 
  union, difference, intersection, 
  translate, scale, rotate, mirror, 
  multmatrix, minkowski, hull, 
  linear_extrude, rotate_extrude, color, text, 
} = require('scad-builder-core');

```


## Example

```javascript

const {
  call, comment, func, generateScad, GeneratorScad, genImportSrc, 
  square, circle, scircle, polygon, 
  cube, sphere, cylinder, polyhedron, 
  union, difference, intersection, 
  translate, scale, rotate, mirror, 
  multmatrix, minkowski, hull, 
  linear_extrude, rotate_extrude, color, text, 
} = require('scad-builder-core');


let p = {
    d: 11.5 + 0.8,
    h: 5 + 0.4,
    l: 10,
}

let ds = p.d*Math.sin(60*Math.PI/180);

let model =
union([
    cylinder({d:p.d, h:p.h, fn:6}),
    translate([0,-ds/2,0], [
        cube([p.l, ds, p.h])
    ]),
])


let genParam = {
    header: "// header : scad-builder-core test ",
    footer: "// footer",
    include: [
        './util.scad',
    ],
    model: model
};

let scadStr = generateScad(genParam);

console.log(scadStr);

```

Result:

```

// header : scad-builder-core test 

include <./util.scad>

union(){
  cylinder(d=12.3,h=5.4,$fn=6);
  translate([0,-5.326056233274298,0]){
    cube([10,10.652112466548596,5.4]);
  }
}

// footer

```


## Copyrights

Some copyrights apply. Copyright (c) 2017 Mitsuaki Fujii (silvershell100@gmail.com), under the MIT license. 


## License

The MIT License (MIT) (unless specified otherwise)
