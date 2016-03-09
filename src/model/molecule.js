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

goog.require('goog.debug.Logger');
goog.require('goog.math.Vec2');
goog.require('goog.math.Box');

const ModelAtom = require('../model/atom');
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
   * @type {Array.<kemia.model.Bond>}
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
 * @param {kemia.model.Bond}
 *            bond The bond to add.
 */

ModelMolecule.prototype.addBond = function(bond) {
  var sourceIndex = this.indexOfAtom(bond.source);
  var targetIndex = this.indexOfAtom(bond.target);
  // check if the bond connects two previously unconnected fragments
  if (this.fragments[sourceIndex] !== this.fragments[targetIndex]) {
    var before, after;
    if (this.fragments[sourceIndex] < this.fragments[targetIndex]) {
      before = this.fragments[sourceIndex];
      after = this.fragments[targetIndex];
    } else {
      after = this.fragments[sourceIndex];
      before = this.fragments[targetIndex];
    }

    this.fragmentCount--;

    for (var i = 0, li = this.atoms.length; i < li; i++) {
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
 * @return {kemia.model.Bond}
 */

ModelMolecule.prototype.getBond = function(id) {
  return this.bonds[id];
};

ModelMolecule.prototype.getAverageBondLength = function() {
  var average = 1.25;
  if (this.bonds.length) {
    var sum = goog.array.reduce(this.bonds, function(r, b) { return r + b.getLength(); }, 0);
    average = sum / this.bonds.length;
  }
  return average;
};

/**
 * Find the bond between two given atoms if it exists. Otherwise return null.
 *
 * @param {Object}
 *            atom1
 * @param {Object}
 *            atom2
 * @return{kemia.model.Bond}
 */
ModelMolecule.prototype.findBond = function(atom1, atom2) {
  var bonds = Array.from(atom1.bonds);
  for (var i = 0, li = bonds.length; i < li; i++) {
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
  return goog.array.indexOf(this.atoms, atom);
};

/**
 * Return id of given bond. If not found, return -1;
 *
 * @param {kemia.model.Bond}
 *            bond The bond to lookup.
 * @return{number}
 */
ModelMolecule.prototype.indexOfBond = function(bond) {
  return goog.array.indexOf(this.bonds, bond);
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

  goog.array.forEach(
      neighborBonds, function(element) { goog.array.remove(this.bonds, element); }, this);
  atom.bonds.clear();
  goog.array.remove(this.atoms, atom);
  atom.molecule = undefined;

};

/**
 * Remove a bond from molecule.
 *
 * @param {number|kemia.model.Bond}
 *            bondOrId Instance or id of the bond to remove.
 */

ModelMolecule.prototype.removeBond = function(bondOrId) {
  var bond;
  if (bondOrId.constructor === Number) {
    bond = this.bonds[bondOrId];
  } else {
    bond = bondOrId;
  }
  bond.source.bonds.remove(bond);
  bond.target.bonds.remove(bond);
  if (bond.source.Array.from(bonds).length === 0) {
    goog.array.remove(this.atoms, bond.source);
    bond.source.molecule = undefined;
  }
  if (bond.target.Array.from(bonds).length === 0) {
    goog.array.remove(this.atoms, bond.target);
    bond.target.molecule = undefined;
  }
  goog.array.remove(this.bonds, bond);
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
  if (!goog.array.contains(this.atoms, atom)) {
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
 * @return{Array.<kemia.ring.Ring>}
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
  for (var r = 0, ringCount = rings.length; r < ringCount; r++) {
    for (var a = 0, atomCount = rings[r].atoms.length; a < atomCount; a++) {
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
  for (var r = 0, ringCount = rings.length; r < ringCount; r++) {
    for (var b = 0, bondCount = rings[r].bonds.length; b < bondCount; b++) {
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
  for (var i = 0; i < bondCount; i++) {
    if (this.bonds[i].source === atom || this.bonds[i].target === atom)
      bondsList.push(this.bonds[i]);
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
 * @return {goog.math.Coordinate}
 */
ModelMolecule.prototype.getCenter = function() {
  var box = this.getBoundingBox();
  return new goog.math.Coordinate((box.left + box.right) / 2, (box.top + box.bottom) / 2);
};

/**
 * returns bounding box of molecule's atoms
 *
 * @return {goog.math.Box}
 */
ModelMolecule.prototype.getBoundingBox = function() {
  return goog.math.Box.boundingBox.apply(null, this.atoms.map(function(a) { return a.coord; }));
};

/**
 * translate molecule coordinates
 *
 * @param {goog.math.Vec2}
 *            vector, x and y change amounts
 *
 */
ModelMolecule.prototype.translate = function(vector) {
  goog.array.forEach(
      this.atoms, function(a) { a.coord = goog.math.Coordinate.sum(a.coord, vector); });
};

/**
 * merge with a molecule fragment targetBond replaces fragBond and targetAtom
 * replaces fragAtom
 *
 * @param {ModelMolecule}
 *            fragment
 * @param {kemia.model.Bond}
 *            fragBond bond in fragment to be replaced by target bond
 * @param {kemia.model.Bond}
 *            targetBond bond in this molecule to replace fragBond
 * @param {ModelAtom}
 *            fragAtom atom in fragBond to be replaced by targetAtom
 * @param {ModelAtom}
 *            targetAtom atom in this molecule to replace fragAtom
 */
ModelMolecule.prototype.merge = function(fragment, fragBond, targetBond, fragAtom, targetAtom) {
  goog.asserts.assert(goog.array.contains(fragment.bonds, fragBond));
  goog.asserts.assert(goog.array.contains(this.bonds, targetBond));
  goog.asserts.assert(goog.array.contains(fragArray.from(atom.bonds), fragBond));
  goog.asserts.assert(goog.array.contains(targetArray.from(atom.bonds), targetBond));

  // scale and translate and rotate fragment into position
  var scale = this.getAverageBondLength() / fragment.getAverageBondLength();
  fragment.scale(scale);
  var positionDiff = goog.math.Vec2.fromCoordinate(
      goog.math.Coordinate.difference(targetAtom.coord, fragAtom.coord));
  var otherTargetAtom = targetBond.otherAtom(targetAtom);
  var targetAngle = goog.math.angle(
      otherTargetAtom.coord.x, otherTargetAtom.coord.y, targetAtom.coord.x, targetAtom.coord.y);
  var otherFragAtom = fragBond.otherAtom(fragAtom);
  var fragAngle = goog.math.angle(
      fragAtom.coord.x, fragAtom.coord.y, otherFragAtom.coord.x, otherFragAtom.coord.y);
  var angleDiff = goog.math.angleDifference(fragAngle, targetAngle);

  fragment.rotate(180 + angleDiff, fragAtom.coord);
  fragment.translate(positionDiff);

  // merge fragment into this molecule
  // transfer bonds attached to fragAtom (except fragBond, which will be discarded) to
  // targetAtom
  var processed = [fragBond];
  fragArray.from(atom.bonds).forEach(function(bond) {
    if (!goog.array.contains(processed, bond)) {
      fragAtom === bond.source ? bond.source = targetAtom : bond.target = targetAtom;
      processed.push(bond);
      this.addBond(bond);
    }
  }, this);
  var otherFragAtom = fragBond.otherAtom(fragAtom);
  var otherTargetAtom = targetBond.otherAtom(targetAtom);

  // transfer bonds attached to other end of fragBond to atom at
  // other end of targetBond (except fragBond)
  otherFragArray.from(atom.bonds).forEach(function(bond) {
    if (!goog.array.contains(processed, bond)) {
      otherFragAtom === bond.source ? bond.source = otherTargetAtom : bond.target = otherTargetAtom;
      this.addBond(bond);
      processed.push(bond);
    }
  }, this);

  var yesCopy =
      goog.array.filter(fragment.bonds, function(b) { return !goog.array.contains(processed, b); });

  // clone and replace fragment atoms and bonds parent molecule with this
  // parent molecule
  yesCopy, function(bond) { this.addBond(bond); }.forEach(this);
  fragment.bonds.length = 0;
  fragment.atoms.length = 0;

  if (fragment.reaction) {
    fragment.reaction.removeMolecule(fragment);
  }
  // delete fragment;
  this.mustRecalcSSSR = true;

  return this;
};

///**
// * merge two molecules at a single atom
// *
// * @param{ModelAtom} source_atom, the atom that will be kept
// * @param{ModelAtom} targetAtom, the atom that will be replaced
// *
// * @return{ModelMolecule} resulting merged molecule
// */
// ModelMolecule.mergeMolecules = function(source_atom, targetAtom) {
//	// replace target atom with source atom
//
//	// clone and connect target atom bonds to source atom
//	var source_molecule = source_atom.molecule;
//	var target_molecule = targetAtom.molecule;
//
//	targetArray.from(atom.bonds).forEach(function(bond) {
//		var newBond = bond.clone();
//		targetAtom === newBond.source ? newBond.source = source_atom
//				: newBond.target = source_atom;
//		target_molecule.addBond(newBond);
//		target_molecule.removeBond(bond);
//	});
//	target_molecule.removeAtom(targetAtom);
//
//	source_molecule.atoms.forEach(function(atom) {
//		target_molecule.addAtom(atom);
//	});
//
//	// replace source atom and bonds parent molecule with target parent molecule
//	source_molecule.bonds.forEach(function(bond) {
//		var newBond = bond.clone();
//		newBond.molecule = undefined;
//		target_molecule.addBond(newBond);
//	});
//	source_molecule.atoms.forEach(function(atom) {
//		source_molecule.removeAtom(atom);
//	});
//	source_molecule.bonds.forEach(function(bond) {
//		source_molecule.removeBond(bond);
//	});
//
//	if (source_molecule.reaction) {
//		source_molecule.reaction.removeMolecule(source_molecule);
//	}
//	delete source_molecule;
//	return target_molecule;
//}

/**
 * sprouts a molecule fragment by merging fragment to this molecule
 * fragAtom is atom of fragment that will be replaced by attachmentAtom of
 * this molecule when the two are merged
 *
 * @param {ModelAtom}
 *            attachmentAtom
 * @param {ModelAtom}
 *            fragement_atom
 * @return {kemia.model.Bond} sprout bond
 */
ModelMolecule.prototype.sproutFragment = function(attachmentAtom, fragAtom) {
  goog.asserts.assert(
      goog.array.contains(this.atoms, attachmentAtom),
      'attachmentAtom must belong to this molecule');
  goog.asserts.assertObject(fragAtom.molecule, 'fragAtom must belong to a molecule');
  var newAngle = ModelAtom.nextBondAngle(attachmentAtom);
  // this.logger.info('newAngle ' + newAngle);
  if (newAngle !== undefined) {
    // translate fragment
    var positionDiff = goog.math.Vec2.fromCoordinate(
        goog.math.Coordinate.difference(attachmentAtom.coord, fragAtom.coord));
    var angleDiff = goog.math.angle();
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
 * @param {kemia.model.Bond.ORDER}
 *            optOrder
 * @param {kemia.model.Bond.STEREO}
 *            optStereo
 * @param {String}
 *            optSymbol
 * @return {kemia.model.Bond}
 */
ModelMolecule.prototype.sproutBond = function(atom, optOrder, optStereo, optSymbol) {
  var bondLength = 1.25;  // default
  var bonds = Array.from(atom.bonds);
  if (bonds.length) {
    bondLength = goog.array.reduce(bonds, function(r, b) {
      return r + goog.math.Coordinate.distance(b.source.coord, b.target.coord);
    }, 0) / bonds.length;
  }  // average of other bonds

  var newAngle = ModelAtom.nextBondAngle(atom);
  if (newAngle !== undefined) {
    var symb = 'C';
    if (optSymbol) symb = optSymbol;
    var newAtom = new ModelAtom(
        symb, atom.coord.x + goog.math.angleDx(newAngle, bondLength),
        atom.coord.y + goog.math.angleDy(newAngle, bondLength));

    var newBond = new kemia.model.Bond(atom, newAtom, optOrder, optStereo);

    this.addAtom(newAtom);
    this.addBond(newBond);
    return newBond;
  }
};

/**
 * The logger for this class.
 *
 * @type {goog.debug.Logger}
 * @protected
 */
ModelMolecule.prototype.logger = goog.debug.Logger.getLogger('ModelMolecule');

module.exports = ModelMolecule;
