var lua = require("lua-in-js");
var funcDict = [];
var deasync = require("deasync");

/**
 * Checks if object is function and which function type
 * @param {*} x The object to check.
 * @returns {"class"|"function"|"async"|null}
 */
var isFunction = x=>typeof x !== 'function'?null:x.hasOwnProperty('arguments')?'function':x.prototype?'class':x.constructor.name=='AsyncFunction'?'async':'function';

/**
 * Runs a promise sync
 * @param {Promise} p The promise
 * @returns {*} The promise response
 * @throws If promise errors
 */
function awaitPromise(p) {
    let done = false;
    let ret;
    let err;
    p.then(arg => {
      done = true;
      ret = arg;
    })
    .catch(e => {
      done = true;
      err = e;
    });
    deasync.loopWhile(() => !done);
    if (err) throw err;
    return ret;
}


/**
 * Create a new loader for nodejs libs in lua
 * 
 *!IMPORTANT! If you dont use the "uses" property,
 * please run LibLoader.clear() at the end of every lua script you execute,
 * in order to prevent a lot of unused garbage piling up in the function dictonary.
 * 
 * @param {String[]?} uses (Optional) The functions which are used by the script.
 * @returns {lua.Table} the lib you can import using loadlib()
 * 
 * @example
 * luaEnv.loadLib("libs",LibLoader([
 *  "fs.readFileSync",
 *  "os.platform"
 * ]));
*/
const LibLoader = function(uses) {
    return eval(`new lua.Table({
        load: (mod) => {
            var args = argv("load",mod);
            var rmod = require(args[0]);
            return ObjectToTable(rmod,(n)=>${uses?JSON.stringify(uses)+'.map(v=>v.includes(n)).includes(true)':"true"},args[0]);
        },
        clear: () => {
            funcDict = [];
            return true;
        }
    })`)
}


/**
 * 
 * @param {Object} obj Any js object
 * @returns {lua.Table|lua.LuaType} The lua object or table
 */
 function ObjectToTable(obj,filter,name) {
    if(obj == null) return null;
    if(obj == undefined) return undefined;
    var out;
    if(filter) {if(!filter(name)) return};
    if(typeof(obj) == "object") {
        var oout = {}; 	
        Object.keys(obj).forEach(v=>{
            var vout = ObjectToTable(obj[v],filter,v);
            oout[v] = vout;
        })
        out = new lua.Table(oout);
    }else if(typeof(obj) == "function") {
        funcDict.push(obj);
        var funcType = isFunction(obj);
        out = eval(`(...args)=>{var res = ${funcType=="class"?"new ":(funcType=="async"?"awaitPromise(":"")}(funcDict[${funcDict.length-1}])(...argv("${obj.name}",...args))${funcType=="async"?")":""};if(res instanceof Promise){return ObjectToTable(awaitPromise(res))}else{return ObjectToTable(res)}}`);
    }
    else{
        out = obj;
    }
    return out;
}


/**
 * 
 * @param {String} func The lua function
 * @param {any} args The arguments in an array
 */
function argv(func,...args) {
    var parsed = [];
    args.forEach((arg,i)=>{
        switch(lua.utils.type(arg)) {
            case "string":
                parsed[i] = lua.utils.coerceArgToString(arg,func,i+1)
                break;
            case "number":
                parsed[i] = lua.utils.coerceArgToNumber(arg,func,i+1)
                break;
            case "boolean":
                parsed[i] = lua.utils.coerceToBoolean(arg,func,i+1)
                break;
            case "table":
                parsed[i] = lua.utils.coerceArgToTable(arg,func,i+1)
                break;
            case "function":
                parsed[i] = lua.utils.coerceArgToFunction(arg,func,i+1)
                break;
            default:
                
                parsed[i] = null;
                break;
            
        }
    })
    return parsed;
}

module.exports = LibLoader;
module.exports.ObjectToTable = ObjectToTable;
