'use strict';

const ModelAtom = require('../model/atom');
const ModelBond = require('../model/bond');
const ModelMolecule = require('../model/molecule');

class JSONParser {
  constructor(json) { this.obj = JSON.parse(json || '{}'); }

  /**
   * parseAtom - convert atom object to model of Atom
   *
   * @param  {string} obj - atom object as chemdoodle defines it
   * @return {ModelAtom}
   */
  parseAtom(obj) {
    const symbol = obj.l ? obj.l : 'C';
    const x = obj.x ? obj.x : 0;
    const y = obj.y ? obj.y : 0;
    return new ModelAtom(symbol, x, y);
  }

  /**
   * parseMolecule - convert molecule object to model of molecule
   *
   * @param  {object} obj - molecule object as chemdoodle defines it
   * @return {ModelMolecule}
   */
  parseMolecule(obj) {
    const mol = new ModelMolecule();
    obj.a.forEach(a => mol.addAtom(this.parseAtom(a)));
    obj.b.forEach(b => mol.addBond(new ModelBond(mol.atoms[b.b], mol.atoms[b.e])));
    return mol;
  }
}
module.exports = JSONParser;
