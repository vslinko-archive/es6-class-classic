var esprima = require('esprima');
var recast = require('recast');
var through = require('through');
var b = recast.types.builders;
var n = recast.types.namedTypes;

function dump(a) { console.log(require('util').inspect(a, {depth: 1000})); }

var ES6ClassSuperCall = recast.Visitor.extend({
  init: function(superClass) {
    this.superClass = superClass;
  },

  visitCallExpression: function(expr) {
    var args;

    if (n.Identifier.check(expr.callee) && expr.callee.name == 'super') {
      args = expr.arguments.concat();
      args.unshift(b.thisExpression());

      return b.callExpression(
        b.memberExpression(
          this.superClass,
          b.identifier('call'),
          false
        ),
        args
      );
    } else if (n.MemberExpression.check(expr.callee) && n.Identifier.check(expr.callee.object) && expr.callee.object.name == 'super') {
      args = expr.arguments.concat();
      args.unshift(b.thisExpression());

      return b.callExpression(
        b.memberExpression(
          b.memberExpression(
            b.memberExpression(
              this.superClass,
              b.identifier('prototype'),
              false
            ),
            expr.callee.property,
            false
          ),
          b.identifier('call'),
          false
        ),
        args
      );
    }

    this.genericVisit(expr);
  }
});

var ES6Class = recast.Visitor.extend({
  visitClassDeclaration: function(expr) {
    var constructorMethod = expr.body.body.filter(function(method) {
      return method.key.name == 'constructor';
    }).shift();

    var constructorFunction;
    if (constructorMethod) {
      constructorFunction = constructorMethod.value;
    } else {
      constructorFunction = b.functionExpression(
        expr.id,
        [],
        b.blockStatement([])
      );
    }

    var body = [];
    body.push(b.variableDeclaration(
      'var',
      [b.variableDeclarator(
        expr.id,
        b.functionExpression(
          expr.id,
          constructorFunction.params,
          constructorFunction.body
        )
      )]
    ));

    if (expr.superClass) {
      var prototypeConstructorName = expr.id.name + 'Prototype';

      body = body.concat([
        b.variableDeclaration(
          'var',
          [b.variableDeclarator(
            b.identifier(prototypeConstructorName),
            b.functionExpression(
              null,
              [],
              b.blockStatement([])
            )
          )]
        ),
        b.expressionStatement(
          b.assignmentExpression(
            '=',
            b.memberExpression(
              b.identifier(prototypeConstructorName),
              b.identifier('prototype'),
              false
            ),
            b.memberExpression(
              expr.superClass,
              b.identifier('prototype'),
              false
            )
          )
        ),
        b.expressionStatement(
          b.assignmentExpression(
            '=',
            b.memberExpression(
              expr.id,
              b.identifier('prototype'),
              false
            ),
            b.newExpression(
              b.identifier(prototypeConstructorName),
              []
            )
          )
        ),
        b.expressionStatement(
          b.assignmentExpression(
            '=',
            b.memberExpression(
              b.memberExpression(
                expr.id,
                b.identifier('prototype'),
                false
              ),
              b.identifier('constructor'),
              false
            ),
            expr.id
          )
        )
      ]);
    }

    expr.body.body.filter(function(method) {
      return method.key.name != 'constructor';
    }).forEach(function(method) {
      body.push(b.expressionStatement(
        b.assignmentExpression(
          '=',
          b.memberExpression(
            b.memberExpression(
              expr.id,
              b.identifier('prototype'),
              false
            ),
            method.key,
            false
          ),
          b.functionExpression(
            method.key,
            method.value.params,
            method.value.body
          )
        )
      ));
    });

    body.push(b.returnStatement(expr.id));

    var newExpr = b.variableDeclaration(
      'var',
      [b.variableDeclarator(
        expr.id,
        b.callExpression(
          b.functionExpression(
            null,
            [],
            b.blockStatement(body)
          ),
          []
        )
      )]
    );

    // visit child classes before visit super calls
    this.genericVisit(newExpr);

    var superClass = expr.superClass || b.identifier('Object');
    (new ES6ClassSuperCall(superClass)).genericVisit(newExpr.declarations[0].init.callee);

    return newExpr;
  }
});

function transform(ast) {
  (new ES6Class()).visit(ast);
  return ast;
}

function compile(code, options) {
  options = options || {};

  var recastOptions = {
    esprima: esprima,
    sourceFileName: options.sourceFileName,
    sourceMapName: options.sourceMapName
  };

  var ast = recast.parse(code, recastOptions);
  return recast.print(transform(ast), recastOptions);
}

module.exports = function () {
  var data = '';

  function write(buf) {
    data += buf;
  }

  function end() {
    this.queue(compile(data).code);
    this.queue(null);
  }

  return through(write, end);
};

module.exports.transform = transform;
module.exports.compile = compile;
