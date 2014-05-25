var expect = require('chai').expect;
var compile = require('..').compile;

describe('ES6Class', function() {
  function transform(code) {
    return compile(code).code;
  }

  function expectTransform(code, result) {
    expect(transform(code)).to.eql(result);
  }

  it('should fix class declaration', function() {
    var code = [
      'class Hello {',
      '  constructor(name) {',
      '    this.name = name;',
      '  }',
      '',
      '  hello() {',
      '    return "Hello " + this.name + "!";',
      '  }',
      '}',
      '',
      'class HelloWorld extends Hello {',
      '  constructor() {',
      '    super("World");',
      '  }',
      '',
      '  echo() {',
      '    alert(super.hello());',
      '  }',
      '}',
      '',
      'var hw = new HelloWorld();',
      'hw.echo();'
    ].join('\n');

    var result = [
      'var Hello = function() {',
      '  var Hello = function Hello(name) {',
      '    this.name = name;',
      '  };',
      '',
      '  Hello.prototype.hello = function hello() {',
      '    return "Hello " + this.name + "!";',
      '  };',
      '',
      '  return Hello;',
      '}();',
      '',
      'var HelloWorld = function() {',
      '  var HelloWorld = function HelloWorld() {',
      '    Hello.call(this, "World");',
      '  };',
      '',
      '  var HelloWorldPrototype = function() {};',
      '  HelloWorldPrototype.prototype = Hello.prototype;',
      '  HelloWorld.prototype = new HelloWorldPrototype();',
      '  HelloWorld.prototype.constructor = HelloWorld;',
      '',
      '  HelloWorld.prototype.echo = function echo() {',
      '    alert(Hello.prototype.hello.call(this));',
      '  };',
      '',
      '  return HelloWorld;',
      '}();',
      '',
      'var hw = new HelloWorld();',
      'hw.echo();'
    ].join('\n');

    expectTransform(code, result);

    var output = '';
    function alert(data) { output += data; }
    eval(result);
    expect(output).to.eql('Hello World!');
  });
});
