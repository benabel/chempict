/*
 * Copyright 2010 Paul Novak paul@wingu.com
 * Copyright 2015 Benjamin Abel bbig26@gmail.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

goog.require('goog.math');
goog.require('goog.math.Coordinate');

const modelFlags = require('../model/flags.js');
const modelMolecule = require('../model/molecule.js');

const layoutVector2D = require('./vector2d');
const layoutAtomPlacer = require('./atom_placer');

module.exports = layoutRingPlacer = function() {
 };
/**
 * finds center of first ring
 *
 * @param {kemia.ring.Ring}
 *            ring, subject ring
 * @param {layoutVector2D}
 *            bondVector location of first bond
 * @param {number}
 *            bondLength
 * @return {layoutVector2D}
 */
 layoutRingPlacer.getRingCenterOfFirstRing = function(ring, bondVector,bondLength) {

        var size = ring.atoms.length;
        var radius = bondLength / (2 * Math.sin((Math.PI) / size));
        var newRingPerpendicular = Math.sqrt(Math.pow(radius, 2) - Math.pow(bondLength/2, 2));
        /* get the angle between the x axis and the bond vector */
        var rotangle = layoutAtomPlacer.getAngle(bondVector.x, bondVector.y);
        rotangle += Math.PI / 2;
        return new layoutVector2D(Math.cos(rotangle) * newRingPerpendicular, Math.sin(rotangle) * newRingPerpendicular);
};

/**
 * Generated coordinates for a given ring. Dispatches to special handlers for
 * the different possible situations (spiro-, fusion-, bridged attachment)
 *
 * @param ring
 *            The ring to be placed
 * @param sharedAtoms
 *            {object} The atoms of this ring, also members of another ring,
 *            which are already placed
 * @param sharedAtomsCenter
 *            The geometric center of these atoms
 * @param ringCenterVector
 *            A vector pointing the the center of the new ring
 * @param bondLength
 *            The standard bondlength
 */
layoutRingPlacer.placeRing = function(ring, shared_fragment,
		shared_fragment_center, ringCenterVector, bondLength) {
	var sharedAtomCount = shared_fragment.atoms.length;
	if (sharedAtomCount > 2) {
		layoutRingPlacer.placeBridgedRing(ring, shared_fragment,
				shared_fragment_center, ringCenterVector, bondLength);
	} else if (sharedAtomCount === 2) {
		layoutRingPlacer.placeFusedRing(ring, shared_fragment,
				shared_fragment_center, ringCenterVector, bondLength);
	} else if (sharedAtomCount === 1) {
		layoutRingPlacer.placeSpiroRing(ring, shared_fragment,
				shared_fragment_center, ringCenterVector, bondLength);
	}
};

layoutRingPlacer.placeRingSubstituents = function(molec, ringset, bondLength) {
	var treated_atoms = new modelMolecule();
	var cntDbg=0;
	goog.array.forEach(ringset, function(ring) {
		goog.array.forEach(ring.atoms, function(atom) {
			var unplaced_partners = new modelMolecule();
			var shared_atoms = new modelMolecule();
			var rings = goog.array.filter(ringset, function(r) {
				return goog.array.contains(r.atoms, atom);
			});
			var rings_atoms = goog.array.flatten(goog.array.map(rings,
					function(r) {
				return r.atoms;
			}));
			var center_of_ring_gravity = layoutRingPlacer
			.center(rings_atoms);
			cntDbg+=layoutAtomPlacer.partitionPartners(molec, atom, unplaced_partners,
					shared_atoms);

			layoutAtomPlacer.markNotPlaced(unplaced_partners.atoms);
			goog.array.forEach(unplaced_partners.atoms, function(atom){
				treated_atoms.addAtom(atom);
			});
			if (unplaced_partners.atoms.length > 0) {
				layoutAtomPlacer.distributePartners(atom, shared_atoms,
						center_of_ring_gravity, unplaced_partners, bondLength);
			}
		});
	});
	return treated_atoms;
};



/**
 * Generated coordinates for a bridged ring.
 *
 * @param ring
 *            The ring to be placed
 * @param shared_fragment
 *            The atoms of this ring, also members of another ring, which are
 *            already placed
 * @param shared_fragment_center
 *            The geometric center of these atoms
 * @param ringCenterVector
 *            A vector pointing the the center of the new ring
 * @param bondLength
 *            The standard bondlength
 */
layoutRingPlacer.placeBridgedRing = function(ring, shared_fragment,
		shared_fragment_center, ringCenterVector, bondLength) {

	var radius = layoutRingPlacer.getNativeRingRadius(ring.atoms.length,bondLength);
	ringCenterVector.normalize();
	ringCenterVector.scale(radius);
    var ringCenter = new goog.math.Coordinate(shared_fragment_center.x+ringCenterVector.x, shared_fragment_center.y+ringCenterVector.y);


	var bridgeAtoms = layoutRingPlacer.getBridgeAtoms(shared_fragment);

	var bondAtom1 = bridgeAtoms[0];
	var bondAtom2 = bridgeAtoms[1];

	var bondAtom1Vector = new layoutVector2D(bondAtom1.coord.x,
			bondAtom1.coord.y);
	var bondAtom2Vector = new layoutVector2D(bondAtom2.coord.x,
			bondAtom2.coord.y);

	bondAtom1Vector.sub(ringCenterVector);
	bondAtom2Vector.sub(ringCenterVector);

	var occupiedAngle = bondAtom1Vector.angle(bondAtom2Vector);

	var remainingAngle = (2 * Math.PI) - occupiedAngle;
	var addAngle = remainingAngle
	/ (ring.atoms.length - shared_fragment.atoms.length + 1);

	var startAtom = layoutRingPlacer.findStartAtom(ringCenterVector,
			bondAtom1, bondAtom2);
	var startAngle = goog.math.toRadians(goog.math.angle(startAtom.coord.x, startAtom.coord.y, ringCenterVector.x, ringCenterVector.y));

	var atoms_to_place = layoutRingPlacer.atomsInPlacementOrder(
			startAtom, shared_fragment.bonds[0], ring.bonds);

	var addAngle = addAngle
	* layoutRingPlacer.findDirection(ringCenterVector,
			bondAtom1, bondAtom2);
	layoutAtomPlacer.populatePolygonCorners(atoms_to_place, ringCenter, startAngle,
			addAngle, radius);
};

layoutRingPlacer.atomsInPlacementOrder = function(atom, bond, bonds) {
	var next_bond = goog.array.find(bonds, function(b) {
		return b.otherAtom(atom);
	});

	var remaining_bonds = goog.array.filter(bonds, function(b){
		return b!==next_bond;
	});
	if (remaining_bonds.length > 0 ) {
		var next_atom = next_bond.otherAtom(atom);
		return goog.array.concat(next_atom, layoutRingPlacer
				.atomsInPlacementOrder(next_atom, next_bond, remaining_bonds));
	} else {
		return [];
	}
};
/**
 * determine direction
 *
 * @param {layoutVector2D}
 *            ringCenter
 * @param {kemia.model.Atom}
 *            atom1
 * @param {kemia.model.Atom}
 *            atom2
 *
 * @return{number} 1 or -1
 */
layoutRingPlacer.findDirection = function(ringCenter, atom1, atom2) {
	var result = 1;
	var diff = goog.math.Coordinate.difference(atom1.coord, atom2.coord);

	if (diff.x === 0) {
		// vertical bond
		if (ringCenter.x > atom1.coord.x) {
			result = -1;
		}
	} else {
		// not vertical
		if (ringCenter.y - atom1.coord.y < (ringCenter.x - atom1.coord.x)
				* diff.y / diff.x) {
			result = -1;
		}
	}
	return result;
};

layoutRingPlacer.findStartAtom = function(ringCenter, atom1, atom2) {
	var diff = goog.math.Coordinate.difference(atom1.coord, atom2.coord);
	if (diff.x === 0) {
		// vertical bond
		// start with the lower Atom
		if (atom1.coord.y > atom2.coord.y) {
			return atom1;
		}
	} else {
		// bond is not vertical
		// start with the left Atom
		if (atom1.coord.x > atom2.coord.x) {
			return atom1;
		}
	}
	return atom2;
};

/**
 * Returns the bridge atoms, that is the outermost atoms in the chain of more
 * than two atoms which are shared by two rings
 *
 * @param sharedAtoms
 *            The atoms (n > 2) which are shared by two rings
 * @return The bridge atoms, i.e. the outermost atoms in the chain of more than
 *         two atoms which are shared by two rings
 */
layoutRingPlacer.getBridgeAtoms = function(shared_fragment) {
	var bridge_atoms = [];
	goog.array.forEach(shared_fragment.atoms, function(atom) {
		goog.array.forEach(atom.bonds.getValues(), function(bond) {
			if (goog.array.contains(shared_fragment.bonds, bond)) {
				bridge_atoms.push(bond.otherAtom(atom));
			}
		});
	});
	return bridge_atoms;
};

/**
 * Generated coordinates for a fused ring.
 *
 * @param ring
 *            The ring to be placed
 * @param sharedAtoms
 *            The atoms of this ring, also members of another ring, which are
 *            already placed
 * @param sharedAtomsCenter
 *            The geometric center of these atoms
 * @param ringCenterVector
 *            A vector pointing the the center of the new ring
 * @param bondLength
 *            The standard bondlength
 */
layoutRingPlacer.placeFusedRing = function(ring, sharedAtoms,
		sharedAtomsCenter, ringCenterVector, bondLength) {
    var radius = layoutRingPlacer.getNativeRingRadius(ring.atoms.length,
            bondLength);
    var newRingPerpendicular = Math.sqrt(Math.pow(radius, 2)
            - Math.pow(bondLength / 2, 2));

    ringCenterVector.normalize();
    ringCenterVector.scale(newRingPerpendicular);
    var ringCenter = new goog.math.Coordinate(sharedAtomsCenter.x+ringCenterVector.x, sharedAtomsCenter.y+ringCenterVector.y);

    var bondAtom1 = sharedAtoms.atoms[0];
    var bondAtom2 = sharedAtoms.atoms[1];

    var bondAtom1Vector = new layoutVector2D(bondAtom1.coord.x, bondAtom1.coord.y);
    var bondAtom2Vector = new layoutVector2D(bondAtom2.coord.x, bondAtom2.coord.y);

    var originRingCenterVector = new layoutVector2D(ringCenter.x, ringCenter.y);

    bondAtom1Vector.sub(originRingCenterVector);
    bondAtom2Vector.sub(originRingCenterVector);

    var occupiedAngle = bondAtom1Vector.angle(bondAtom2Vector);

    var remainingAngle = (2 * Math.PI) - occupiedAngle;
    var addAngle = remainingAngle / (ring.atoms.length -  1);

    var centerX = ringCenter.x;
    var centerY = ringCenter.y;

    var xDiff = bondAtom1.coord.x - bondAtom2.coord.x;
    var yDiff = bondAtom1.coord.y - bondAtom2.coord.y;

    var direction = 1;
    // if bond is vertical
    if (xDiff === 0)
    {
    	var startAtom;
        if (bondAtom1.coord.y > bondAtom2.coord.y)
            startAtom = bondAtom1;
        else
            startAtom = bondAtom2;

        // changes the drawing direction
        if (centerX < bondAtom1.coord.x)
            direction = 1;
        else
            direction = -1;
    }
    // if bond is not vertical
    else
    {
        // starts with the left Atom
        if (bondAtom1.coord.x > bondAtom2.coord.x)
            startAtom = bondAtom1;
        else
            startAtom = bondAtom2;

        // changes the drawing direction
        if (centerY - bondAtom1.coord.y > (centerX - bondAtom1.coord.x) * yDiff / xDiff)
            direction = 1;
        else
            direction = -1;
    }
    var startAngle = layoutAtomPlacer.getAngle(startAtom.coord.x - ringCenter.x, startAtom.coord.y - ringCenter.y);

    var currentAtom = startAtom;
    var currentBond = sharedAtoms.bonds[0];

    var atomsToDraw = new Array();
    for (var x1=0,x2=ring.bonds.length-2;x1<x2; x1++)
    {
        currentBond = layoutRingPlacer.getNextBond(ring, currentBond, currentAtom);
        currentAtom = currentBond.otherAtom(currentAtom);
        atomsToDraw.push(currentAtom);
    }
    addAngle = addAngle * direction;
    layoutAtomPlacer.populatePolygonCorners(atomsToDraw, ringCenter, startAngle, addAngle, radius);
};


layoutRingPlacer.getNextBond = function(ring, bond,atom) {
    for (var f = 0; f < ring.bonds.length; f++) {
		if (ring.bonds[f] != bond && (ring.bonds[f].source === atom || ring.bonds[f].target === atom)) {
            return ring.bonds[f];
		}
    }
    return null;
};


/**
 * Generated coordinates for a spiro ring.
 *
 * @param ring
 *            The ring to be placed
 * @param sharedAtoms
 *            The atoms of this ring, also members of another ring, which are
 *            already placed
 * @param sharedAtomsCenter
 *            The geometric center of these atoms
 * @param ringCenterVector
 *            A vector pointing the the center of the new ring
 * @param bondLength
 *            The standard bondlength
 */
layoutRingPlacer.placeSpiroRing = function(ring, shared_fragment,sharedAtomsCenter, ringCenterVector, bondLength) {
	var radius = layoutRingPlacer.getNativeRingRadius(ring.atoms.length,bondLength);
	ringCenterVector.normalize();
	ringCenterVector.scale(radius);
    var ringCenter = new goog.math.Coordinate(sharedAtomsCenter.x+ringCenterVector.x, sharedAtomsCenter.y+ringCenterVector.y);

	var addAngle = 2 * Math.PI / ring.atoms.length;

	var startAtom = shared_fragment.atoms[0];
    var startAngle = layoutAtomPlacer.getAngle(startAtom.coord.x-ringCenter.x,startAtom.coord.y-ringCenter.y);

	var atoms_to_place = layoutRingPlacer.atomsInPlacementOrder(
			startAtom, shared_fragment.bonds[0], ring.bonds);

	layoutAtomPlacer.populatePolygonCorners(atoms_to_place, ringCenter,
			startAngle, addAngle, radius);
};

/**
 * Returns the ring radius of a perfect polygons of size ring.getAtomCount() The
 * ring radius is the distance of each atom to the ringcenter.
 *
 * @param {number}
 *            size Number of atoms in the ring for which the radius is to
 *            calculated
 * @param {number}
 *            bondLength The bond length for each bond in the ring
 * @return {number} The radius of the ring.
 */
layoutRingPlacer.getNativeRingRadius=function(size, bondLength){
	return bondLength / (2 * Math.sin((Math.PI) / size));
};

layoutRingPlacer.getIntersectingAtoms = function(ring1, ring2) {
	var atoms = [];
	goog.array.forEach(ring2.atoms, function(atom) {
		if (goog.array.contains(ring1.atoms, atom)) {
			atoms.push(atom);
		}
	});
	return atoms;
};

layoutRingPlacer.getIntersectingBonds = function(ring1, ring2) {
	var bonds = [];
	goog.array.forEach(ring2.bonds, function(bond) {
		if (goog.array.contains(ring1.bonds, bond)) {
			bonds.push(bond);
		}
	});
	return bonds;
};

/**
 * finds center of a list of atoms
 *
 * @param {Array.
 *            <kemia.model.Atom>} atoms list of atoms to find center of
 * @return {goog.math.Coordinate} coordinate of center of atoms
 */
layoutRingPlacer.center = function(atoms) {
	var sum = goog.array.reduce(atoms, function(rval, atom) {
		return goog.math.Coordinate.sum(rval, atom.coord);
	}, new goog.math.Coordinate(0, 0));

	return new goog.math.Coordinate(sum.x / atoms.length, sum.y
			/ atoms.length);
};


layoutRingPlacer.placeConnectedRings = function(ringset, ring, handleType, bondLength) {
    var connectedRings = kemia.ring.RingPartitioner.directConnectedRings(ring,ringset);
    for (var r=0,r1=connectedRings.length; r<r1; r++) {
		var connectedRing = connectedRings[r];
        if (!connectedRing.flags[modelFlags.ISPLACED]) {
	        var shared_fragment = {
	                atoms : layoutRingPlacer.getIntersectingAtoms(ring,connectedRing),
	                bonds : layoutRingPlacer.getIntersectingBonds(ring,connectedRing)
	        };
			var sac = shared_fragment.atoms.length;
            if ((sac === 2 && handleType === 'FUSED') ||(sac === 1 && handleType === 'SPIRO')||(sac > 2 && handleType === 'BRIDGED'))
            {
				var debug='';
                for (var qw=0;qw<shared_fragment.atoms.length;qw++)
                    debug+=('\n         '+shared_fragment.atoms[qw].coord+' '+shared_fragment.atoms[qw].flags[modelFlags.ISPLACED]);
                var sharedAtomsCenter = layoutAtomPlacer.getAtoms2DCenter(shared_fragment.atoms);
                var oldRingCenter = layoutAtomPlacer.getAtoms2DCenter(ring.atoms);
                var tempVector = new layoutVector2D(sharedAtomsCenter.x,sharedAtomsCenter.y);
                var newRingCenterVector = new layoutVector2D(tempVector.x,tempVector.y);
                newRingCenterVector.sub(new layoutVector2D(oldRingCenter.x,oldRingCenter.y));
                var oldRingCenterVector = new layoutVector2D(newRingCenterVector.x,newRingCenterVector.y);
                var tempPoint = new goog.math.Coordinate(sharedAtomsCenter.x+newRingCenterVector.x, sharedAtomsCenter.y+newRingCenterVector.y);
                layoutRingPlacer.placeRing(connectedRing, shared_fragment, sharedAtomsCenter, newRingCenterVector, bondLength);
                connectedRing.setFlag(modelFlags.ISPLACED, true);
                layoutRingPlacer.placeConnectedRings(ringset, connectedRing, handleType, bondLength);
            }
		}
    }
};

/**
 * flag all atoms in rings as unplaced atoms
 *
 * @param {Array.
 *            <Array.<kemia.ring.Ring>>} ringset
 */
layoutRingPlacer.resetUnplacedRingAtoms = function(ringset){
	goog.array.forEach(ringset, function(ring){
		if (!ring.isPlaced){
			goog.array.forEach(ring.atoms, function(atom){
				atom.setFlag(modelFlags.ISPLACED, false);
			});
		}
	});
};

layoutRingPlacer.findNextRingBondWithUnplacedRingAtom = function(bonds){
	return  goog.array.find(bonds, function(bond){
		return goog.array.some([bond.source, bond.target], function(atom){
			return atom.flags[modelFlags.ISINRING] && !atom.flags[modelFlags.ISPLACED] && bond.otherAtom(atom).flags[modelFlags.ISPLACED];
		});
	});
};

layoutRingPlacer.layoutNextRingSystem=function(firstBondVector, molecule, sssr, ringsets){

	layoutRingPlacer.resetUnplacedRingAtoms(sssr);
	var placed_atoms = goog.array.filter(molecule.atoms, function(atom){
		return atom.flags[modelFlags.ISPLACED];
	});

	var next_bond = layoutRingPlacer.findNextRingBondWithUnplacedRingAtom(molecule.bonds);

	if (next_bond){
		var ring_atom = goog.array.find([next_bond.source, next_bond.target], function(atom){
			return atom.flags[modelFlags.ISINRING] && !atom.flags[modelFlags.ISPLACED];
		});

		var chain_atom = next_bond.otherAtom(ring_atom);

		// ringset containing ring_atom
		var next_ring_set = goog.array.find(ringsets, function(ringset){
			return goog.array.find(ringset, function(ring){
				return goog.array.contains(ring.atoms, ring_atom);
			});
		});

		var old_ring_atom_coord = ring_atom.coord.clone();
		var old_chain_atom_coord = chain_atom.coord.clone();

		kemia.layout.CoordinateGenerator.layoutRingSet(firstBondVector, next_ring_set);

		// Place all the substituents of next ring system
		layoutAtomPlacer.markNotPlaced(placed_atoms);
		var substituents = layoutRingPlacer.placeRingSubstituents(molecule,next_ring_set, kemia.layout.CoordinateGenerator.BOND_LENGTH);
		layoutAtomPlacer.markPlaced(placed_atoms);

        var placed_atoms = goog.array.concat(substituents.atoms,
                goog.array.flatten(goog.array.map(next_ring_set, function(ring){
                    return ring.atoms;
                }))
                );
        goog.array.removeDuplicates(placed_atoms);

        var oldPoint2 = old_ring_atom_coord;
        var oldPoint1 = old_chain_atom_coord;
        var newPoint2 = ring_atom.coord;
        var newPoint1 = chain_atom.coord;
        var oldAngle =layoutAtomPlacer.getAngle(oldPoint2.x - oldPoint1.x,oldPoint2.y - oldPoint1.y);
        var newAngle =layoutAtomPlacer.getAngle(newPoint2.x - newPoint1.x,newPoint2.y - newPoint1.y);
        var angleDiff = oldAngle - newAngle;

        var translationVector = new layoutVector2D(oldPoint1.x, oldPoint1.y);
        translationVector.sub(new layoutVector2D(newPoint1.x,newPoint1.y));

        goog.array.forEach(placed_atoms, function(atom) {
            atom.coord.x+=translationVector.x;
            atom.coord.y+=translationVector.y;
        });

        var costheta = Math.cos(angleDiff);
        var sintheta = Math.sin(angleDiff);
        goog.array.forEach(placed_atoms, function(atom) {
			var point = atom.coord;
            var relativex = point.x - oldPoint1.x;
            var relativey = point.y - oldPoint1.y;
            point.x = relativex * costheta - relativey * sintheta + oldPoint1.x;
            point.y = relativex * sintheta + relativey * costheta + oldPoint1.y;
        });

        goog.array.forEach(next_ring_set, function(ring){
            ring.isPlaced = true;
        });
	}
};
