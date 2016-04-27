'use strict';

const assert = require('chai').assert;
const expect = require('chai').expect;

const ModelAtom = require('../src/model/atom');
const ModelBond = require('../src/model/bond');
const ModelMolecule = require('../src/model/molecule');

const JSONParser = require('../src/io/json_parser');

describe('Test renderer/hydrogen_position module:', () => {
  describe('Test constructor: ', () => {
    it('should convert json string to object', () => {
      const str = '{"m":[{"a":[{"x":0.0,"y":0.0},{"x":1.0,"y":2.0,"l":"O"}],"b":[{"b":0,"e":1}]}]}';
      const obj = new JSONParser(str).obj;
      assert.isObject(obj);
      const ms = obj.m;
      assert.isArray(ms);
      const m = ms[0];
      const a1 = m.a[0];
      assert.isObject(a1);
      assert.equal(a1.x, 0);
      assert.equal(a1.y, 0);
      const b = m.b[0];
      assert.isObject(b);
      assert.equal(b.b, 0);
      assert.equal(b.e, 1);
    });
  });
  describe('Test parseAtom:', () => {
    it('convert atom object to a model of atom', () => {
      const a = {x: 1.0, y: 2.0, l: "O"};
      const modA = new JSONParser().parseAtom(a);
      expect(modA).to.be.an.instanceOf(ModelAtom);
      assert.equal(modA.coord.x, 1);
      assert.equal(modA.coord.y, 2);
      assert.equal(modA.symbol, 'O');
    });
  });
  describe('Test parseMolecule:', () => {
    it('convert molecule object to a model of molecule', () => {
      const m = {
        "a": [{"x": 0.0, "y": 0.0}, {"x": 1.0, "y": 1.0, "l": "O"}],
        "b": [{"b": 0, "e": 1}]
      };
      const modM = new JSONParser().parseMolecule(m);
      expect(modM).to.be.an.instanceOf(ModelMolecule);
      // Test atoms
      assert.isArray(modM.atoms);
      const a1 = modM.atoms[0];
      const a2 = modM.atoms[1];
      expect(a1).to.be.an.instanceOf(ModelAtom);
      expect(a2).to.be.an.instanceOf(ModelAtom);
      assert.equal(a1.coord.x, 0);
      assert.equal(a1.coord.y, 0);
      assert.equal(a1.symbol, 'C');
      assert.equal(a2.coord.x, 1);
      assert.equal(a2.coord.y, 1);
      assert.equal(a2.symbol, 'O');
      // Test bond
      assert.isArray(modM.bonds);
      const b1 = modM.bonds[0];
      expect(b1).to.be.an.instanceOf(ModelBond);
      assert.equal(b1.source, a1);
      assert.equal(b1.target, a2);
    });
  });
});
