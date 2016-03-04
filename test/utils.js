'use strict';

const ModelAtom = require('../src/model/atom');

class Utils {
  /**
   *   @return modelAtom default C in 0,0
   */
  static atom() {
    const atom = new ModelAtom();
    return atom;
  }
}

module.exports = Utils;
