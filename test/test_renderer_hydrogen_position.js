'use strict';

const assert = require('chai').assert;
const expect = require('chai').expect;

const MathVector2D = require('../src/math/vector2d');
const ModelAtom = require('../src/model/atom');

const HydrogenPosition = require('../src/renderer/hydrogen_position');
const testUtils = require('./utils');

describe('Test renderer/hydrogen_position module:', () => {
  describe('Test constructor: ', () => {
    it('should load atom', () => {
      const mol = testUtils.moleculeFromSmiles('C');
      const hPos = new HydrogenPosition(mol.atoms[0]);
      const atom = hPos.atom;
      expect(atom).to.be.an.instanceOf(ModelAtom);
      assert.equal(atom.symbol, 'C');
    });
    it('should construct vector bonds for the atom', () => {
      const mol = testUtils.moleculeFromSmiles('CCO');
      const hPos = new HydrogenPosition(mol.atoms[0]);
      const bonds = hPos.vectorBonds;
      expect(bonds).to.be.an('Array');
      assert.equal(bonds.length, 1, 'returns array of bonds');
      expect(bonds[0]).to.be.an.instanceOf(MathVector2D);
      const hPos1 = new HydrogenPosition(mol.atoms[1]);
      const bonds1 = hPos1.vectorBonds;
      assert.equal(bonds1.length, 2, 'returns array of bonds');
      const hPos2 = new HydrogenPosition(mol.atoms[2]);
      const bonds2 = hPos2.vectorBonds;
      assert.equal(bonds2.length, 1, 'returns array of bonds');
    });
  });
  describe('Test getHydrogenPosition.usingDefaultPlacement for single atom: ', () => {
    it('should return right for CH4', () => {
      const mol = testUtils.moleculeFromSmiles('C');
      const hPos = new HydrogenPosition(mol.atoms[0]);
      assert.equal(hPos.getHydrogenPosition(), 'Right');
    });
    it('should return left for H2O', () => {
      const mol = testUtils.moleculeFromSmiles('O');
      const hPos = new HydrogenPosition(mol.atoms[0]);
      assert.equal(hPos.getHydrogenPosition(), 'Left');
    });
  });
  describe('Test getHydrogenPosition for atom with one neighbor: ', () => {
    it('Using a threshold value to place label on rigth except if bond has x component > 0.1',
       () => {
         const mol = testUtils.molecule('C', 0, 0, 'O', 1, 1);
         const hPos1 = new HydrogenPosition(mol.atoms[0]);
         assert.equal(hPos1.getHydrogenPosition(), 'Left');
         const hPos2 = new HydrogenPosition(mol.atoms[1]);
         assert.equal(hPos2.getHydrogenPosition(), 'Right');
         const mol2 = testUtils.molecule('C', 0, 0, 'O', 0.11, 1);
         const hPos3 = new HydrogenPosition(mol2.atoms[0]);
         assert.equal(hPos3.getHydrogenPosition(), 'Left');
         const mol3 = testUtils.molecule('C', 0, 0, 'O', 0.1, 1);
         const hPos4 = new HydrogenPosition(mol3.atoms[0]);
         assert.equal(hPos4.getHydrogenPosition(), 'Right');
       });
  });

});
