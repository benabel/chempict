require('../node_modules/google-closure-library/closure/goog/bootstrap/nodejs');

const assert = require('assert');
const utils = require('./utils');

describe('utils', () => {
  describe('single atom', () => {
    it('should return a C modelAtom in 0,0', () => {
      const atom = utils.atom();
      assert.equal(atom.coord.x, 0);
      assert.equal(atom.coord.y, 0);
      assert.equal(atom.symbol, 'C');
      assert.equal(atom.charge, 0);
    });
  });
  describe('single bond', () => {
    const bond = utils.bond();
    it('should return a bond between C atom in 0,0 and O atom in 1,1', () => {
      assert.equal(bond.source.symbol, 'C');
      assert.equal(bond.source.coord.x, 0);
      assert.equal(bond.source.coord.y, 0);
      assert.equal(bond.target.symbol, 'O');
      assert.equal(bond.target.coord.x, 1);
      assert.equal(bond.target.coord.y, 1);
    });
  });
  describe('single molecule', () => {
    it('should return a molecule with a single bond', () => {
      const molecule = utils.molecule();
      assert.equal(molecule.bonds.length, 1);
      const bond = molecule.bonds[0];
      assert.equal(bond.source.symbol, 'C');
      assert.equal(bond.source.coord.x, 0);
      assert.equal(bond.source.coord.y, 0);
      assert.equal(bond.target.symbol, 'O');
      assert.equal(bond.target.coord.x, 1);
      assert.equal(bond.target.coord.y, 1);
    });
  });
});
