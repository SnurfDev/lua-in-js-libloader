
# lua-in-js-libloader
A nodejs library wrapper for lua-in-js.

This is a little project of mine, which allows you to refrence nodejs functions in lua using [lua-in-js](https://github.com/teoxoy/lua-in-js) by [teoxoy](https://github.com/teoxoy).

It currently supports:

 - [x] Constant variables
 - [x] Functions
 - [ ] Classes
 - [ ] async Functions / Promises

Heres an example on how to use it:
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
