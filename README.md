# trina

trina is creative alternative to handle asynchronous code in JavaScript by treating Promises as booleans.

## Why?

trina removes the complexity of dealing with Promise rejections and those annoying unhandled promise rejections by turning your code into asynchronous logic expressions. trina makes your code logically pure and error-proof.

## How?

 Let a, b and c be functions that return true or false.
 ```javascript
 let a = () => true;
 let b = () => false;
 let c = () => true; 

 (a() && b()) || c()  //-> true
 !(a() || b()) && c() //-> false
 ```
 Now let a, b and c be functions that return a Promise which either resolves (true) or rejects (false).

 ```javascript
 let a = () => Promise.resolve('i');
 let b = value => Promise.reject(value + ' love');
 let c = value => Promise.resolve(value + ' trina');

 trina(a, AND, b, OR, c)(null)             //->resolves (true) with "i love trina"
 trina(NOT(trina(a, OR, b)), AND, c)(null) //->rejects (false) with "i"
 ```

 ## Getting started

 ### Installing

 ```
 npm install trina
 ```

 ```javascript
 require('trina');
 ```

 To use in the browser simply include trina.js as the source file. Node.js related functions will not work. Only 'print' and 'sleep' can be used in the browser.

 **Note**
 
 By default trina assigns a number of functions such as trina, AND, OR, NOT, etc to the global variable. Make sure to get rid of any confliciting variable names.

 trina accepts a series of functions that must be seperated by 'AND' or 'OR'. A function may return a Promise. If the Promise resolves it's treated as true whereas a Promise rejection is treated as false. The value resolved or rejected by a Promise is passed as an arugument to the next function (similar to function composition).

 ```javascript
 trina(
     v => Promise.resolve(val + ' is'), AND, 
     v => Promise.resolve(v + ' awesome!')
)(/*Value passed to the first function:*/'Trina')
.then(v => /*Promise resolves with 'trina is awesome!'*/console.log(v));
```

Keep in mind that everything is 100% asynchronous. The second function after 'AND' is invoked after the first Promise has resolved.

When invoked, trina returns a function that accepts an argument and returns a Promise, hence it can be used as a parameter.

```javascript
trina(
    n => Promise.resolve(n + ' loves'), AND,
    trina(
        n => Promise.reject(n + ' hanging out'), OR,
        n => Promise.resolve(n + ' with')
    ), AND,
    n => Promise.resolve(n + ' trina.')
)('tracy')
//resolves with 'tracy loves hanging out with trina.'
.then(v => console.log(v));
```

Besides Promises, functions may return anything else. A truthy value (any value which is not false, 0, "", null, undefined and NaN) is treated as true whereas a falsy value is treated as false. You can use trina to solve any problem.

```javascript
trina(
    v => v === 1, AND,
    () => 'blonde', OR,
    () => 'brunette', AND,
    v => 'Trina is ' + v
)(1)
//resolves to 'Trina is blonde'
.then(v => console.log(v));
```

To simulate negation simply use 'NOT'. A resolved Promise will act as though it rejected and vice-versa.

```javascript
trina(
    NOT(n => Promise.resolve(n + ' does not like')), AND,
    n => Promise.resolve(n + ' peter.'), OR,
    n => Promise.resolve(n + ' josh.')
)('tracy')
//resolves to 'tracy does not like josh.'
.then(v => console.log(v));
```

### **Improtant**

Both JavaScript and trina evaluate their expressions in a left-to-right fashion so you may expect the following to return false:

```javascript
console.log(true || false && false); //->true
```

To work as expected the above statement must include parenthesis:

```javascript
console.log((true || false) && false); //->false
```

With trina you don't have to worry about parenthesis or blocks:

```javascript
trina(() => true, OR, () => false, AND, () => false)(null)
//will print 'rejected'
.then(() => console.log('resolved'), () => console.log('rejected'));
```

## Simple Error handling

```javascript
trina(
    //a series of asynchronous functions:
    login, AND,
    sendReqestToServer, AND,
    processResponse, AND,
    writeToDOM, 

    //if any of the above fail (reject) handle error
    OR,
    err => handleError(err)
)
```

## Debugging

The print function helps in debugging. When called without any parameters, print logs the returned/resolved/rejected value of the previous function and returns that same value. Note that if the value passed to print is falsy, even if the value came from a resolved Promise, print will return a rejected Promise with the value.

```javascript
trina(
    v => Promise.reject('hey ' + v), OR,
    print(), AND,
    v => Promise.resolve('bye'), AND,
    print(), AND,
    () => Promise.resolve(), AND,
    print()
)('tracy')
//rejectes with undefined

//will log: hey tracy, bye, undefined
```
If you pass a string to print, print will act as before but instead log that string to the console.

```javascript
trina(
    doesSomething, AND,
    print('that something is done'), AND,
    doSomethingElse
)()
```

## sleep

The sleep function is nothing more than syntatic sugar for the infamous setTimeout. Simply call sleep with the number of seconds to sleep. sleep returns the value passed to it like print.

```javascript
trina(
    () => Promise.resolve('hey'), AND,
    sleep(3), AND, //sleeps for 3s (asynchronous)
    v => v + ' trina'
)()
//resolves with 'hey trina'
```

## writeJSON

writeJSON saves a JavaScript oject to a JSON file asynchronously. writeJSON resolves with the JavaScript object passed to it or rejects with an error if an error occures.

```javascript
trina(
    () => ({name: 'Tracy', friends: ['Trina', 'Peter']}), AND, //object to save
    writeJSON('./someFile.json'), AND,
    continueWorkingWithObject, OR,
    err => console.log(err) //if an error occured handle it
)()
```

## readJSON

readJSON reads a JSON file asynchronously and resolves with a parsed JSON file. If an error occures readJSON rejects with the error.

```javascript
trina(
    () => './someFile.json', AND,
    readJSON, AND,
    obj => workWithObject(obj)
)()
```

## deleteFile

deleteFile accepts the location of a file and deletes it. deleteFile resolves with the value passed to it and rejects with an error if an error occured while deleting.

```javascript
trina(
    () => Promise.reolve('hello'), AND,
    deleteFile('./someFile.json'), AND,
    print(), OR,
    handleError
)()
//if successful deletion prints: 'hello'
```

## exists

exists checks if a file exists simply by passing the location of a file. If a file exists, exists resolves with the value passed to it. If a file doesn't exist, exists rejects with the value passed to it. If some other error occured, exists rejects with the error.

```javascript
trina(
    () => Promise.resolve('Tracy gossips'), AND,
    exists('./someFile.json'), OR,
    
    //file doesn't exist so exists rejects with 'Tracy gossips'
    print()
)()
```

## download

The download function downloads a file from a webserver asynchronously and saves it in a location of your choice. download resolves with the path of the file and rejects with an error if an error occured.

```javascript
//downloads an html page to a file called page.html in the app directory
trina(
    () => 'https://github.com/LukeEllul', AND,
    download('page.html')
)()

//downloads the image in a file called microsoft.jpg in the app directory
trina(
    () => 'https://tctechcrunch2011.files.wordpress.com/2016/07/microsoft.jpg', AND,
    download(), AND,
    print()
)()

//downloads the image in in a file called microsoft.jpg in some other directory
trina(
    () => 'https://tctechcrunch2011.files.wordpress.com/2016/07/microsoft.jpg', AND,
    download('/someFolder/someOtherFolder/{}')
)()
```

## Handling events

Events may be handled using the on function as demonstrated in the following example:

```javascript
const EventEmitter = require('events');
const event = new EventEmitter();

trina(
    () => event, AND,
    on('message'), AND,
    //whenever a message is emitted the following functions 
    //will execute

    //traditional callback function goes here
    (n1, n2) => n1 + n2, AND, 
    print()
)()
//the promise is resolved or rejected only once
.then(n => console.log('im called only once'))

//emits an event (message) every 3 seconds
const emitMsg = () =>
    trina(
        () => event.emit('message', 2, 3), AND,
        sleep(3),
        emitMsg
    )()

emitMsg();

/*output:
5
im only called once
5
5
5
.
.
```

If the 'on' function is passed an object which is not of type EventEmitter, on rejects with the passed object. 

To really understand how 'on' works it's best to copy the above example and try it locally.