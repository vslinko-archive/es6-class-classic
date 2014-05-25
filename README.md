# es6-class-classic

Compiles JavaScript written using ES6 classes to ES4 syntax.
For example, this:

```js
class Hello {
  constructor(name) {
    this.name = name;
  }

  hello() {
    return "Hello " + this.name + "!";
  }
}

class HelloWorld extends Hello {
  constructor() {
    super("World");
  }

  echo() {
    alert(super.hello());
  }
}

var hw = new HelloWorld();
hw.echo();
```

compiles to this:

```js
var Hello = function() {
  var Hello = function Hello(name) {
    this.name = name;
  };

  Hello.prototype.hello = function hello() {
    return "Hello " + this.name + "!";
  };

  return Hello;
}();

var HelloWorld = function() {
  var HelloWorld = function HelloWorld() {
    Hello.call(this, "World");
  };

  var HelloWorldPrototype = function() {};
  HelloWorldPrototype.prototype = Hello.prototype;
  HelloWorld.prototype = new HelloWorldPrototype();
  HelloWorld.prototype.constructor = HelloWorld;

  HelloWorld.prototype.echo = function echo() {
    alert(Hello.prototype.hello.call(this));
  };

  return HelloWorld;
}();

var hw = new HelloWorld();
hw.echo();
```

## Install

```
$ npm install es6-class-classic
```

## Browserify

Browserify support is built in.

```
$ npm install es6-class-classic  # install local dependency
$ browserify -t es6-class-classic $file
```

### Setup

First, install the development dependencies:

```
$ npm install
```

Then, try running the tests:

```
$ npm test
```
