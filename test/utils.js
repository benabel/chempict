'use strict';

const ModelAtom = require('../src/model/atom');
const ModelBond = require('../src/model/bond');
const ModelMolecule = require('../src/model/molecule');

/** Class containing utilities for tests. */
class Utils {
  static atom(optSymbol, optX, optY) {
    const atom = new ModelAtom(optSymbol, optX, optY);
    return atom;
  }
  static bond() {
    const bond = new ModelBond(this.atom('C', 0, 0), this.atom('O', 1, 1));
    return bond;
  }
  static molecule() {
    let molecule = new ModelMolecule();
    molecule.addBond(this.bond());
    return molecule;
  }
}

module.exports = Utils;
