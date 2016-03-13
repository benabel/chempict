/**
* @fileoverview Utilities for manipulating arrays inspired by numpy api
*/

class array {
  /**
  *Return an empty array with the given shape
  *@param {integer} n - The shape of the returned array.
  *@return {array} - Empty array with the same shape as a.
  */
  static empty(n) {
    const empty = new Array(n);
    return empty
  }

  // /**
  // *Return an empty array with the same shape as a given array
  // *@param {array} a - The shape of a define the shape of the returned array.
  // *@return {array} - Empty array with the same shape as a.
  // */
  // static emptyLike(a) {
  //   const empty = new Array(a.length);
  //   return empty
  // }

  // /**
  // *Return an array with the given shape filled with zeros
  // *@param {integer} n - The shape of the returned array.
  // *@return {array} - Array of zeros with the given shape,
  // */
  // static zeros(n) {
  //   const zeros = this.empty(n);
  //   zeros.fill(0);
  //   return zeros
  // }
  //
  // /**
  //  * Return an array of zeros with the same shape as a given array
  //  * @param {array} a - The shape of a define the shape of the returned array.
  //  * @return {array} - Array of zeros with the same shape as a.
  //  */
  // static zerosLike(a) {
  //   let zeros = this.emptyLike(a);
  //   zeros.fill(0);
  //   return zeros
  // }

  /**
  *Return an array with the given shape filled with fillValue
  *@param {integer} n - The shape of the returned array.
  *@param {any} fillValue - Fill value
  *@return {array} - Array with the given shape filled with fillValue
  */
  static full(n, fillValue) {
    const as = this.empty(n);
    as.fill(fillValue);
    return as
  }

  // /**
  //  * Return an array with the same shape as a given array filled with fillValue
  //  * @param {array} a - The shape of a define the shape of the returned array.
  //  * @param {any} fillValue - Fill value
  //  * @return {array} - Array of zeros with the same shape as a.
  //  */
  // static fullLike(a, fillValue) {
  //   let as = this.emptyLike(a);
  //   as.fill(fillValue);
  //   return as
  // }
}

module.exports = array;
