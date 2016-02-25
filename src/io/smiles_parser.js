/*
 * Copyright 2010 Paul Novak paul@wingu.com
 * Copyright 2015-2016 Benjamin Abel bbig26@gmail.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const SmilesParser = {};
const ModelAtom = require('../model/atom');
const ModelBond = require('../model/bond');
const ModelMolecule = require('../model/molecule');

/**
 * enum for bond types
 *
 * @enum {string}
 */
SmilesParser.BondType = {
  NONE: 'NONE',
  SINGLE_BOND: '-',
  DOUBLE_BOND: '=',
  TRIPLE_BOND: '#',
  QUAD_BOND: '$',
  AROMATIC_BOND: ':',
  ANY: '~'
};

/**
 * enum for stereo types
 *
 * @enum {string}
 */
SmilesParser.BondStereo = {
  NONE: 'NONE',
  CLOCKWISE: '@',
  COUNTER_CLOCKWISE: '@@'
};

/**
 * enum for punctuation
 *
 * @enum {string}
 */
SmilesParser.punctuation = {
  nobond: '.',
  openbranch: '(',
  closebranch: ')',
  singlebond: SmilesParser.BondType.SINGLE_BOND,
  doublebond: SmilesParser.BondType.DOUBLE_BOND,
  triplebond: SmilesParser.BondType.TRIPLE_BOND,
  quadbond: SmilesParser.BondType.QUAD_BOND,
  aromaticbond: SmilesParser.BondType.AROMATIC_BOND,
  ringclosure: '%',
  cis: '/',
  trans: '\\'
};

SmilesParser.smiPattern = new RegExp(
    /\[[^[]+\]|Br|B|Cl|C|N|F|O|P]|S|c|n|o|s|-|=[0-9]|=[0-9]|=|#[0-9]|#[0-9][0-9]|#|\$|%[0-9][0-9]|[0-9]|\(|\)|./g);
SmilesParser.atomPattern =
    new RegExp(/^\[([0-9]*)([A-Z][a-z]?|c|n|o|se|s|as)(@|@@)?(H)?([0-9])?([+-][\d]?)?\]$/);
SmilesParser.specialAtoms =
    ['C', 'c', 'N', 'n', 'O', 'o', 'S', 's', 'P', 'F', 'Br', 'Cl', 'I', 'B'];
SmilesParser.aromaticAtoms = ['c', 'n', 'o', 's', 'as', 'se'];

SmilesParser.parse = function(smi) {
  var items = smi.match(SmilesParser.smiPattern);
  var mol = new ModelMolecule(smi);
  var natoms = 0;
  var previousAtom;
  var bondType = SmilesParser.BondType.NONE;
  var branch = new Array();
  var ring = new Array();
  var ringClosureOrder = new Array();

  var errstr = '';
  var chiralCenters = new Array();
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    // alert("item "+item)
    if (item === SmilesParser.punctuation.nobond) {
    } else if (item === SmilesParser.punctuation.openbranch) {
      branch.push(previousAtom);
    } else if (item === SmilesParser.punctuation.closebranch) {
      if (branch.length) {
        previousAtom = branch.pop();
      } else {
        errstr = ' Unbalanced parents';
      }
    } else if (item === SmilesParser.punctuation.singlebond) {
      bondType = SmilesParser.BondType.SINGLE_BOND;
    } else if (item === SmilesParser.punctuation.doublebond) {
      bondType = SmilesParser.BondType.DOUBLE_BOND;
    } else if (item === SmilesParser.punctuation.triplebond) {
      bondType = SmilesParser.BondType.TRIPLE_BOND;
    } else if (item === SmilesParser.punctuation.quadbond) {
      bondType = SmilesParser.BondType.QUAD_BOND;
    } else if (item === SmilesParser.punctuation.aromaticbond) {
      bondType = SmilesParser.BondType.AROMATIC_BOND;
    } else if (item[0] === SmilesParser.punctuation.ringclosure) {
      var ringid = parseInt(item[1] + item[2], 10);
      var ringAtom = ring[ringid];
      if (ringAtom) {
        mol.addBond(SmilesParser.createBond(bondType, previousAtom, ringAtom));
        bondType = SmilesParser.BondType.NONE;
        ring[ringid] = null;
      } else {
        ring[ringid] = previousAtom;
      }
    } else if (item === SmilesParser.punctuation.cis) {
    } else if (item === SmilesParser.punctuation.trans) {
    } else if (!isNaN(ringid = parseInt(item, 10))) {
      ringAtom = ring[ringid];
      if (!ringAtom) {
        ring[ringid] = previousAtom;
      } else {
        mol.addBond(SmilesParser.createBond(bondType, previousAtom, ringAtom));
        bondType = SmilesParser.BondType.NONE;
        ring[ringid] = null;
      }

      // The default bond order for the ring closure is single (or aromatic) but may be specified by
      // including a bond symbol between (!) the atom and the closure number.
      // Example: alternatives for cyclohexene (there is only one double bond here): C1=CCCCC1 <=>
      // C=1CCCCC1 <=> C1CCCCC=1 <=> C=1CCCCC=1
    } else if (
        item.length > 1 && (goog.string.startsWith(item, SmilesParser.BondType.DOUBLE_BOND) ||
                            goog.string.startsWith(item, SmilesParser.BondType.TRIPLE_BOND) ||
                            goog.string.startsWith(item, SmilesParser.BondType.QUAD_BOND)) &&
        !isNaN(ringid = parseInt(item.substr(1), 10))) {
      ringAtom = ring[ringid];
      if (!ringAtom) {
        ring[ringid] = previousAtom;
        ringClosureOrder[ringid] = item.substr(0, 1);
      } else {
        mol.addBond(SmilesParser.createBond(ringClosureOrder[ringid], previousAtom, ringAtom));
        bondType = SmilesParser.BondType.NONE;
        ring[ringid] = null;
        ringClosureOrder[ringid] = null;
      }
    } else {
      var smiAtom = SmilesParser.parseAtom(item);  // ,chiralCenters);
      // parseAtom
      // takes one
      // argument?
      if (smiAtom.symbol) {
        natoms += 1;
        var atom =
            new ModelAtom(smiAtom.symbol, 0, 0, smiAtom.charge, smiAtom.aromatic, smiAtom.isotope);
        if (previousAtom) {
          mol.addBond(SmilesParser.createBond(bondType, previousAtom, atom));
          bondType = SmilesParser.BondType.NONE;
        }
        mol.addAtom(atom);
        if (smiAtom.stereo !== 'NONE') {
          chiralCenters.push(mol.indexOfAtom(atom));
          chiralCenters.push(smiAtom.stereo);
          chiralCenters.push(smiAtom.chiralHydrogenNeighbour);
        }
        previousAtom = atom;
      } else {
        errstr = ' unknown atom ' + item;
      }
    }
    if (errstr) {
      throw new Error(smi + errstr);
      break;
    }
  }

  SmilesParser.setChiralCenters(mol, chiralCenters);

  if (SmilesParser.sanityCheck(branch, ring, bondType)) {
    return mol;
  } else {
    return null;
  }
};

SmilesParser.sanityCheck = function(branch, ring, bondType) {
  if (branch.length) {
    throw new Error('unbalanced parens');
  }
  for (var i = 0; i < ring.length; ++i) {
    if (ring[i]) {
      throw new Error('unclosed rings');
    }
  }
  if (bondType !== SmilesParser.BondType.NONE) {
    throw new Error('unpaired bond ' + bondType);
  }
  return true;
};

SmilesParser.parseAtom = function(item) {
  var atom = {
    isotope: null,
    'symbol': null,
    stereo: SmilesParser.BondStereo.NONE,
    hcount: null,
    charge: null,
    aromatic: false,
    chiralHydrogenNeighbour: false
  };
  var atomProp = SmilesParser.atomPattern.exec(item);

  if (atomProp) {
    atom.isotope = atomProp[1];

    // periodicTable has entries for c,n,o,s,as,se
    if (SmilesParser.periodicTable[atomProp[2]]) atom.symbol = atomProp[2];

    if (atomProp[3] === SmilesParser.BondStereo.CLOCKWISE ||
        atomProp[3] === SmilesParser.BondStereo.COUNTER_CLOCKWISE) {
      atom.stereo = atomProp[3];
      if (atomProp[4] === 'H') atom.chiralHydrogenNeighbour = true;
    } else {
      atom.stereo = SmilesParser.BondStereo.NONE;
    }

    if (atomProp[4] === 'H') {
      if (atomProp[5]) {
        atom.hcount = atomProp[5];
      } else {
        atom.hcount = 1;
      }
    }

    if (atomProp[6] === '+') {
      atom.charge = 1;
    } else if (atomProp[6] === '-') {
      atom.charge = -1;
    } else {
      atom.charge = parseInt(atomProp[6], 10);
    }

  } else {
    if (goog.array.contains(SmilesParser.specialAtoms, item)) {
      atom.symbol = item;
    }
  }
  if (goog.array.contains(SmilesParser.aromaticAtoms, atom.symbol)) {
    atom.aromatic = true;
    if (atom.symbol.length === 1) {
      atom.symbol = atom.symbol.toUpperCase();
    } else {
      atom.symbol = atom.symbol[0].toUpperCase() + atom.symbol[1];
    }
  }
  return atom;
};

/**
 * factory method for bonds
 *
 * @param {SmilesParser.BondType} type bond-type code.
 * @param {ModelAtom} source atom at source end of bond.
 * @param {ModelAtom} target atom at target end of bond.
 *
 * @return {ModelBond}
 */
SmilesParser.createBond = function(type, source, target) {
  var atype = type;
  if (type === SmilesParser.BondType.NONE) {
    if (source.aromatic && target.aromatic) {
      atype = SmilesParser.BondType.AROMATIC_BOND;
    } else {
      atype = SmilesParser.BondType.SINGLE_BOND;
    }
  }
  switch (atype) {
    case SmilesParser.BondType.SINGLE_BOND:
      return new ModelBond(source, target, ModelBond.ORDER.SINGLE);
    case SmilesParser.BondType.DOUBLE_BOND:
      return new ModelBond(source, target, ModelBond.ORDER.DOUBLE);
    case SmilesParser.BondType.TRIPLE_BOND:
      return new ModelBond(source, target, ModelBond.ORDER.TRIPLE);
    case SmilesParser.BondType.AROMATIC_BOND:
      var bond = new ModelBond(source, target);
      bond.aromatic = true;
      return bond;
    case SmilesParser.BondType.ANY:
    default:
      throw new Error('invalid bond type [' + type + ']');
  };
};

/**
 * Sets UP and DOWN bonds based on chiral center information
 *
 * @param {ModelMolecule}
 *            molecule currently being constructed by Smiles parser.
 * @param {Array.<number>} chiralCenters array of atoms flagged as chiral
 *            center in Smiles (plus extra overhead data).
 */
SmilesParser.setChiralCenters = function(molecule, chiralCenters) {
  for (var c = 0, centers = chiralCenters.length; c < centers; c++) {
    var atIndex = chiralCenters[c];
    var chiralAtom = molecule.getAtom(atIndex);
    if (chiralAtom !== undefined) {
      var direction = chiralCenters[++c];
      var chiralHydrogenNeighbour = chiralCenters[++c];
      var cnt = 0;
      var availableBonds = new Array();
      var cntNeighb = 0;
      var bond = null;
      goog.array.forEach(molecule.atoms, function(atom) {
        var bond_ = molecule.findBond(chiralAtom, atom);
        if (bond_ !== null && bond_ !== undefined) {
          if (bond_.source !== chiralAtom) {
            bond_.source = chiralAtom;
            bond_.target = atom;
          }
          cntNeighb++;
          if (!molecule.isBondInRing(bond_)) availableBonds.push(bond_);
        }
      });
      var numOfAvBonds = availableBonds.length;
      if ((cntNeighb === 3 || cntNeighb === 4) && numOfAvBonds > 0) {
        var bondidx = 0;
        if ((cntNeighb === 3 && numOfAvBonds > 1) || (cntNeighb === 4 && numOfAvBonds > 2)) {
          bondidx = 1;
        }
        bond = availableBonds[bondidx];
        if (direction === SmilesParser.BondStereo.CLOCKWISE) {
          bond.stereo = ModelBond.STEREO.UP;
        } else
          bond.stereo = ModelBond.STEREO.DOWN;
      }
      if (cntNeighb === 4 && numOfAvBonds > 1) {
        bondidx = 1;
        if (numOfAvBonds === 4)
          bondidx = 3;
        else if (numOfAvBonds === 4)
          bondidx = 2;
        bond = availableBonds[bondidx];
        if (direction === SmilesParser.BondStereo.CLOCKWISE)
          bond.stereo = ModelBond.STEREO.DOWN;
        else
          bond.stereo = ModelBond.STEREO.UP;
      }
    }
  }
};

SmilesParser.periodicTable = {
  'H': {'number': 1, 'name': 'Hydrogen'},
  'He': {'number': 2, 'name': 'Helium'},
  'Li': {'number': 3, 'name': 'Lithium'},
  'Be': {'number': 4, 'name': 'Beryllium'},
  'B': {'number': 5, 'name': 'Boron'},
  'C': {'number': 6, 'name': 'Carbon'},
  'c': {'number': 6, 'name': 'Carbon'},
  'N': {'number': 7, 'name': 'Nitrogen'},
  'n': {'number': 7, 'name': 'Nitrogen'},
  'O': {'number': 8, 'name': 'Oxygen'},
  'o': {'number': 8, 'name': 'Oxygen'},
  'F': {'number': 9, 'name': 'Fluorine'},
  'Ne': {'number': 10, 'name': 'Neon'},
  'Na': {'number': 11, 'name': 'Sodium'},
  'Mg': {'number': 12, 'name': 'Magnesium'},
  'Al': {'number': 13, 'name': 'Aluminium'},
  'Si': {'number': 14, 'name': 'Silicon'},
  'P': {'number': 15, 'name': 'Phosphorus'},
  'S': {'number': 16, 'name': 'Sulfur'},
  's': {'number': 16, 'name': 'Sulfur'},
  'Cl': {'number': 17, 'name': 'Chlorine'},
  'Ar': {'number': 18, 'name': 'Argon'},
  'K': {'number': 19, 'name': 'Potassium'},
  'Ca': {'number': 20, 'name': 'Calcium'},
  'Sc': {'number': 21, 'name': 'Scandium'},
  'Ti': {'number': 22, 'name': 'Titanium'},
  'V': {'number': 23, 'name': 'Vanadium'},
  'Cr': {'number': 24, 'name': 'Chromium'},
  'Mn': {'number': 25, 'name': 'Manganese'},
  'Fe': {'number': 26, 'name': 'Iron'},
  'Co': {'number': 27, 'name': 'Cobalt'},
  'Ni': {'number': 28, 'name': 'Nickel'},
  'Cu': {'number': 29, 'name': 'Copper'},
  'Zn': {'number': 30, 'name': 'Zinc'},
  'Ga': {'number': 31, 'name': 'Gallium'},
  'Ge': {'number': 32, 'name': 'Germanium'},
  'As': {'number': 33, 'name': 'Arsenic'},
  'as': {'number': 33, 'name': 'Arsenic'},
  'Se': {'number': 34, 'name': 'Selenium'},
  'se': {'number': 34, 'name': 'Selenium'},
  'Br': {'number': 35, 'name': 'Bromine'},
  'Kr': {'number': 36, 'name': 'Krypton'},
  'Rb': {'number': 37, 'name': 'Rubidium'},
  'Sr': {'number': 38, 'name': 'Strontium'},
  'Y': {'number': 39, 'name': 'Yttrium'},
  'Zr': {'number': 40, 'name': 'Zirconium'},
  'Nb': {'number': 41, 'name': 'Niobium'},
  'Mo': {'number': 42, 'name': 'Molybdenum'},
  'Tc': {'number': 43, 'name': 'Technetium'},
  'Ru': {'number': 44, 'name': 'Ruthenium'},
  'Rh': {'number': 45, 'name': 'Rhodium'},
  'Pd': {'number': 46, 'name': 'Palladium'},
  'Ag': {'number': 47, 'name': 'Silver'},
  'Cd': {'number': 48, 'name': 'Cadmium'},
  'In': {'number': 49, 'name': 'Indium'},
  'Sn': {'number': 50, 'name': 'Tin'},
  'Sb': {'number': 51, 'name': 'Antimony'},
  'Te': {'number': 52, 'name': 'Tellurium'},
  'I': {'number': 53, 'name': 'Iodine'},
  'Xe': {'number': 54, 'name': 'Xenon'},
  'Cs': {'number': 55, 'name': 'Caesium'},
  'Ba': {'number': 56, 'name': 'Barium'},
  'La': {'number': 57, 'name': 'Lanthanum'},
  'Ce': {'number': 58, 'name': 'Cerium'},
  'Pr': {'number': 59, 'name': 'Praseodymium'},
  'Nd': {'number': 60, 'name': 'Neodymium'},
  'Pm': {'number': 61, 'name': 'Promethium'},
  'Sm': {'number': 62, 'name': 'Samarium'},
  'Eu': {'number': 63, 'name': 'Europium'},
  'Gd': {'number': 64, 'name': 'Gadolinium'},
  'Tb': {'number': 65, 'name': 'Terbium'},
  'Dy': {'number': 66, 'name': 'Dysprosium'},
  'Ho': {'number': 67, 'name': 'Holmium'},
  'Er': {'number': 68, 'name': 'Erbium'},
  'Tm': {'number': 69, 'name': 'Thulium'},
  'Yb': {'number': 70, 'name': 'Ytterbium'},
  'Lu': {'number': 71, 'name': 'Lutetium'},
  'Hf': {'number': 72, 'name': 'Hafnium'},
  'Ta': {'number': 73, 'name': 'Tantalum'},
  'W': {'number': 74, 'name': 'Tungsten'},
  'Re': {'number': 75, 'name': 'Rhenium'},
  'Os': {'number': 76, 'name': 'Osmium'},
  'Ir': {'number': 77, 'name': 'Iridium'},
  'Pt': {'number': 78, 'name': 'Platinum'},
  'Au': {'number': 79, 'name': 'Gold'},
  'Hg': {'number': 80, 'name': 'Mercury'},
  'Tl': {'number': 81, 'name': 'Thallium'},
  'Pb': {'number': 82, 'name': 'Lead'},
  'Bi': {'number': 83, 'name': 'Bismuth'},
  'Po': {'number': 84, 'name': 'Polonium'},
  'At': {'number': 85, 'name': 'Astatine'},
  'Rn': {'number': 86, 'name': 'Radon'},
  'Fr': {'number': 87, 'name': 'Francium'},
  'Ra': {'number': 88, 'name': 'Radium'},
  'Ac': {'number': 89, 'name': 'Actinium'},
  'Th': {'number': 90, 'name': 'Thorium'},
  'Pa': {'number': 91, 'name': 'Protactinium'},
  'U': {'number': 92, 'name': 'Uranium'},
  'Np': {'number': 93, 'name': 'Neptunium'},
  'Pu': {'number': 94, 'name': 'Plutonium'},
  'Am': {'number': 95, 'name': 'Americium'},
  'Cm': {'number': 96, 'name': 'Curium'},
  'Bk': {'number': 97, 'name': 'Berkelium'},
  'Cf': {'number': 98, 'name': 'Californium'},
  'Es': {'number': 99, 'name': 'Einsteinium'},
  'Fm': {'number': 100, 'name': 'Fermium'},
  'Md': {'number': 101, 'name': 'Mendelevium'},
  'No': {'number': 102, 'name': 'Nobelium'},
  'Lr': {'number': 103, 'name': 'Lawrencium'},
  'Rf': {'number': 104, 'name': 'Rutherfordium'},
  'Db': {'number': 105, 'name': 'Dubnium'},
  'Sg': {'number': 106, 'name': 'Seaborgium'},
  'Bh': {'number': 107, 'name': 'Bohrium'},
  'Hs': {'number': 108, 'name': 'Hassium'},
  'Mt': {'number': 109, 'name': 'Meitnerium'},
  'Ds': {'number': 110, 'name': 'Darmstadtium'},
  'Rg': {'number': 111, 'name': 'Roentgenium'},
  'Cn': {'number': 112, 'name': 'Copernicium'}
};

module.exports = SmilesParser;
