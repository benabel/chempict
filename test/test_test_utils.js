'use strict';

const assert = require('chai').assert;
const testUtils = require('./utils');

describe('Test test/utils module', () => {
  describe('single atom', () => {
    it('should return a C modelAtom in 0,0', () => {
      const atom = testUtils.atom();
      assert.equal(atom.coord.x, 0);
      assert.equal(atom.coord.y, 0);
      assert.equal(atom.symbol, 'C');
      assert.equal(atom.charge, 0);
    });
  });
  describe('single bond', () => {
    it('by default should return a bond between C atom in 0,0 and O atom in 1,1', () => {
      const bond = testUtils.bond();
      assert.equal(bond.source.symbol, 'C');
      assert.equal(bond.source.coord.x, 0);
      assert.equal(bond.source.coord.y, 0);
      assert.equal(bond.target.symbol, 'O');
      assert.equal(bond.target.coord.x, 1);
      assert.equal(bond.target.coord.y, 1);
    });
    it('single N-H bond', () => {
      const bond = testUtils.bond('N', 2, 2, 'H', 3, 3);
      assert.equal(bond.source.symbol, 'N');
      assert.equal(bond.source.coord.x, 2);
      assert.equal(bond.source.coord.y, 2);
      assert.equal(bond.target.symbol, 'H');
      assert.equal(bond.target.coord.x, 3);
      assert.equal(bond.target.coord.y, 3);
    });
  });
  describe('single molecule', () => {
    it('should return a C-O molecule with a single bond', () => {
      const molecule = testUtils.molecule();
      assert.equal(molecule.bonds.length, 1);
      const bond = molecule.bonds[0];
      assert.equal(bond.source.symbol, 'C');
      assert.equal(bond.source.coord.x, 0);
      assert.equal(bond.source.coord.y, 0);
      assert.equal(bond.target.symbol, 'O');
      assert.equal(bond.target.coord.x, 1);
      assert.equal(bond.target.coord.y, 1);
    });
    it('should return a N-H molecule with a single bond', () => {
      const molecule = testUtils.molecule('N', 2, 2, 'H', 3, 3);
      assert.equal(molecule.bonds.length, 1);
      const bond = molecule.bonds[0];
      assert.equal(bond.source.symbol, 'N');
      assert.equal(bond.source.coord.x, 2);
      assert.equal(bond.source.coord.y, 2);
      assert.equal(bond.target.symbol, 'H');
      assert.equal(bond.target.coord.x, 3);
      assert.equal(bond.target.coord.y, 3);
    });
  });
  describe('Create a molecule from a smile:', () => {
    it('should return a molecule with a single atom', () => {
      const molecule = testUtils.moleculeFromSmiles('C');
      assert.equal(molecule.countBonds(), 0);
      assert.equal(molecule.countAtoms(), 1);
    });
    it('should return a molecule C-O', () => {
      const molecule = testUtils.moleculeFromSmiles('CO');
      assert.equal(molecule.countBonds(), 1);
      assert.equal(molecule.countAtoms(), 2);
    });
    it('should return a molecule propane', () => {
      const molecule = testUtils.moleculeFromSmiles('CCC');
      assert.equal(molecule.countBonds(), 2);
      assert.equal(molecule.countAtoms(), 3);
    });
  });
});
