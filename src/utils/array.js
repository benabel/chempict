/**
* @fileoverview Utilities for manipulating arrays inspired by numpy api and google closure library.
*/

class array {
  /**
  *Return an empty array with the given shape
  *@param {integer} n - The shape of the returned array.
  *@return {array} - Empty array with the same shape as a.
  */
  static empty(n) {
    const empty = new Array(n);
    return empty;
  }

  /**
  *Return an array with the given shape filled with zeroes
  *@param {integer} n - The shape of the returned array.
  *@return {array} - Array with the given shape filled with zeroes
  */
  static zeros(n) {
    const as = this.empty(n);
    as.fill(0);
    return as;
  }

  /**
  *Return an array with the given shape filled with fillValue
  *@param {integer} n - The shape of the returned array.
  *@param {any} fillValue - Fill value
  *@return {array} - Array with the given shape filled with fillValue
  */
  static full(n, fillValue) {
    const as = this.empty(n);
    as.fill(fillValue);
    return as;
  }

  /**
  * Find the difference of two arrays.
  * Return the values in ar1 that are not in ar2.
  *@param {array} ar1 - Input array.
  *@param {any} ar2 - Input comparison array.
  *@return {array} - Array of values in ar1 that are not in ar2.
  */
  static diff(ar1, ar2) {
    const delta = ar1.filter(el => ar2.indexOf(el) < 0);
    return delta;
  }

  /**
  * Remove one element of an array if found
  * Return the array without the first match of el.
  *@param {array} ar - Input array.
  *@param {any} el - Element to remove.
  *@return {array} - Array ar without el
  */
  static remove(ar, el) {
    if (ar.indexOf(el) >= 0) {
      ar.splice(ar.indexOf(el), 1);
    }
    return ar;
  }

  /**
  * Flatten arrays
  * Return the flattened array.
  * from answer http://stackoverflow.com/a/30048388
  *@param {array} ars - Arguments as an array or values(es6 rest parameters)
  *@return {array} - Flattened array.
  */
  static flatten(...ars) {
    let flat = [];
    for (let i = 0; i < ars.length; i++) {
      if (ars[i] instanceof Array) {
        flat.push.apply(flat, this.flatten.apply(this, ars[i]));
      } else {
        flat.push(ars[i]);
      }
    }
    return flat;
  }

  /**
  * Returns the last element in an array without removing it.
  * @param {Array<T>} array The array.
  * @return {T} Last item in array.
  */
  static last(array) { return array[array.length - 1]; }

  /**
  * Compares its two arguments for order, using the built in < and >
  * operators.
  * @param {VALUE} a The first object to be compared.
  * @param {VALUE} b The second object to be compared.
  * @return {number} A negative number, zero, or a positive number as the first
  *     argument is less than, equal to, or greater than the second,
  *     respectively.
  */
  static defaultCompare(a, b) {
    let out;
    if (a > b) {
      out = 1;
    } else if (a < b) {
      out = -1;
    } else {
      out = 0;
    }
    return out;
  }
}

module.exports = array;
