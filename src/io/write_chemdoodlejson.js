'use strict';

class ChemJsonWriter {
  /**
   * constructor - Create a json string from a molecule model
   *
   * @param  {modelMolecule} mol - Molecule model to convert
   */
  constructor(mol) { this.molObj = this.processMolecule(mol); }

  processAtom(atom) {
    /**
     *     convert ModelAtom to a js object
     */
    let a = {};
    let coord = atom.coord;
    a.I = atom.symbol;
    a.x = coord.x;
    a.y = coord.y;
    a.c = atom.charge;
    return a;
  }

  processBond(bond, molecule) {
    /**
     *     convert ModelBond from a molecule to a js object
     */
    let b = {};
    let atom1 = bond.source;
    let atom2 = bond.target;
    b.b = molecule.indexOfAtom(atom1);
    b.e = molecule.indexOfAtom(atom2);
    b.o = bond.order;
    return b;
  }

  processMolecule(molecule) {
    /**
     *     convert ModelMolecule to chemdoodle JSON
     */
    let obj = {};
    let mols = [];
    let mol = {};
    const atoms = molecule.atoms;
    const bonds = molecule.bonds;
    mol.a = atoms.map(this.processAtom);
    mol.b = [];
    for (let i = 0; i < bonds.length; i++) {
      mol.b.push(this.processBond(bonds[i], molecule));
    }

    mols[0] = mol;
    obj.m = mols;
    obj.s = [];
    return obj;
  }
  toJson() { return JSON.stringify(this.molObj); }
}

module.exports = ChemJsonWriter;
