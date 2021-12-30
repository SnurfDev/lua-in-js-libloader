
# lua-in-js-libloader

A nodejs library wrapper for lua-in-js.

[![npm](https://img.shields.io/npm/v/lua-libloader)](https://www.npmjs.com/package/lua-libloader)

This is a little project of mine, which allows you to refrence nodejs functions in lua using [lua-in-js](https://github.com/teoxoy/lua-in-js) by [teoxoy](https://github.com/teoxoy).

It currently supports:

 - [x] Constant variables
 - [x] Functions
 - [ ] Classes (Atleast don't throw errors anymore)
 - [x] async Functions / Promises
 - [ ] Events

## Installation
```
npm i lua-libloader
```

## Example
Heres an example on how to use it using os.platform():
```javascript
//import stuff
var lua = require("lua-in-js")
var path = require("path");
var fs = require("fs");
var LibLoader = require("lua-libloader");

//create lua env
var luaEnv = lua.createEnv({
    LUA_PATH:__dirname,
    fileExists: p => fs.existsSync(path.join(__dirname, p)),
    loadFile: p => fs.readFileSync(path.join(__dirname, p), { encoding: 'utf8' }),
    osExit: code => (exitCode += code),
})

//load the libloader and make "os.platform" available for import.
luaEnv.loadLib("libloader",LibLoader([
    "os.platform"
]))

//execute a script which executes "os.platform"
var out = luaEnv.parse(`
local os = libloader.load("os")
local platform = os.platform()
libloader.clear()
return platform
`).exec();

//log the platform
console.log(out);
```

Here is an example using a Promise:
```javascript
//import stuff
var lua = require("lua-in-js")
var path = require("path");
var fs = require("fs");
var LibLoader = require("./libloader/libloader");

//Define sleep function (Promise)
function sleep(ms) {
    return new Promise((res,rej)=>{
        setTimeout(res,ms);
    })
}
//create lua env
var luaEnv = lua.createEnv({
    LUA_PATH:__dirname,
    fileExists: p => fs.existsSync(path.join(__dirname, p)),
    loadFile: p => fs.readFileSync(path.join(__dirname, p), { encoding: 'utf8' }),
    osExit: code => (exitCode += code),
})

// Convert any function to a lib using ObjectToTable()
luaEnv.loadLib("time",LibLoader.ObjectToTable({now:Date.now}))
luaEnv.loadLib("wait",LibLoader.ObjectToTable({sleep}))

/*
execute a script which gets the time, 
executes sleep with 1000ms, and logs the time difference
*/
var out = luaEnv.parse(`
local timestart = time.now();
wait.sleep(1000);
return time.now() - timestart;
`).exec()

//log the time (1003ms on my pc)
console.log(out);
```
