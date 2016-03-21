'use strict';


/** Class for the chemdoodle json writer. */
class ChemJsonWriter {
  /**
   * constructor - Create a json string from a molecule model
   *
   * @param  {modelMolecule} mol - Molecule model to convert
   */
  constructor(mol) { this.molObj = this.processMolecule(mol); }

  /**
   * convert ModelAtom to a js object
   */
  processAtom(atom) {
    let a = {};
    let coord = atom.coord;
    a.l = atom.symbol;
    a.x = coord.x;
    a.y = coord.y;
    a.c = atom.charge;
    return a;
  }

  /**
   * convert ModelBond from a molecule to a js object
   */
  processBond(bond, molecule) {
    let b = {};
    let atom1 = bond.source;
    let atom2 = bond.target;
    b.b = molecule.indexOfAtom(atom1);
    b.e = molecule.indexOfAtom(atom2);
    b.o = bond.order;
    switch (bond.stereo) {
      case 10:
        b.s = 'none';
        break;
      case 11:
        b.s = 'protuding';
        break;
      case 12:
        b.s = 'ambiguous';
        break;
      case 13:
        b.s = 'recessed';
        break;
      default:
        b.s = 'none';
    }
    return b;
  }

  /**
   * convert ModelMolecule to chemdoodle JSON
   */
  processMolecule(molecule) {
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
  /**
   * return the chemdoodle JSON string
   */
  toJson() { return JSON.stringify(this.molObj); }
}

module.exports = ChemJsonWriter;
