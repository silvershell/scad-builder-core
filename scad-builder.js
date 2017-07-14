
/*
// #scad-builder:start
const {
  call, generateScad, GeneratorScad, genImportSrc, square, circle, scircle, polygon, cube, sphere, cylinder, polyhedron, union, difference, intersection, translate, scale, rotate, mirror, multmatrix, minkowski, hull, linear_extrude, rotate_extrude, color, text, 
} = require('../scad-builder');
// #scad-builder:end
*/

const _ = require('lodash')


function _model(type,name,param,block){
    // return [name,param,block];
    return {
        n: name,
        t: type,
        p: param,
        b: block,
    }
}

function call(name,param,block){
    return _model("c",name,param,block);
}

function comment(str){
    return _model("m",'comment',str);
}


function func(name,param,block){
    return _model("f",name,param,block);
}



class Generator {

    constructor(){
    }

    /**
     * This function check and format adjust for model.
     * 
     * model.n : string. not null
     * model.t : c,p,b or pb
     * model.p : array or object or undefined
     * model.b : array of model object or undefined
     * 
     * @param {object} model 
     */
    compile(model){
        if( _.isFunction(model.model) ){
            model.model = model.model();
        }
        
        if( !_.isArray(model.model) ){
            model.model = [model.model]
        }
        for( let m of model.model ){
            this._compile(m);
        }

        this.model = model;

        return model;
    }

    _compile(model){
        // check --------

        if( typeof model.n === "undefined" ){
            throw "'n' must be not empty."
        }
        if( !_.isString(model.n) || model.n.length < 1 ){
            throw "'n' must be string."
        }

        if( typeof model.t === "undefined" ){
            throw "'t' must be not empty."
        }
        if( model.t != 'c' && model.t != 'm' && model.t != 'f' 
            && model.t != 'p' && model.t != 'b' && model.t != 'pb' )
        {
            throw "'t' is illegal. t:" + model.t
        }


        let isP, isB;

        if( model.t == 'c' ){
            isP = true;

        }else if( model.t == 'm' ){
            isP = true;

        }else if( model.t == 'f' ){
            isP = true;
            isB = true;

        }else if( model.t == 'p' ){
            isP = true;

        }else if( model.t == 'b' ){
            isB = true;
            
        }else if( model.t == 'pb' ){
            isP = true;
            isB = true;
        }
        
        if( isP ){
            if( typeof model.p !== "undefined" ){

                if( _.isString(model.p) || _.isNumber(model.p) || _.isBoolean(model.p) ){
                    model.p = [model.p];
                }else if( _.isArray(model.p) || _.isObject(model.p) ){
                }else{
                    throw "param format error"
                }
            }
        }else{
            if( typeof model.p !== "undefined" ){
                throw "'p' for '" + model.n + "' must be undefined ."
            }
        }

        if( isB ){
            if( typeof model.b === "undefined" ){
                model.b = [];

            }else if( _.isArray(model.b) ){
                for( let ent of model.b ){
                    if( !_.isObject(model.b) ){
                        throw 'Array entry of block must be object.'
                    }
                }

            }else if( _.isString(model.b) || _.isNumber(model.b) || _.isBoolean(model.b) ){
                throw "Block must be array or model object"

            }else if( _.isObject(model.b) ){
                model.b = [model.b];

            }else{
                throw "Unknown error."
            }
        }else{
            if( typeof model.b !== "undefined" ){
                throw "'p' for '" + model.n + "' must be undefined ."
            }
        }
        
        // ------------
        // model.n : string. not null
        // model.t : c,m,p,b or pb
        // model.p : array or object or undefined
        // model.b : array of model object or undefined

        // ------------

        let blk = model.b;
        if( blk ){
            for( let ent of blk ){
                this._compile(ent);
            }
        }
    }

    setModel(model){
        model = this.compile(model);
        this.model = model;
    }
}


class GeneratorScad extends Generator 
{    
    generate(){
        if( typeof this.model === "undefined" ){
            throw 'model is not set.';
        }

        let model = this.model;

        let code = [];

        if( typeof model.header !== "undefined" ){
            code.push(model.header);
        }

        if( typeof model.include !== "undefined" ){
            code.push('');

            let include = model.include;
            if( typeof include == 'string' ){
                include = [include];
            }
            for( let ent of include ){
                code.push('include <' + ent + '>');
            }
            code.push('');
        }

        if( typeof model.model !== "undefined" ){
            for( let m of model.model ){
                this._genModel(code,0,m);
                code.push('');
            }
        }

        if( typeof model.footer !== "undefined" ){
            code.push(model.footer);
        }

        let s = code.join("\n");
        return s;
    }

    _genParam(p){
        let ps = '';
        
        if( _.isNumber(p) ){
            ps = p;

        }else if( _.isBoolean(p) ){
            ps = p ? 'true' : 'false';

        }else if( _.isString(p) ){
            ps = JSON.stringify(p);

        }else if( _.isArray(p) ){
            ps = '[';

            for( let i in p ){
                if( i != 0 ){
                    ps += ','
                }
                ps += this._genParam(p[i]);
            }

            ps += ']';

        }else{
            throw "'" +p+ "' is illegal value as OpenSCAD";
        }

        return ps;
    }

    _genModel(code,lv,model){
        let lvs = _.repeat('  ', lv);

        if( model.t == 'm' ){
            if( !model.p ){
                return;
            }
            let str = model.p[0];
            str = str.replace('*/','-/');
            str = lvs + '/* ' + str + ' */'
            code.push(str);
            return;
        }

        // Param -----

        let ps = '';

        let p = model.p;
        if( p == undefined ){
            ps = '';

        }else if( _.isNumber(p) || _.isBoolean(p) || _.isString(p) || _.isArray(p) ){
            if( model.t == 'f' ){
                throw 'function param must be Object or undefined.'
            }
            ps = this._genParam(p);

        }else if( _.isObject(p) ){

            let keys = Object.keys(p);

            for( let i=0; i<keys.length; i++ ){
                if( i != 0 ){
                    ps += ','
                }
                
                let k = keys[i];
                ps += k +'='+ this._genParam( p[k] );
            }
        }

        // ------------

        let s = ''
        
        if( model.t == 'f' ){
            if( lv > 0 ){
                throw "function be defined in only top level."
            }
            s += 'module '
        }

        s += lvs + model.n + '(' + ps + ')';
        let blk = model.b;
        if( blk ){
            if( !_.isArray(blk) ){
                throw 'Block entry must be Array';
            }

            s += '{';
            code.push(s);
            
            for( let ent of blk ){
                this._genModel(code, lv+1, ent);
            }

            code.push(lvs + '}');

        }else{
            s += ';';
            code.push(s);
        }
    }
}



function generateScad(model){

    let generator = new GeneratorScad();
    
    generator.setModel(model);
    
    return generator.generate();
}





// function generateJScad(model){

//     let generator = new GeneratorJSCAD();
    
//     generator.setModel(model);
    
//     return generator.generate();
// }


function genImportSrc(){
    let s = "";

    s += "// #scad-builder:start\n";
    s += "const {\n  ";

    let l = Object.keys(module.exports);
    for( let n of l ){
        s += n + ", ";
    }

    s += "\n} = require('../scad-builder');\n";
    s += "// #scad-builder:end\n";

    console.log(s);
}


// 0: param only.
// 1: param and block.
// 2: block only
let apiDef = [
  // primitives2d
  {
    "n": "square",
    "t": 0
  },
  {
    "n": "circle",
    "t": 0,
    "fn": "circle",
    "pt": [
        ["fn", "$fn"],
    ]
  },
  {
    "n": "scircle",
    "t": 0,
    "fn": "circle",
    "pt": [
        ["fn", "$fn"],
    ]
  },
  {
    "n": "polygon",
    "t": 0
  },

  // primitives3d
  {
    "n": "cube",
    "t": 0
  },
  {
    "n": "sphere",
    "t": 0,
    "pt": [
        ["fn", "$fn"],
    ]
  },
  {
    "n": "cylinder",
    "t": 0,
    "pt": [
        ["fn", "$fn"],
    ]
  },
  {
    "n": "polyhedron",
    "t": 0
  },

  // booleanOps
  {
    "n": "union",
    "t": 2
  },
  {
    "n": "difference",
    "t": 2
  },
  {
    "n": "intersection",
    "t": 2
  },

  // transformations
  {
    "n": "translate",
    "t": 1
  },
  {
    "n": "scale",
    "t": 1
  },
  {
    "n": "rotate",
    "t": 1
  },
  {
    "n": "mirror",
    "t": 1
  },
  {
    "n": "multmatrix",
    "t": 1
  },
  {
    "n": "minkowski",
    "t": 2
  },
  {
    "n": "hull",
    "t": 2
  },

  // extrusions
  {
    "n": "linear_extrude",
    "t": 1,
    "pt": [
        ["h", "height"],
    ]
  },
  {
    "n": "rotate_extrude",
    "t": 1,
    "pt": [
        ["fn", "$fn"],
        ["h", "height"],
    ]
  },

  // color
  {
    "n": "color",
    "t": 1
  },

  // text
  {
    "n": "text",
    "t": 1
  }
]


function transParam(p, transTable){
    if( !transTable ){
        return
    }
    
    for( let t of transTable ){
        if( p[t[0]] != undefined ){
            p[t[1]] =  p[t[0]];
            delete p[t[0]];
        }
    }
}

// ------------

let api = {
    call,
    comment,
    func,
    generateScad,
    GeneratorScad,
    // GeneratorJSCAD,
    genImportSrc,
};

for( let ent of apiDef ){
    let n = ent.n;
    let fn = ent.fn ? ent.fn : ent.n;
    let t = ent.t;

    if( t == 1 ){
        api[n] = function(param,block){
            transParam(param, ent.pt)
            return _model("pb", fn, param, block);
        };

    }else if( t == 2 ){
        api[n] = function(block){
            return _model("b", fn, undefined, block);
        };

    }else{
        api[n] = function(param){
            transParam(param, ent.pt)
            return _model("p", fn, param);
        };
    }
}



module.exports = api;
