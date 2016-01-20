/**
 * Copyright 2010 Paul Novak (paul@wingu.com)
 * Copyright 2015 Benjamin Abel bbig26@gmail.com
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
goog.require('goog.array');
const ringFinder = require('../ring/finder');
const modelAtom = require('../model/atom');
goog.require('goog.debug.Logger');
goog.require('goog.math.Vec2');
goog.require('goog.math.Box');

/**
 * Class representing a Molecule
 *
 * @param {string=}
 *            opt_name, Name of molecule, defaults to empty string.
 * @constructor
 */
module.exports = modelMolecule = function(opt_name) {
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
	 * @type {Array.<modelAtom>}
	 */
	this.atoms = [];

	/**
	 * name of molecule
	 *
	 * @type {string}
	 */
	this.name = opt_name ? opt_name : "";

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

modelMolecule.prototype.resetRingCenters = function() {
	goog.array.forEach(this.getRings(), function(ring) {
		ring.resetRingCenter();
	});
};
/**
 * Add a bond to molecule.
 *
 * @param {kemia.model.Bond}
 *            bond The bond to add.
 */

modelMolecule.prototype.addBond = function(bond) {
	var sourceIndex = this.indexOfAtom(bond.source);
	var targetIndex = this.indexOfAtom(bond.target);
	// check if the bond connects two previously unconnected fragments
	if (this.fragments[sourceIndex] != this.fragments[targetIndex]) {
		var before, after;
		if (this.fragments[sourceIndex] < this.fragments[targetIndex]) {
			before = this.fragments[sourceIndex];
			after = this.fragments[targetIndex];
		} else {
			after = this.fragments[sourceIndex];
			before = this.fragments[targetIndex];
		}

		this.fragmentCount--;

		for ( var i = 0, li = this.atoms.length; i < li; i++) {
			if (this.fragments[i] == before) {
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
 * @return {modelAtom}
 */

modelMolecule.prototype.getAtom = function(id) {
	return this.atoms[id];
};

/**
 * Get the bond of given id.
 *
 * @param {number}
 *            id The bond id.
 * @return {kemia.model.Bond}
 */

modelMolecule.prototype.getBond = function(id) {
	return this.bonds[id];
};

modelMolecule.prototype.getAverageBondLength = function() {
	var average = 1.25;
	if (this.bonds.length) {
		var sum = goog.array.reduce(this.bonds, function(r, b) {
			return r + b.getLength();
		}, 0);
		average = sum / this.bonds.length;
	}
	return average;
}

/**
 * Find the bond between two given atoms if it exists. Otherwise return null.
 *
 * @param {Object}
 *            atom1
 * @param {Object}
 *            atom2
 * @return{kemia.model.Bond}
 */
modelMolecule.prototype.findBond = function(atom1, atom2) {
	var bonds = atom1.bonds.getValues();
	for ( var i = 0, li = bonds.length; i < li; i++) {
		var bond = bonds[i];
		if (bond.otherAtom(atom1) == atom2) {
			return bond;
		}
	}
	return null;
};

/**
 * Return id of given atom. If not found, return -1;
 *
 * @param {modelAtom}
 *            atom The atom to lookup.
 * @return{number}
 */
modelMolecule.prototype.indexOfAtom = function(atom) {
	return goog.array.indexOf(this.atoms, atom);
};

/**
 * Return id of given bond. If not found, return -1;
 *
 * @param {kemia.model.Bond}
 *            bond The bond to lookup.
 * @return{number}
 */
modelMolecule.prototype.indexOfBond = function(bond) {
	return goog.array.indexOf(this.bonds, bond);
};

/**
 * Remove a atom from molecule.
 *
 * @param {number|modelAtom}
 *            atomOrId Instance or id of the atom to remove.
 */

modelMolecule.prototype.removeAtom = function(atomOrId) {
	var atom;
	if (atomOrId.constructor == Number) {
		atom = this.atoms[atomOrId];
	} else if (atomOrId.constructor == modelAtom) {
		atom = atomOrId;
	}
	var neighborBonds = atom.bonds.getValues();

	goog.array.forEach(neighborBonds, function(element) {
		goog.array.remove(this.bonds, element);
	}, this);
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

modelMolecule.prototype.removeBond = function(bondOrId) {
	var bond;
	if (bondOrId.constructor == Number) {
		bond = this.bonds[bondOrId];
	} else {
		bond = bondOrId;
	}
	bond.source.bonds.remove(bond);
	bond.target.bonds.remove(bond);
	if (bond.source.bonds.getValues().length == 0) {
		goog.array.remove(this.atoms, bond.source);
		bond.source.molecule = undefined;
	}
	if (bond.target.bonds.getValues().length == 0) {
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
modelMolecule.prototype.countAtoms = function() {
	return this.atoms.length;
};

/**
 * Count bonds.
 */
modelMolecule.prototype.countBonds = function() {
	return this.bonds.length;
};

/**
 * Add an atom to molecule. Does nothing if atom already part of molecule
 *
 * @param {modelAtom}
 *            atom The atom to add.
 */
modelMolecule.prototype.addAtom = function(atom) {
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
modelMolecule.prototype.getRings = function() {

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
modelMolecule.prototype.isAtomInRing = function(atom_) {
	var rings = this.getRings();
	for (var r = 0, ringCount = rings.length; r < ringCount; r++) {
		for (var a = 0, atomCount = rings[r].atoms.length; a < atomCount; a++) {
			if (atom_ == rings[r].atoms[a]) {
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
modelMolecule.prototype.isBondInRing = function(bond_) {
	var rings = this.getRings();
	for (var r = 0, ringCount = rings.length; r < ringCount; r++) {
		for (var b = 0, bondCount = rings[r].bonds.length; b < bondCount; b++) {
			if (bond_ == rings[r].bonds[b]) {
				return true;
			}
		}
	}
	return false;
};

/**
 * clone (shallow) this molecule
 *
 * @return{modelMolecule}
 */
modelMolecule.prototype.clone = function() {
	var mol = new modelMolecule(this.name);
	goog.array.forEach(this.atoms, function(atom) {
		mol.addAtom(atom);
	});
	goog.array.forEach(this.bonds, function(bond) {
		mol.addBond(bond);
	});
	return mol;
};

/**
 * returns fragments as array of molecules
 *
 * @return{Array.<modelMolecule>}
 */
modelMolecule.prototype.getFragments = function() {
	var mol = this.clone();
	if (mol.fragmentCount == 1) {
		return [ mol ];
	}
	var fragments = new goog.structs.Map();
	goog.array.forEach(mol.atoms, function(atom) {
		var frag = mol.fragments[mol.indexOfAtom(atom)];
		if (fragments.containsKey(frag) == false) {
			fragments.set(frag, new modelMolecule());
		}
		fragments.get(frag).addAtom(atom);
	});
	goog.array.forEach(mol.bonds, function(bond) {
		var frag = mol.fragments[mol.indexOfAtom(bond.source)];
		fragments.get(frag).addBond(bond);
	});
	return fragments.getValues();

};

/**
 * Returns all bonds connected to the given atom.
 *
 */
modelMolecule.prototype.getConnectedBondsList = function(atom) {
	var bondsList = new Array();
	var bondCount = this.bonds.length;
	for (var i = 0; i < bondCount; i++) {
		if (this.bonds[i].source == atom || this.bonds[i].target == atom)
			bondsList.push(this.bonds[i]);
	}
	return bondsList;
};

/**
 * string representation of molecule
 *
 * @return {string}
 */
modelMolecule.prototype.toString = function() {
	return 'modelMolecule - name: '
			+ this.name
			+ "\n\t"
			+ goog.array.map(this.atoms, function(atom) {
				return " " + this.indexOfAtom(atom) + ": " + atom.toString();
			}, this).join("\n\t")
			+ "\n\t"
			+ goog.array.map(
					this.bonds,
					function(bond) {
						return " " + this.indexOfAtom(bond.source) + ", "
								+ this.indexOfAtom(bond.target) + ":  "
								+ bond.toString();
					}, this).join("\n\t") + "\n\t"
			+ goog.array.map(
					this.getRings(),
					function(ring){
						return ring.toString();
					}).join("\n\t");
};
/**
 * returns center coordinates of molecule's atoms
 *
 * @return {goog.math.Coordinate}
 */
modelMolecule.prototype.getCenter = function() {
	var box = this.getBoundingBox();
	return new goog.math.Coordinate((box.left + box.right) / 2,
			(box.top + box.bottom) / 2);
};

/**
 * returns bounding box of molecule's atoms
 *
 * @return {goog.math.Box}
 */
modelMolecule.prototype.getBoundingBox = function() {
	return goog.math.Box.boundingBox.apply(null, goog.array.map(this.atoms,
			function(a) {
				return a.coord;
			}));
};

/**
 * translate molecule coordinates
 *
 * @param {goog.math.Vec2}
 *            vector, x and y change amounts
 *
 */
modelMolecule.prototype.translate = function(vector) {
	goog.array.forEach(this.atoms, function(a) {
		a.coord = goog.math.Coordinate.sum(a.coord, vector);
	});
};


/**
 * merge with a molecule fragment target_bond replaces frag_bond and target_atom
 * replaces frag_atom
 *
 * @param {modelMolecule}
 *            fragment
 * @param {kemia.model.Bond}
 *            frag_bond bond in fragment to be replaced by target bond
 * @param {kemia.model.Bond}
 *            target_bond bond in this molecule to replace frag_bond
 * @param {modelAtom}
 *            frag_atom atom in frag_bond to be replaced by target_atom
 * @param {modelAtom}
 *            target_atom atom in this molecule to replace frag_atom
 */
modelMolecule.prototype.merge = function(fragment, frag_bond,
		target_bond, frag_atom, target_atom) {
	goog.asserts.assert(goog.array.contains(fragment.bonds, frag_bond));
	goog.asserts.assert(goog.array.contains(this.bonds, target_bond));
	goog.asserts.assert(goog.array.contains(frag_atom.bonds.getValues(),
			frag_bond));
	goog.asserts.assert(goog.array.contains(target_atom.bonds.getValues(),
			target_bond));

	// scale and translate and rotate fragment into position
	var scale = this.getAverageBondLength() / fragment.getAverageBondLength();
	fragment.scale(scale);
	var position_diff = goog.math.Vec2.fromCoordinate(goog.math.Coordinate
			.difference(target_atom.coord, frag_atom.coord));
	var other_target_atom = target_bond.otherAtom(target_atom);
	var target_angle = goog.math
			.angle(other_target_atom.coord.x, other_target_atom.coord.y,
					target_atom.coord.x, target_atom.coord.y);
	var other_frag_atom = frag_bond.otherAtom(frag_atom);
	var fragment_angle = goog.math.angle(frag_atom.coord.x, frag_atom.coord.y,
			other_frag_atom.coord.x, other_frag_atom.coord.y);
	var angle_diff = goog.math.angleDifference(fragment_angle, target_angle);

	fragment.rotate(180 + angle_diff, frag_atom.coord);
	fragment.translate(position_diff);

	// merge fragment into this molecule
	// transfer bonds attached to frag_atom (except frag_bond, which will be discarded) to
	// target_atom
	var processed = [frag_bond];
	goog.array.forEach(frag_atom.bonds.getValues(), function(bond) {
		if (!goog.array.contains(processed, bond)) {
			frag_atom == bond.source ? bond.source = target_atom
					: bond.target = target_atom;
			processed.push(bond);
			this.addBond(bond);
		}
	}, this);
	var other_frag_atom = frag_bond.otherAtom(frag_atom);
	var other_target_atom = target_bond.otherAtom(target_atom);

	// transfer bonds attached to other end of frag_bond to atom at
	// other end of target_bond (except frag_bond)
	goog.array
			.forEach(
					other_frag_atom.bonds.getValues(),
					function(bond) {
						if (!goog.array.contains(processed, bond)) {
							other_frag_atom == bond.source ? bond.source = other_target_atom
									: bond.target = other_target_atom;
							this.addBond(bond);
							processed.push(bond);
						}
					}, this);


	var yes_copy = goog.array.filter(fragment.bonds, function(b){
		return !goog.array.contains(processed, b);
	})

	// clone and replace fragment atoms and bonds parent molecule with this
	// parent molecule
	goog.array.forEach(yes_copy, function(bond) {
		this.addBond(bond);
	}, this);
	fragment.bonds.length=0;
	fragment.atoms.length=0;


	if (fragment.reaction) {
		fragment.reaction.removeMolecule(fragment);
	}
	delete fragment;
	this.mustRecalcSSSR=true;

	return this;
}

///**
// * merge two molecules at a single atom
// *
// * @param{modelAtom} source_atom, the atom that will be kept
// * @param{modelAtom} target_atom, the atom that will be replaced
// *
// * @return{modelMolecule} resulting merged molecule
// */
//modelMolecule.mergeMolecules = function(source_atom, target_atom) {
//	// replace target atom with source atom
//
//	// clone and connect target atom bonds to source atom
//	var source_molecule = source_atom.molecule;
//	var target_molecule = target_atom.molecule;
//
//	goog.array.forEach(target_atom.bonds.getValues(), function(bond) {
//		var new_bond = bond.clone();
//		target_atom == new_bond.source ? new_bond.source = source_atom
//				: new_bond.target = source_atom;
//		target_molecule.addBond(new_bond);
//		target_molecule.removeBond(bond);
//	});
//	target_molecule.removeAtom(target_atom);
//
//	goog.array.forEach(source_molecule.atoms, function(atom) {
//		target_molecule.addAtom(atom);
//	});
//
//	// replace source atom and bonds parent molecule with target parent molecule
//	goog.array.forEach(source_molecule.bonds, function(bond) {
//		var new_bond = bond.clone();
//		new_bond.molecule = undefined;
//		target_molecule.addBond(new_bond);
//	});
//	goog.array.forEach(source_molecule.atoms, function(atom) {
//		source_molecule.removeAtom(atom);
//	});
//	goog.array.forEach(source_molecule.bonds, function(bond) {
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
 * fragment_atom is atom of fragment that will be replaced by attachment_atom of
 * this molecule when the two are merged
 *
 * @param {modelAtom}
 *            attachment_atom
 * @param {modelAtom}
 *            fragement_atom
 * @return {kemia.model.Bond} sprout bond
 */
modelMolecule.prototype.sproutFragment = function(attachment_atom,
		fragment_atom) {
	goog.asserts.assert(goog.array.contains(this.atoms, attachment_atom),
			'attachment_atom must belong to this molecule');
	goog.asserts.assertObject(fragment_atom.molecule,
			'fragment_atom must belong to a molecule')
	var new_angle = modelAtom.nextBondAngle(attachment_atom);
	//this.logger.info('new_angle ' + new_angle);
	if (new_angle != undefined) {
		// translate fragment
		var position_diff = goog.math.Vec2.fromCoordinate(goog.math.Coordinate
				.difference(attachment_atom.coord, fragment_atom.coord));
		var angle_diff = goog.math.angle()
		fragment_atom.molecule.rotate(new_angle, fragment_atom.coord);
		fragment_atom.molecule.translate(position_diff);
		modelMolecule.mergeMolecules(fragment_atom, attachment_atom);
	}
}

/**
 * sprouts a new bond at the atom
 *
 * @param {modelAtom}
 *            atom
 * @param {kemia.model.Bond.ORDER}
 *            opt_order
 * @param {kemia.model.Bond.STEREO}
 *            opt_stereo
 * @param {String}
 *            opt_symbol
 * @return {kemia.model.Bond}
 */
modelMolecule.prototype.sproutBond = function(atom, opt_order,
		opt_stereo, opt_symbol) {
	var bond_length = 1.25; // default
	var bonds = atom.bonds.getValues();
	if (bonds.length) {
		bond_length = goog.array.reduce(bonds, function(r, b) {
			return r
					+ goog.math.Coordinate.distance(b.source.coord,
							b.target.coord);
		}, 0)
				/ bonds.length;
	} // average of other bonds

	var new_angle = modelAtom.nextBondAngle(atom);
	if (new_angle != undefined) {
		var symb="C";
		if (opt_symbol)
		  symb=opt_symbol;
		var new_atom = new modelAtom(symb, atom.coord.x
				+ goog.math.angleDx(new_angle, bond_length), atom.coord.y
				+ goog.math.angleDy(new_angle, bond_length));

		var new_bond = new kemia.model.Bond(atom, new_atom, opt_order,
				opt_stereo);

		this.addAtom(new_atom);
		this.addBond(new_bond);
		return new_bond;
	}
};

/**
 * The logger for this class.
 *
 * @type {goog.debug.Logger}
 * @protected
 */
modelMolecule.prototype.logger = goog.debug.Logger
		.getLogger('modelMolecule');
