'use strict'

import tap from 'tap'
var test = tap.test
import { wrap, unwrap, massWrap, massUnwrap } from '../index.js'

var outsider = 0
function counter() { return ++outsider }
function anticounter() { return --outsider }

var generator = {
  inc: counter
}
Object.defineProperty(generator, 'dec', {
  value: anticounter,
  writable: true,
  configurable: true,
  enumerable: false
})

test('should wrap safely with named export in esm', function (t) {
  t.plan(12)

  t.equal(counter, generator.inc, 'method is mapped to function')
  t.doesNotThrow(function () { generator.inc() }, 'original function works')
  t.equal(1, outsider, 'calls have side effects')

  var count = 0
  function wrapper(original, name) {
    t.equal(name, 'inc')
    return function () {
      count++
      var returned = original.apply(this, arguments)
      count++
      return returned
    }
  }
  wrap(generator, 'inc', wrapper)

  t.ok(generator.inc.__wrapped, "function tells us it's wrapped")
  t.equal(generator.inc.__original, counter, 'original function is available')
  t.doesNotThrow(function () { generator.inc() }, 'wrapping works')
  t.equal(2, count, 'both pre and post increments should have happened')
  t.equal(2, outsider, 'original function has still been called')
  t.ok(generator.propertyIsEnumerable('inc'),
    'wrapped enumerable property is still enumerable')
  t.equal(Object.keys(generator.inc).length, 0,
    'wrapped object has no additional properties')

  wrap(generator, 'dec', function (original) {
    return function () {
      return original.apply(this, arguments)
    }
  })

  t.ok(!generator.propertyIsEnumerable('dec'),
    'wrapped unenumerable property is still unenumerable')
})

test('should properly import each named export', function (t) {
  t.plan(4)

  t.ok(wrap, 'wrap should be imported')
  t.ok(unwrap, 'unwrap should be imported')
  t.ok(massWrap, 'massWrap should be imported')
  t.ok(massUnwrap, 'massUnwrap should be imported')
})
