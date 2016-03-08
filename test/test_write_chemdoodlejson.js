require('../node_modules/google-closure-library/closure/goog/bootstrap/nodejs');

const assert = require('assert');
const utils = require('./utils');
const ChemJsonWriter = require('../src/io/write_chemdoodlejson.js');

const atom = utils.atom();
const molecule = utils.molecule();
const ChemJson = new ChemJsonWriter(molecule);

describe('ChemJsonWriter', () => {
  describe('process_atom', () => {
    it('convert ModelAtom to a js object',
       () => { assert.deepStrictEqual(ChemJson.processAtom(atom), {I: 'C', x: 0, y: 0, c: 0}); });
  });
  describe('processBond', () => {
    it('convert ModelBond from a molecule to a js object', () => {
      assert.deepStrictEqual(ChemJson.processBond(molecule.bonds[0], molecule), {b: 0, e: 1, o: 1});
    });
  });
  describe('processMolecule', () => {
    it('convert ModelMolecule to chemdoodle JSON', () => {
      const res = ChemJson.processMolecule(molecule);
      assert.deepStrictEqual(res.m[0].a, [{I: 'C', x: 0, y: 0, c: 0}, {I: 'O', x: 1, y: 1, c: 0}]);
      assert.deepStrictEqual(res.m[0].b, [{b: 0, e: 1, o: 1}]);
      assert.strictEqual(res.s.length, 0);
    });
  });
});
