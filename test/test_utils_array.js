'use strict';

const assert = require('chai').assert;
const utilsArray = require('../src/utils/array');

describe('Test utils/array module', () => {
  describe('difference of two arrays', () => {
    it('should return the difference of two arrays', () => {
      assert.deepEqual(utilsArray.diff([1, 2, 3], [1]), [2, 3]);
      assert.deepEqual(utilsArray.diff([1, 2, 3], [2]), [1, 3]);
      assert.deepEqual(utilsArray.diff([1, 2, 2, 3], [2]), [1, 3]);
      assert.deepEqual(utilsArray.diff([1, 2, 2, 3], [1, 2, 2]), [3]);
    });
  });
  describe('remove one element from an array', () => {
    it('should return the array without the first match of element', () => {
      assert.deepEqual(utilsArray.remove([1, 2, 3], 1), [2, 3]);
      assert.deepEqual(utilsArray.remove([1, 2, 3], 2), [1, 3]);
      assert.deepEqual(utilsArray.remove([1, 2, 2, 3], 2), [1, 2, 3]);
      assert.deepEqual(utilsArray.remove([1, 2, 3], 4), [1, 2, 3]);
    });
  });
  describe('flatten nested arrays', () => {
    it('should return the flattened array or empty array if arguments empty', () => {
      assert.deepEqual(utilsArray.flatten([1, [2, [3, [4]]]]), [1, 2, 3, 4]);
      assert.deepEqual(utilsArray.flatten(0, [1, [2, [3, [4]]]]), [0, 1, 2, 3, 4]);
      assert.deepEqual(utilsArray.flatten([1, 2], [3, 4], 5), [1, 2, 3, 4, 5]);
      assert.deepEqual(utilsArray.flatten([[[[1], 2], 3], 4]), [1, 2, 3, 4]);
      assert.deepEqual(utilsArray.flatten([[[[1], 2], 3], 4]), [1, 2, 3, 4]);
      assert.deepEqual(utilsArray.flatten([1]), [1]);
      assert.deepEqual(utilsArray.flatten(1), [1]);
      assert.deepEqual(utilsArray.flatten([]), []);
      assert.deepEqual(utilsArray.flatten(), []);
    });
  });
  describe('return last element of array', () => {
    it('should return the last element of an array', () => {
      assert.equal(utilsArray.last([0]), 0);
      assert.equal(utilsArray.last([0, 1, 2]), 2);
    });
  });
  describe('test default comparator', () => {
    it('should return -1 0 or +1 when comparing two number values', () => {
      const greater = 13;
      const smaller = 7;
      assert.ok(utilsArray.defaultCompare(smaller, greater) < 0);
      assert.ok(utilsArray.defaultCompare(greater, smaller) > 0);
      assert.equal(utilsArray.defaultCompare(smaller, smaller), 0);
    });
  });
});
