'use strict';
// no-unused-expressions

const assert = require('chai').assert;
const expect = require('chai').expect;

const testUtils = require('./utils');
const SvgDepict = require('../src/depict/svg');
const ModelAtom = require('../src/model/atom');

describe('Test depict/svg module:', () => {
  describe('Test constructor: ', () => {
    const mol = testUtils.moleculeFromSmiles('C');
    const depict = new SvgDepict(mol);
    it('should load config', () => {
      expect(depict.config).to.exist;
      assert.isNumber(depict.config.fontSize);
    });
    it('should calculate size of molecule and scale', () => {
      assert.isNumber(depict.scale);
      assert.isNumber(depict.h);
      assert.isNumber(depict.w);
    });
  });
  describe('Test _selectAtoms for propane: ', () => {
    const mol = testUtils.moleculeFromSmiles('CCC');
    let depict = new SvgDepict(mol);
    it('test when displayCarbonLabels is all', () => {
      depict.config.displayCarbonLabels = 'all';
      assert.instanceOf(depict._selectAtom(mol.atoms[0]), ModelAtom);
      assert.instanceOf(depict._selectAtom(mol.atoms[1]), ModelAtom);
      assert.instanceOf(depict._selectAtom(mol.atoms[2]), ModelAtom);
    });
    it('test when displayCarbonLabels is none', () => {
      depict.config.displayCarbonLabels = 'none';
      expect(depict._selectAtom(mol.atoms[0])).to.be.false;
      expect(depict._selectAtom(mol.atoms[1])).to.be.false;
      expect(depict._selectAtom(mol.atoms[2])).to.be.false;
    });
    it('test when displayCarbonLabels is terminal', () => {
      depict.config.displayCarbonLabels = 'terminal';
      assert.instanceOf(depict._selectAtom(mol.atoms[0]), ModelAtom);
      expect(depict._selectAtom(mol.atoms[1])).to.be.false;
      assert.instanceOf(depict._selectAtom(mol.atoms[2]), ModelAtom);
    });
    it('test when displayCarbonLabels is undefined fallback to terminal', () => {
      depict.config.displayCarbonLabels = undefined;
      assert.instanceOf(depict._selectAtom(mol.atoms[0]), ModelAtom);
      expect(depict._selectAtom(mol.atoms[1])).to.be.false;
      assert.instanceOf(depict._selectAtom(mol.atoms[2]), ModelAtom);
    });
  });
  describe('Test _selectAtoms for propan-1-ol: ', () => {
    const mol = testUtils.moleculeFromSmiles('CCO');
    let depict = new SvgDepict(mol);
    it('test when displayCarbonLabels is all', () => {
      depict.config.displayCarbonLabels = 'all';
      assert.instanceOf(depict._selectAtom(mol.atoms[0]), ModelAtom);
      assert.instanceOf(depict._selectAtom(mol.atoms[1]), ModelAtom);
      assert.instanceOf(depict._selectAtom(mol.atoms[2]), ModelAtom);
    });
    it('test when displayCarbonLabels is none', () => {
      depict.config.displayCarbonLabels = 'none';
      expect(depict._selectAtom(mol.atoms[0])).to.be.false;
      expect(depict._selectAtom(mol.atoms[1])).to.be.false;
      assert.instanceOf(depict._selectAtom(mol.atoms[2]), ModelAtom);
    });
    it('test when displayCarbonLabels is terminal', () => {
      depict.config.displayCarbonLabels = 'terminal';
      assert.instanceOf(depict._selectAtom(mol.atoms[0]), ModelAtom);
      expect(depict._selectAtom(mol.atoms[1])).to.be.false;
      assert.instanceOf(depict._selectAtom(mol.atoms[2]), ModelAtom);
    });
    it('test when displayCarbonLabels is undefined fallback to terminal', () => {
      depict.config.displayCarbonLabels = undefined;
      assert.instanceOf(depict._selectAtom(mol.atoms[0]), ModelAtom);
      expect(depict._selectAtom(mol.atoms[1])).to.be.false;
      assert.instanceOf(depict._selectAtom(mol.atoms[2]), ModelAtom);
    });
  });
});
