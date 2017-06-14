Function.prototype.clone = function () {
    var that = this;
    var temp = function temporary() {
        return that.apply(this, arguments);
    };
    for (var key in this) {
        if (this.hasOwnProperty(key)) {
            temp[key] = this[key];
        }
    }
    return temp;
};

const OR = (v1, v2) => v1 || v2();
const AND = (v1, v2) => v1 && v2();

const NOT = fn => {
    let newFn = fn.clone();
    newFn.f = true;
    return newFn;
}

const trina = (function () {
    let data = function () {
        return ['dataFromEvents', ...arguments[0]];
    }

    let asyncLogic = function () {
        let Args = Array.from(arguments);
        let nonFns = Args.map(
            (fn, index) => typeof fn === 'function' ? fn : index + 1)
            .filter(i => typeof i === 'number' ? i : false);
        nonFns.length &&
            (console.log('tracy only goes out with functions...') ||
                console.log('Argument/s: ' + nonFns.join(', ') + ' are not functions.') ||
                console.log("if you have errors don't blame me :(\n"));
        return function (value) {
            Args.unshift(value);
            return new Promise((res, rej) => {
                (function nestedAsyncLogic() {
                    let args = Array.from(arguments);
                    let val = args.shift();
                    let v1 = args.shift();
                    let operator = args.shift();

                    typeof v1 === 'function' ||
                        rej(new Error(v1.toString() + ' is not a function'));

                    function applyLogic(val) {
                        args.unshift(val);
                        return function () {
                            nestedAsyncLogic.apply(null, args);
                        }
                    }

                    function check(bool) {
                        let val = args.shift();
                        args.shift();
                        if (args.length === 0)
                            if (bool) res(val);
                            else rej(val);
                        args.length === 0 ||
                            (function () {
                                let value = args.shift()(bool, applyLogic(val));
                                if (value === true || value === false)
                                    check(bool);
                            })()
                    }

                    function consequence(flag, val) {
                        if (!operator)
                            if (flag) res(val);
                            else rej(val);

                        return operator &&
                            ((function () {
                                let value = operator(flag, applyLogic(val));
                                if (value === true)
                                    check(true);
                                else if (value === false)
                                    check(false);
                            }))()
                    }

                    let exec = (val && val.constructor === Array && val[0] === 'dataFromEvents') ?
                        (() => {
                            val.shift();
                            return v1(...val);
                        })() : v1(val);
                    let i = 0;

                    if (exec && exec.name === 'eventsLogic') {
                        let value = exec();
                        if (value) {
                            i = 1;
                            value(function () {
                                asyncLogic(v1.f ? NOT(data) : data, operator, ...args)(Array.from(arguments))
                                    .then(res, rej);
                            });
                        } else {
                            exec = value;
                        }
                    } else if (i === 0) {
                        exec && exec.then ?
                            exec.then(val =>
                                v1.f ? consequence(false, val) : consequence(true, val),
                                val => v1.f ? consequence(true, val) : consequence(false, val)) :
                            exec ? v1.f ? consequence(false, exec) : consequence(true, exec) :
                                v1.f ? consequence(true, exec) : consequence(false, exec)
                    }
                }).apply(null, Args);
            })
        }
    }

    return asyncLogic;
})();

//browser && node.js compatible
const sleep = time => val => new Promise((res, rej) =>
    (typeof window !== 'undefined' ?
        window.setTimeout : setTimeout)(() => val ? res(val) : rej(val), time * 1000));

const print = text => val => {
    text ? console.log(text) : console.log(val);
    return val ? Promise.resolve(val) : Promise.reject(val);
}

//Node.js only
(typeof global !== 'undefined') &&
    (typeof require !== 'undefined') &&
    (function () {
        const fs = require('fs');
        const http = require('http');
        const https = require('https');
        const EventEmitter = require('events');

        global.trina = trina;
        global.OR = OR;
        global.AND = AND;
        global.NOT = NOT;
        global.sleep = sleep;
        global.readJSON = fileName => new Promise((res, rej) => {
            fs.readFile(fileName, 'utf8', (err, data) => {
                err ? rej(err) : res(JSON.parse(data));
            })
        });
        global.writeJSON = location => data => new Promise((res, rej) => {
            fs.writeFile(location, JSON.stringify(data),
                err => err ? rej(err) : res(data));
        });
        global.on = event => obj => obj.constructor === EventEmitter ?
            function eventsLogic() {
                return fn => obj.on(event, fn);
            } : Promise.reject(obj);
        global.print = print;
        global.download = fileName => link => new Promise((resolve, reject) => {
            (link.includes('https') ? https : http).get(link).on('response', res => {
                let { statusCode } = res;
                let contentType = res.headers['content-type'];
                let error;
                if (statusCode !== 200) {
                    error = new Error(`Request Failed.\n` +
                        `Status Code: ${statusCode}`);
                }
                if (error) {
                    res.resume();
                    reject(error);
                    return;
                }
                let file = fs.createWriteStream(
                    fileName ? fileName.includes('{}') ?
                        fileName.slice(0, -2) + link.slice(link.lastIndexOf('/') + 1) :
                        fileName : link.slice(link.lastIndexOf('/') + 1));
                res.on('data', chunk => {
                    file.write(chunk);
                })
                    .on('end', () => {
                        file.end();
                        resolve(file.path);
                    })
                    .on('error', err => reject(err));
            })
        });
        global.deleteFile = fileName => val => new Promise((res, rej) =>
            fs.unlink(fileName, err => err ? rej(val) : res(val)));
        global.exists = fileName => val => new Promise((res, rej) => {
            fs.stat(fileName, (err, stat) => 
                err ? err.code === 'ENOENT' ? rej(val) : rej(err) :
                res(val))
        })
    })();