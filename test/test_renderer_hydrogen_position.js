'use strict';

const assert = require('chai').assert;
const expect = require('chai').expect;

const modelBond = require('../src/model/bond');
const testUtils = require('./utils');
const HydrogenPosition = require('../src/renderer/hydrogen_position');

const molecule = testUtils.molecule();

describe('Test renderer/hydrogen_position module:', () => {
  describe('Test constructor: ', () => {
    it('should determine the bonds of atom', () => {
      const hPos = new HydrogenPosition(molecule.atoms[0]);
      const bonds = hPos.bonds;
      expect(bonds).to.be.an('Array');
      assert.equal(bonds.length, 1, 'returns array of bonds');
      expect(bonds[0]).to.be.an.instanceOf(modelBond);
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
});
