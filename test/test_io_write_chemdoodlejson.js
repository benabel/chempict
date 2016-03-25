'use strict';

const assert = require('chai').assert;
const testUtils = require('./utils');
const ChemJsonWriter = require('../src/io/write_chemdoodlejson.js');

const atom = testUtils.atom();
const molecule = testUtils.molecule();
const ChemJson = new ChemJsonWriter(molecule);

describe('Test chemdoodle json writer', () => {
  describe('process_atom', () => {
    it('convert ModelAtom to a js object',
       () => { assert.deepEqual(ChemJson.processAtom(atom), {l: 'C', x: 0, y: 0, c: 0}); });
  });
  describe('processBond', () => {
    it('convert ModelBond from a molecule to a js object', () => {
      assert.deepEqual(
          ChemJson.processBond(molecule.bonds[0], molecule), {b: 0, e: 1, o: 1, s: 'none'});
    });
  });
  describe('processMolecule', () => {
    it('convert ModelMolecule to chemdoodle JSON', () => {
      const res = ChemJson.processMolecule(molecule);
      assert.deepEqual(res.m[0].a, [{l: 'C', x: 0, y: 0, c: 0}, {l: 'O', x: 1, y: 1, c: 0}]);
      assert.deepEqual(res.m[0].b, [{b: 0, e: 1, o: 1, s: 'none'}]);
      assert.strictEqual(res.s.length, 0);
    });
  });
});
