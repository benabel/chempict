'use strict';

const assert = require('chai').assert;
const expect = require('chai').expect;

const ModelAtom = require('../src/model/atom');
const ModelBond = require('../src/model/bond');
const ModelMolecule = require('../src/model/molecule');

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
  describe('Create a molecule from a chemdoodle object:', () => {
    it('should return a molecule with a single atom', () => {
      const m = {
        "a": [{"x": 0.0, "y": 0.0}, {"x": 1.0, "y": 1.0, "l": "O"}],
        "b": [{"b": 0, "e": 1}]
      };
      const mol = testUtils.moleculeFromObject(m);
      expect(mol).to.be.an.instanceOf(ModelMolecule);
      // Test atoms
      assert.isArray(mol.atoms);
      const a1 = mol.atoms[0];
      const a2 = mol.atoms[1];
      expect(a1).to.be.an.instanceOf(ModelAtom);
      expect(a2).to.be.an.instanceOf(ModelAtom);
      assert.equal(a1.coord.x, 0);
      assert.equal(a1.coord.y, 0);
      assert.equal(a1.symbol, 'C');
      assert.equal(a2.coord.x, 1);
      assert.equal(a2.coord.y, 1);
      assert.equal(a2.symbol, 'O');
      // Test bond
      assert.isArray(mol.bonds);
      const b1 = mol.bonds[0];
      expect(b1).to.be.an.instanceOf(ModelBond);
      assert.equal(b1.source, a1);
      assert.equal(b1.target, a2);
    });
  });
});
