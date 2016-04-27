/**
 * Copyright 2010 Paul Novak (paul@wingu.com)
 * Copyright 2015-2016 Benjamin Abel bbig26@gmail.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
'use strict';
const assert = require('assert');
const MathBox = require('../math/box');
const MathCoordinate = require('../math/coordinate');
const mathVec2 = require('../math/vector2d');
const mathMath = require('../math/math');
const utilsArray = require('../utils/array');

const ModelAtom = require('../model/atom');
const ModelBond = require('../model/bond');
const ringFinder = require('../ring/finder');

/**
 * Class representing a Molecule
 *
 * @param {string=}
 *            optName, Name of molecule, defaults to empty string.
 * @constructor
 */
const ModelMolecule = function(optName) {
  /**
   * bonds belonging to this molecule
   *
   * @type {Array.<modelBond>}
   *
   */
  this.bonds = [];

  /**
   * atoms belonging to this molecule
   *
   * @type {Array.<ModelAtom>}
   */
  this.atoms = [];

  /**
   * name of molecule
   *
   * @type {string}
   */
  this.name = optName ? optName : '';

  /**
   * id of molecule
   *
   * @type {string}
   */
  this.id = undefined;

  /**
   * SSSR calculated for this molecule
   */
  this.sssr = [];
  this.mustRecalcSSSR = true;

  /**
   * Keep track of fragments, this avoids the need to ever compute it which is
   * potentially time consuming. This array stores the fragment index for each
   * atom.
   */
  this.fragments = [];
  this.fragmentCount = 0;
};

ModelMolecule.prototype.resetRingCenters = function() {
  this.getRings().forEach(function(ring) { ring.resetRingCenter(); });
};

/**
 * Add a bond to molecule.
 *
 * @param {modelBond} bond - The bond to add.
 */

ModelMolecule.prototype.addBond = function(bond) {
  var sourceIndex = this.indexOfAtom(bond.source);
  var targetIndex = this.indexOfAtom(bond.target);
  // check if the bond connects two previously unconnected fragments
  if (this.fragments[sourceIndex] !== this.fragments[targetIndex]) {
    let before;
    let after;
    if (this.fragments[sourceIndex] < this.fragments[targetIndex]) {
      before = this.fragments[sourceIndex];
      after = this.fragments[targetIndex];
    } else {
      after = this.fragments[sourceIndex];
      before = this.fragments[targetIndex];
    }

    this.fragmentCount--;

    for (let i = 0, li = this.atoms.length; i < li; i++) {
      if (this.fragments[i] === before) {
        this.fragments[i] = after;
      }
    }
  }
  this.bonds.push(bond);
  bond.source.bonds.add(bond);
  bond.target.bonds.add(bond);
  this.addAtom(bond.source);
  this.addAtom(bond.target);
  bond.molecule = this;
};

/**
 * Get the atom of given id.
 *
 * @param {number}
 *            id The atom id.
 * @return {ModelAtom}
 */

ModelMolecule.prototype.getAtom = function(id) {
  return this.atoms[id];
};

/**
 * Get the bond of given id.
 *
 * @param {number}
 *            id The bond id.
 * @return {modelBond}
 */

ModelMolecule.prototype.getBond = function(id) {
  return this.bonds[id];
};

ModelMolecule.prototype.getAverageBondLength = function() {
  var average = 1.25;
  if (this.bonds.length) {
    var sum = this.bonds.reduce((r, b) => r + b.getLength(), 0);
    average = sum / this.bonds.length;
  }
  return average;
};

/**
 * Find the bond between two given atoms if it exists. Otherwise return null.
 *
 * @param {Object} atom1 - first atom
 * @param {Object} atom2 - second atom
 * @return{modelBond} - bond finded
 */
ModelMolecule.prototype.findBond = function(atom1, atom2) {
  var bonds = Array.from(atom1.bonds);
  for (let i = 0, li = bonds.length; i < li; i++) {
    var bond = bonds[i];
    if (bond.otherAtom(atom1) === atom2) {
      return bond;
    }
  }
  return null;
};

/**
 * Return id of given atom. If not found, return -1;
 *
 * @param {ModelAtom}
 *            atom The atom to lookup.
 * @return{number}
 */
ModelMolecule.prototype.indexOfAtom = function(atom) {
  return this.atoms.indexOf(atom);
};

/**
 * Return id of given bond. If not found, return -1;
 *
 * @param {modelBond}
 *            bond The bond to lookup.
 * @return{number}
 */
ModelMolecule.prototype.indexOfBond = function(bond) {
  return this.bonds.indexOf(bond);
};

/**
 * Remove a atom from molecule.
 *
 * @param {number|ModelAtom}
 *            atomOrId Instance or id of the atom to remove.
 */

ModelMolecule.prototype.removeAtom = function(atomOrId) {
  var atom;
  if (atomOrId.constructor === Number) {
    atom = this.atoms[atomOrId];
  } else if (atomOrId.constructor === ModelAtom) {
    atom = atomOrId;
  }
  var neighborBonds = Array.from(atom.bonds);

  neighborBonds.forEach(function(element) { utilsArray.remove(this.bonds, element); }, this);
  atom.bonds.clear();
  utilsArray.remove(this.atoms, atom);
  atom.molecule = undefined;
};

/**
 * Remove a bond from molecule.
 *
 * @param {number|modelBond}
 *            bondOrId Instance or id of the bond to remove.
 */

ModelMolecule.prototype.removeBond = function(bondOrId) {
  let bond;
  let bonds;
  if (bondOrId.constructor === Number) {
    bond = this.bonds[bondOrId];
  } else {
    bond = bondOrId;
  }
  bond.source.bonds.remove(bond);
  bond.target.bonds.remove(bond);
  if (bond.source.Array.from(bonds).length === 0) {
    utilsArray.remove(this.atoms, bond.source);
    bond.source.molecule = undefined;
  }
  if (bond.target.Array.from(bonds).length === 0) {
    utilsArray.remove(this.atoms, bond.target);
    bond.target.molecule = undefined;
  }
  utilsArray.remove(this.bonds, bond);
  bond.molecule = undefined;
  bond.source = undefined;
  bond.target = undefined;
};

/**
 * Count atoms.
 *
 * @return{number}
 */
ModelMolecule.prototype.countAtoms = function() {
  return this.atoms.length;
};

/**
 * Count bonds.
 */
ModelMolecule.prototype.countBonds = function() {
  return this.bonds.length;
};

/**
 * Add an atom to molecule. Does nothing if atom already part of molecule
 *
 * @param {ModelAtom}
 *            atom The atom to add.
 */
ModelMolecule.prototype.addAtom = function(atom) {
  if (!this.atoms.includes(atom)) {
    var index = this.atoms.length;
    // a new atom is always a new fragment
    this.fragmentCount++;
    this.fragments[index] = this.fragmentCount;
    this.atoms.push(atom);
    atom.molecule = this;
  }
};

/**
 * Get rings found in this molecule
 *
 * @return{Array.<ringRing>}
 */
ModelMolecule.prototype.getRings = function() {
  if (this.mustRecalcSSSR) {
    this.sssr = ringFinder.findRings(this);
    this.mustRecalcSSSR = false;
  }
  return this.sssr;
};

/**
 * Checks if atom is in a ring
 *
 * @return{boolean}
 */
ModelMolecule.prototype.isAtomInRing = function(atom_) {
  var rings = this.getRings();
  for (let r = 0, ringCount = rings.length; r < ringCount; r++) {
    for (let a = 0, atomCount = rings[r].atoms.length; a < atomCount; a++) {
      if (atom_ === rings[r].atoms[a]) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Checks if bond is in a ring
 *
 * @return{boolean}
 */
ModelMolecule.prototype.isBondInRing = function(bond_) {
  var rings = this.getRings();
  for (let r = 0, ringCount = rings.length; r < ringCount; r++) {
    for (let b = 0, bondCount = rings[r].bonds.length; b < bondCount; b++) {
      if (bond_ === rings[r].bonds[b]) {
        return true;
      }
    }
  }
  return false;
};

/**
 * clone (shallow) this molecule
 *
 * @return{ModelMolecule}
 */
ModelMolecule.prototype.clone = function() {
  var mol = new ModelMolecule(this.name);
  this.atoms.forEach(function(atom) { mol.addAtom(atom); });
  this.bonds.forEach(function(bond) { mol.addBond(bond); });
  return mol;
};

/**
 * returns fragments as array of molecules
 *
 * @return{Array.<ModelMolecule>}
 */
ModelMolecule.prototype.getFragments = function() {
  var mol = this.clone();
  if (mol.fragmentCount === 1) {
    return [mol];
  }
  var fragments = new Map();
  mol.atoms.forEach(function(atom) {
    var frag = mol.fragments[mol.indexOfAtom(atom)];
    if (fragments.has(frag) === false) {
      fragments.set(frag, new ModelMolecule());
    }
    fragments.get(frag).addAtom(atom);
  });
  mol.bonds.forEach(function(bond) {
    var frag = mol.fragments[mol.indexOfAtom(bond.source)];
    fragments.get(frag).addBond(bond);
  });
  return fragments.getValues();
};

/**
 * Returns all bonds connected to the given atom.
 *
 */
ModelMolecule.prototype.getConnectedBondsList = function(atom) {
  var bondsList = [];
  var bondCount = this.bonds.length;
  for (let i = 0; i < bondCount; i++) {
    if (this.bonds[i].source === atom || this.bonds[i].target === atom) {
      bondsList.push(this.bonds[i]);
    }
  }
  return bondsList;
};

/**
 * string representation of molecule
 *
 * @return {string}
 */
ModelMolecule.prototype.toString = function() {
  return 'ModelMolecule - name: ' + this.name + '\n\t' +
      this.atoms
          .map(
              function(atom) { return ' ' + this.indexOfAtom(atom) + ': ' + atom.toString(); },
              this)
          .join('\n\t') +
      '\n\t' +
      this.bonds
          .map(
              function(bond) {
                return ' ' + this.indexOfAtom(bond.source) + ', ' + this.indexOfAtom(bond.target) +
                    ':  ' + bond.toString();
              },
              this)
          .join('\n\t') +
      '\n\t' + this.getRings().map(function(ring) { return ring.toString(); }).join('\n\t');
};
/**
 * returns center coordinates of molecule's atoms
 *
 * @return {MathCoordinate}
 */
ModelMolecule.prototype.getCenter = function() {
  var box = this.getBoundingBox();
  return new MathCoordinate((box.left + box.right) / 2, (box.top + box.bottom) / 2);
};

/**
 * returns bounding box of molecule's atoms
 *
 * @return {MathBox}
 */
ModelMolecule.prototype.getBoundingBox = function() {
  return MathBox.boundingBox.apply(null, this.atoms.map(function(a) { return a.coord; }));
};

/**
 * sprouts a molecule fragment by merging fragment to this molecule
 * fragAtom is atom of fragment that will be replaced by attachmentAtom of
 * this molecule when the two are merged
 *
 * @param {ModelAtom}
 *            attachmentAtom
 * @param {ModelAtom}
 *            fragement_atom
 * @return {modelBond} sprout bond
 */
ModelMolecule.prototype.sproutFragment = function(attachmentAtom, fragAtom) {
  assert(this.atoms.includes(attachmentAtom), 'attachmentAtom must belong to this molecule');
  assert(
      Object.getPrototypeOf(fragAtom.molecule) === Object.prototype,
      'fragAtom must belong to a molecule');
  var newAngle = ModelAtom.nextBondAngle(attachmentAtom);
  if (newAngle !== undefined) {
    // translate fragment
    var positionDiff =
        mathVec2.fromCoordinate(MathCoordinate.difference(attachmentAtom.coord, fragAtom.coord));
    fragAtom.molecule.rotate(newAngle, fragAtom.coord);
    fragAtom.molecule.translate(positionDiff);
    ModelMolecule.mergeMolecules(fragAtom, attachmentAtom);
  }
};

/**
 * sprouts a new bond at the atom
 *
 * @param {ModelAtom}
 *            atom
 * @param {modelBond.ORDER}
 *            optOrder
 * @param {modelBond.STEREO}
 *            optStereo
 * @param {String}
 *            optSymbol
 * @return {modelBond}
 */
ModelMolecule.prototype.sproutBond = function(atom, optOrder, optStereo, optSymbol) {
  var bondLength = 1.25;  // default
  var bonds = Array.from(atom.bonds);
  if (bonds.length) {
    bondLength = bonds.reduce(function(r, b) {
      return r + MathCoordinate.distance(b.source.coord, b.target.coord);
    }, 0) / bonds.length;
  }  // average of other bonds

  var newAngle = ModelAtom.nextBondAngle(atom);
  if (newAngle !== undefined) {
    var symb = 'C';
    if (optSymbol) {
      symb = optSymbol;
    }
    var newAtom = new ModelAtom(
        symb, atom.coord.x + mathMath.angleDx(newAngle, bondLength),
        atom.coord.y + mathMath.angleDy(newAngle, bondLength));

    var newBond = new ModelBond(atom, newAtom, optOrder, optStereo);

    this.addAtom(newAtom);
    this.addBond(newBond);
    return newBond;
  }
};

module.exports = ModelMolecule;
