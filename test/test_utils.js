require('../node_modules/google-closure-library/closure/goog/bootstrap/nodejs');

const assert = require('assert');
const utils = require('./utils');
const atom = utils.atom();

describe('utils', function() {
  describe('atom', function() {
    it('should return a C modelAtom in 0,0', function() {
      assert.equal(atom.coord.x, 0);
      assert.equal(atom.coord.y, 0);
      assert.equal(atom.symbol, 'C');
      assert.equal(atom.charge, 0);
    });
  });
});
