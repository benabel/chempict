'use strict';

const assert = require('chai').assert;
const expect = require('chai').expect;
const sinon = require('sinon');

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
  describe('Test getHydrogenPosition', () => {
    it('should use usingDefaultPlacement method for single atom only', () => {
      const mol = testUtils.moleculeFromSmiles('C');
      const hPos = new HydrogenPosition(mol.atoms[0]);
      const spy = sinon.spy(hPos, "usingDefaultPlacement");
      assert.isFalse(spy.calledOnce);
      hPos.getHydrogenPosition();
      assert.isTrue(spy.calledOnce);
      const mol2 = testUtils.moleculeFromSmiles('CO');
      const hPos2 = new HydrogenPosition(mol2.atoms[0]);
      const spy2 = sinon.spy(hPos2, "usingDefaultPlacement");
      assert.isFalse(spy2.calledOnce);
      hPos2.getHydrogenPosition();
      assert.isFalse(spy2.calledOnce);
    });
    it('should use usingCardinalDirection method for atom with two neighbors only', () => {
      const mol = testUtils.moleculeFromSmiles('CCO');
      const hPos1 = new HydrogenPosition(mol.atoms[0]);
      const spy1 = sinon.spy(hPos1, "usingCardinalDirection");
      assert.isFalse(spy1.calledOnce);
      hPos1.getHydrogenPosition();
      assert.isFalse(spy1.calledOnce);
      const hPos2 = new HydrogenPosition(mol.atoms[1]);
      const spy2 = sinon.spy(hPos2, "usingCardinalDirection");
      assert.isFalse(spy2.calledOnce);
      hPos2.getHydrogenPosition();
      assert.isTrue(spy2.calledOnce);
      const mol2 = testUtils.moleculeFromSmiles('C(C)(O)(O)');
      const hPos3 = new HydrogenPosition(mol2.atoms[0]);
      const spy3 = sinon.spy(hPos3, "usingCardinalDirection");
      assert.isFalse(spy3.calledOnce);
      hPos1.getHydrogenPosition();
      assert.isFalse(spy3.calledOnce);
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
  describe('Test getHydrogenPosition for atom with two neighbor: ', () => {
    it('should use getHydrogenPosition.usingCardinalDirection method', () => {
      const m1 = {
        "a":
            [{"x": 0.0, "y": 0.0, "l": "F"}, {"x": -1.0, "y": 1.0, l: "S"}, {"x": -1.0, "y": -1.0}],
        "b": [{"b": 0, "e": 1}, {"b": 0, "e": 2}]
      };
      const mol1 = testUtils.moleculeFromObject(m1);
      const centralAtom = mol1.atoms[0];
      const firstAtom = mol1.atoms[1];
      const secondAtom = mol1.atoms[2];
      assert.equal(centralAtom.symbol, 'F');
      assert.equal(firstAtom.symbol, 'S');
      assert.equal(secondAtom.symbol, 'C');
      const hPos1 = new HydrogenPosition(centralAtom);
      const spy1 = sinon.spy(hPos1, "usingCardinalDirection");
      hPos1.getHydrogenPosition();
      assert.isTrue(spy1.calledOnce);
      // direction of the two bonds: W
      assert.equal(hPos1.getHydrogenPosition(), 'Right');
      // direction of the two bonds: S
      firstAtom.coord = {x: 1, y: -1};
      const dirS = new HydrogenPosition(centralAtom).getHydrogenPosition();
      assert.equal(dirS, 'Above');
      // direction of the two bonds: N
      firstAtom.coord = {x: -1, y: 1};
      secondAtom.coord = {x: 1, y: 1};
      const dirN = new HydrogenPosition(centralAtom).getHydrogenPosition();
      assert.equal(dirN, 'Below');
      // direction of the two bonds: E
      firstAtom.coord = {x: 1, y: 1};
      secondAtom.coord = {x: 1, y: -1};
      const dirE = new HydrogenPosition(centralAtom).getHydrogenPosition();
      assert.equal(dirE, 'Left');
    });
  });
});
