/**
* @fileoverview Utilities for string manipulation from google closur library
*/

class string {
  /**
  * Fast suffix-checker.
  * @param {string} str The string to check.
  * @param {string} suffix A string to look for at the end of {@code str}.
  * @return {boolean} True if {@code str} ends with {@code suffix}.
  */

  static startsWith(str, prefix) { return str.lastIndexOf(prefix, 0) == 0; };
}

module.exports = string;
