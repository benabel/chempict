/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied.
 * See the License for the specific language governing permissions and limitations under the
 * License.
 */
'use strict';

const modelFlags = require('../model/flags');
const ModelMolecule = require('../model/molecule');
const ringPartitioner = require('../ring/partitioner');

const layoutConfig = require('./config');
const layoutAtomPlacer = require('./atom_placer');
const layoutOverlapResolver = require('./overlap_resolver');
const LayoutVector2D = require('./vector2d');

/**
 * Generates 2D coordinates for a molecule for which only connectivity is known
 * or the coordinates have been discarded for some reason.
 *
 * Javascript version of CDK's StructureDiagramGenerator (author C.Steinbeck)
 *
 * @author: markr@ebi.ac.uk
 */
const layoutCoordinateGenerator = function() {};

layoutCoordinateGenerator.bondLength = layoutConfig.bondLength;

layoutCoordinateGenerator.generate = function(molecule) {

  var safetyCounter = 0;
  var firstBondVector = new LayoutVector2D(0, 1);

  var atCount = molecule.countAtoms();
  for (var f = 0; f < atCount; f++) {
    var atom = molecule.getAtom(f);
    atom.setFlag(modelFlags.ISPLACED, false);
    atom.setFlag(modelFlags.VISITED, false);
    atom.setFlag(modelFlags.ISINRING, false);
    atom.setFlag(modelFlags.ISALIPHATIC, false);
  }

  /*
         * If molecule contains only one Atom, don't fail, simply set coordinates to
         * simplest: 0,0
         */
  if (atCount === 1) {
    molecule.getAtom(0).coords = new goog.math.Coordinate(0, 0);
    return molecule;
  }

  if (molecule.fragmentCount > 1) {
    throw Error('Molecule not connected.');
  }

  // TODO: insert template pre-fab substructures here

  var nrOfEdges = molecule.countBonds();
  var angle;  // double
  var expectedRingCount = nrOfEdges - molecule.countAtoms() + 1;
  var sssr = molecule.getRings();

  // partition sssr into connected sets of rings
  var ringsets = new ringPartitioner.GetPartitionedRings(sssr);

  if (expectedRingCount > 0) {
    // flag all atoms in sssr as ISINRING
    sssr.forEach(function(ring) {
      ring.atoms.forEach, function(atom) { atom.setFlag(modelFlags.ISINRING, true); };
    });

    ringsets.sort(function(a, b) { return goog.array.defaultCompare(a.length, b.length); });
    var largestRingset = goog.array.peek(ringsets);
    // alert("ringsets length"+ ringsets.length+" largestRingset is "+ largestRingset.length)

    // place largest ringset
    this.ringSet(firstBondVector, largestRingset);

    // place substituents on largest ringset
    layoutRingPlacer.placeRingSubstituents(
        molecule, largestRingset, layoutCoordinateGenerator.bondLength);

    largestRingset.forEach(function(ring) { ring.isPlaced = true; });
  } else {
    /*
     * We are here because there are no rings in the molecule so we get the
     * longest chain in the molecule and placed in on a horizontal axis
     */
    var longestChain = layoutAtomPlacer.getInitialLongestChain(molecule);

    longestChain.getAtom(0).coord = new goog.math.Coordinate(0, 0);
    longestChain.getAtom(0).flags[modelFlags.ISPLACED] = true;
    angle = Math.PI * (-30 / 180);
    layoutAtomPlacer.placeLinearChain(
        longestChain, firstBondVector, layoutCoordinateGenerator.bondLength);
  }

  /* Do the layout of the rest of the molecule */
  var safetyCounter = 0;
  do {
    safetyCounter++;
    /*
                 * do layout for all aliphatic parts of the molecule which are connected
                 * to the parts which have already been laid out.
                 */

    layoutCoordinateGenerator.handleAliphatics(
        molecule, nrOfEdges, layoutCoordinateGenerator.bondLength);

    /*
                 * do layout for the next ring aliphatic parts of the molecule which are
                 * connected to the parts which have already been laid out.
                 */

    layoutRingPlacer.layoutNextRingSystem(firstBondVector, molecule, sssr, ringsets);

  } while (!layoutAtomPlacer.allPlaced(molecule, atCount) &&
           safetyCounter <= molecule.countAtoms());

  // Optional..
  layoutOverlapResolver.resolveOverlap(molecule, sssr);

  /* DEBUG coords
   alrt="";
         for(z=0; z<molecule.countAtoms(); z++) {
   at = molecule.getAtom(z)
   alrt+=(at.symbol+":"+at.coord.x+","+at.coord.y)+"\n"
    }
         alert (alrt)
  /* DEBUG coords */

  return molecule;
};

/**
 * places first bond of first ring with source at origin and target at scaled
 * vector
 *
 * @param {kemia.model.Bond}
 *            bond, subject bond to be placed
 * @param {LayoutVector2D}
 *            vector, where to put the bond.target
 * @return {Array.<kemia.model.Atom>} array of the atoms placed
 */
layoutCoordinateGenerator.placeFirstBond = function(bond, vector) {
  vector.normalize();
  vector.scale(layoutCoordinateGenerator.bondLength);
  bond.source.coord = new goog.math.Coordinate(0, 0);
  bond.source.setFlag(modelFlags.ISPLACED, true);
  bond.target.coord = new goog.math.Coordinate(vector.x, vector.y);
  bond.target.setFlag(modelFlags.ISPLACED, true);
  return [bond.source, bond.target];
};

layoutCoordinateGenerator.allPlaced = function(rings) {
  for (var f1 = 0; f1 < rings.length; f1++) {
    if (!rings[f1].flags[modelFlags.ISPLACED]) {
      return false;
    }
  }
  return true;
};

/**
 * Returns the next atom with unplaced aliphatic neighbors
 */
layoutCoordinateGenerator.getNextAtomWithAliphaticUnplacedNeigbors = function(molecule, bondCount) {
  for (var bc = 0; bc < bondCount; bc++) {
    var bond = molecule.getBond(bc);

    if (bond.source.flags[modelFlags.ISPLACED] && !bond.target.flags[modelFlags.ISPLACED]) {
      return bond.source;
    }
    if (!bond.source.flags[modelFlags.ISPLACED] && bond.target.flags[modelFlags.ISPLACED]) {
      return bond.target;
    }
  }
  return null;
};

layoutCoordinateGenerator.getAtoms = function(atom, molecule, bondCount, placed) {
  var atoms = new ModelMolecule;
  var bonds = molecule.getConnectedBondsList(atom);
  for (var ga = 0, bLen = bonds.length; ga < bLen; ga++) {
    var connectedAtom = bonds[ga].otherAtom(atom);
    if (placed && connectedAtom.flags[modelFlags.ISPLACED])
      atoms.addAtom(connectedAtom);
    else if (!placed && !connectedAtom.flags[modelFlags.ISPLACED])
      atoms.addAtom(connectedAtom);
  }
  return atoms;
};

/**
 * Does a layout of all aliphatic parts connected to the parts of the molecule
 * that have already been laid out. Starts at the first bond with unplaced
 * neighbours and stops when a ring is encountered.
 */
layoutCoordinateGenerator.handleAliphatics = function(molecule, bondCount, bondLength) {

  var cntr = 0;
  var at;
  do {
    cntr++;
    var done = false;
    at = layoutCoordinateGenerator.getNextAtomWithAliphaticUnplacedNeigbors(molecule, bondCount);
    var direction = null;
    var startVector = null;
    if (at !== null) {
      var unplacedAtoms = layoutCoordinateGenerator.getAtoms(at, molecule, bondCount, false);
      var placedAtoms = layoutCoordinateGenerator.getAtoms(at, molecule, bondCount, true);
      var longestUnplacedChain = layoutAtomPlacer.getLongestUnplacedChain(molecule, at);
      if (longestUnplacedChain.countAtoms() > 1) {
        if (placedAtoms.countAtoms() > 1) {
          layoutAtomPlacer.distributePartners(
              at, placedAtoms, layoutAtomPlacer.get2DCenter(placedAtoms), unplacedAtoms,
              bondLength);
          direction = new LayoutVector2D(
              longestUnplacedChain.getAtom(1).coord.x, longestUnplacedChain.getAtom(1).coord.y);
          startVector = new LayoutVector2D(at.coord.x, at.coord.y);
          direction.sub(startVector);
        } else {
          direction = layoutAtomPlacer.getNextBondVector(
              at, placedAtoms.getAtom(0), layoutAtomPlacer.get2DCenter(molecule), true);
        }

        for (var z = 1, zCnt = longestUnplacedChain.countAtoms(); z < zCnt; z++) {
          longestUnplacedChain.getAtom(z).flags[modelFlags.ISPLACED] = false;
        }
        layoutAtomPlacer.placeLinearChain(longestUnplacedChain, direction, bondLength);

      } else
        done = true;
    } else
      done = true;
  } while (!done && cntr <= molecule.countAtoms());
};

layoutCoordinateGenerator.getMostComplexRing = function(ringSet) {
  var neighbors = new Array(ringSet.length);
  for (var i = 0; i < neighbors.length; i++) {
    neighbors[i] = 0;
  }
  var mostComplex = 0;
  var mostComplexPosition = 0;
  for (i = 0; i < ringSet.length; i++) {
    var ring1 = ringSet[i];
    for (var j = 0; j < ring1.atoms.length; j++) {
      var atom1 = ring1[j];
      for (var k = i + 1; k < ringSet.length; k++) {
        var ring2 = ringSet[k];
        if (ring1 !== ring2) {
          for (var l = 0; l < ring2.atoms.length; l++) {
            var atom2 = ring2[l];
            if (atom1 === atom2) {
              neighbors[i]++;
              neighbors[k]++;
              break;
            }
          }
        }
      }
    }
  }
  for (i = 0; i < neighbors.length; i++) {
    if (neighbors[i] > mostComplex) {
      mostComplex = neighbors[i];
      mostComplexPosition = i;
    }
  }
  return ringSet[mostComplexPosition];
};

/**
 * Does a layout of all the rings in a connected ringset.
 *
 * @param {LayoutVector2D}
 *            bondVector A vector for placement for the first bond
 * @param {Array.<kemia.ring.Ring>} ringset
 * The connected RingSet to be layed out
 */
layoutCoordinateGenerator.ringSet = function(bondVector, ringset) {
  // TODO apply templates to layout pre-fab rings

  const bl = layoutConfig.bondLength;

  var mostComplexRing = layoutCoordinateGenerator.getMostComplexRing(ringset);

  if (!mostComplexRing.flags[modelFlags.ISPLACED]) {
    var sharedFrag = {
      atoms: layoutCoordinateGenerator.placeFirstBond(mostComplexRing.bonds[0], bondVector),
      bonds: [mostComplexRing.bonds[0]]
    };
    var sharedFragSum = goog.array.reduce(sharedFrag.atoms, function(r, atom) {
      return goog.math.Coordinate.sum(r, atom.coord);
    }, new goog.math.Coordinate(0, 0));
    var sharedFragCenter = new LayoutVector2D(
        sharedFragSum.x / sharedFrag.atoms.length, sharedFragSum.y / sharedFrag.atoms.length);

    var ringCenterVector =
        layoutRingPlacer.getRingCenterOfFirstRing(mostComplexRing, bondVector, bl);

    layoutRingPlacer.placeRing(mostComplexRing, sharedFrag, sharedFragCenter, ringCenterVector, bl);

    mostComplexRing.setFlag(modelFlags.ISPLACED, true);
  }
  var thisRing = 0;
  do {
    if (mostComplexRing.flags[modelFlags.ISPLACED]) {
      layoutRingPlacer.placeConnectedRings(ringset, mostComplexRing, 'FUSED', bl);
      layoutRingPlacer.placeConnectedRings(ringset, mostComplexRing, 'BRIDGED', bl);
      layoutRingPlacer.placeConnectedRings(ringset, mostComplexRing, 'SPIRO', bl);
    }
    thisRing++;
    if (thisRing === ringset.length) thisRing = 0;
    mostComplexRing = ringset[thisRing];
  } while (!layoutCoordinateGenerator.allPlaced(ringset));

};

const layoutRingPlacer = function() {};
/**
 * finds center of first ring
 *
 * @param {kemia.ring.Ring}
 *            ring, subject ring
 * @param {LayoutVector2D}
 *            bondVector location of first bond
 * @param {number}
 *            bondLength
 * @return {LayoutVector2D}
 */
layoutRingPlacer.getRingCenterOfFirstRing = function(ring, bondVector, bondLength) {

  var size = ring.atoms.length;
  var radius = bondLength / (2 * Math.sin((Math.PI) / size));
  var newRingPerpendicular = Math.sqrt(Math.pow(radius, 2) - Math.pow(bondLength / 2, 2));
  /* get the angle between the x axis and the bond vector */
  var rotangle = layoutAtomPlacer.getAngle(bondVector.x, bondVector.y);
  rotangle += Math.PI / 2;
  return new LayoutVector2D(
      Math.cos(rotangle) * newRingPerpendicular, Math.sin(rotangle) * newRingPerpendicular);
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
layoutRingPlacer.placeRing = function(
    ring, sharedFrag, sharedFragCenter, ringCenterVector, bondLength) {
  var sharedAtomCount = sharedFrag.atoms.length;
  if (sharedAtomCount > 2) {
    layoutRingPlacer.placeBridgedRing(
        ring, sharedFrag, sharedFragCenter, ringCenterVector, bondLength);
  } else if (sharedAtomCount === 2) {
    layoutRingPlacer.placeFusedRing(
        ring, sharedFrag, sharedFragCenter, ringCenterVector, bondLength);
  } else if (sharedAtomCount === 1) {
    layoutRingPlacer.placeSpiroRing(
        ring, sharedFrag, sharedFragCenter, ringCenterVector, bondLength);
  }
};

layoutRingPlacer.placeRingSubstituents = function(molec, ringset, bondLength) {
  var treatedAtoms = new ModelMolecule();
  var cntDbg = 0;
  ringset.forEach(function(ring) {
    ring.atoms.forEach(function(atom) {
      var unplacedPartners = new ModelMolecule();
      var sharedAtoms = new ModelMolecule();
      var rings = ringset.filter(function(r) { return goog.array.contains(r.atoms, atom); });
      var ringsAtoms = goog.array.flatten(rings.map(function(r) { return r.atoms; }));
      var centerOfRingGravity = layoutRingPlacer.center(ringsAtoms);
      cntDbg += layoutAtomPlacer.partitionPartners(molec, atom, unplacedPartners, sharedAtoms);

      layoutAtomPlacer.markNotPlaced(unplacedPartners.atoms);
      unplacedPartners.atoms.forEach(function(atom) { treatedAtoms.addAtom(atom); });
      if (unplacedPartners.atoms.length > 0) {
        layoutAtomPlacer.distributePartners(
            atom, sharedAtoms, centerOfRingGravity, unplacedPartners, bondLength);
      }
    });
  });
  return treatedAtoms;
};

/**
 * Generated coordinates for a bridged ring.
 *
 * @param ring
 *            The ring to be placed
 * @param sharedFrag
 *            The atoms of this ring, also members of another ring, which are
 *            already placed
 * @param sharedFragCenter
 *            The geometric center of these atoms
 * @param ringCenterVector
 *            A vector pointing the the center of the new ring
 * @param bondLength
 *            The standard bondlength
 */
layoutRingPlacer.placeBridgedRing = function(
    ring, sharedFrag, sharedFragCenter, ringCenterVector, bondLength) {

  var radius = layoutRingPlacer.getNativeRingRadius(ring.atoms.length, bondLength);
  ringCenterVector.normalize();
  ringCenterVector.scale(radius);
  var ringCenter = new goog.math.Coordinate(
      sharedFragCenter.x + ringCenterVector.x, sharedFragCenter.y + ringCenterVector.y);

  var bridgeAtoms = layoutRingPlacer.getBridgeAtoms(sharedFrag);

  var bondAtom1 = bridgeAtoms[0];
  var bondAtom2 = bridgeAtoms[1];

  var bondAtom1Vector = new LayoutVector2D(bondAtom1.coord.x, bondAtom1.coord.y);
  var bondAtom2Vector = new LayoutVector2D(bondAtom2.coord.x, bondAtom2.coord.y);

  bondAtom1Vector.sub(ringCenterVector);
  bondAtom2Vector.sub(ringCenterVector);

  var occupiedAngle = bondAtom1Vector.angle(bondAtom2Vector);

  var remainingAngle = (2 * Math.PI) - occupiedAngle;
  var addAngle = remainingAngle / (ring.atoms.length - sharedFrag.atoms.length + 1);

  var startAtom = layoutRingPlacer.findStartAtom(ringCenterVector, bondAtom1, bondAtom2);
  var startAngle = goog.math.toRadians(
      goog.math.angle(
          startAtom.coord.x, startAtom.coord.y, ringCenterVector.x, ringCenterVector.y));

  var atomsToPlace =
      layoutRingPlacer.atomsInPlacementOrder(startAtom, sharedFrag.bonds[0], ring.bonds);

  var addAngle = addAngle * layoutRingPlacer.findDirection(ringCenterVector, bondAtom1, bondAtom2);
  layoutAtomPlacer.populatePolygonCorners(atomsToPlace, ringCenter, startAngle, addAngle, radius);
};

layoutRingPlacer.atomsInPlacementOrder = function(atom, bond, bonds) {
  var nextBond = goog.array.find(bonds, function(b) { return b.otherAtom(atom); });

  var remainingBonds = bonds.filter(function(b) { return b !== nextBond; });
  if (remainingBonds.length > 0) {
    var nextAtom = nextBond.otherAtom(atom);
    return goog.array.concat(
        nextAtom, layoutRingPlacer.atomsInPlacementOrder(nextAtom, nextBond, remainingBonds));
  } else {
    return [];
  }
};
/**
 * determine direction
 *
 * @param {LayoutVector2D}
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
    if (ringCenter.y - atom1.coord.y < (ringCenter.x - atom1.coord.x) * diff.y / diff.x) {
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
layoutRingPlacer.getBridgeAtoms = function(sharedFrag) {
  var bridgeAtoms = [];
  sharedFrag.atoms.forEach(function(atom) {
    Array.from(atom.bonds).forEach(function(bond) {
      if (goog.array.contains(sharedFrag.bonds, bond)) {
        bridgeAtoms.push(bond.otherAtom(atom));
      }
    });
  });
  return bridgeAtoms;
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
layoutRingPlacer.placeFusedRing = function(
    ring, sharedAtoms, sharedAtomsCenter, ringCenterVector, bondLength) {
  var radius = layoutRingPlacer.getNativeRingRadius(ring.atoms.length, bondLength);
  var newRingPerpendicular = Math.sqrt(Math.pow(radius, 2) - Math.pow(bondLength / 2, 2));

  ringCenterVector.normalize();
  ringCenterVector.scale(newRingPerpendicular);
  var ringCenter = new goog.math.Coordinate(
      sharedAtomsCenter.x + ringCenterVector.x, sharedAtomsCenter.y + ringCenterVector.y);

  var bondAtom1 = sharedAtoms.atoms[0];
  var bondAtom2 = sharedAtoms.atoms[1];

  var bondAtom1Vector = new LayoutVector2D(bondAtom1.coord.x, bondAtom1.coord.y);
  var bondAtom2Vector = new LayoutVector2D(bondAtom2.coord.x, bondAtom2.coord.y);

  var originRingCenterVector = new LayoutVector2D(ringCenter.x, ringCenter.y);

  bondAtom1Vector.sub(originRingCenterVector);
  bondAtom2Vector.sub(originRingCenterVector);

  var occupiedAngle = bondAtom1Vector.angle(bondAtom2Vector);

  var remainingAngle = (2 * Math.PI) - occupiedAngle;
  var addAngle = remainingAngle / (ring.atoms.length - 1);

  var centerX = ringCenter.x;
  var centerY = ringCenter.y;

  var xDiff = bondAtom1.coord.x - bondAtom2.coord.x;
  var yDiff = bondAtom1.coord.y - bondAtom2.coord.y;

  var direction = 1;
  // if bond is vertical
  if (xDiff === 0) {
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
  else {
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
  var startAngle =
      layoutAtomPlacer.getAngle(startAtom.coord.x - ringCenter.x, startAtom.coord.y - ringCenter.y);

  var currentAtom = startAtom;
  var currentBond = sharedAtoms.bonds[0];

  var atomsToDraw = [];
  for (var x1 = 0, x2 = ring.bonds.length - 2; x1 < x2; x1++) {
    currentBond = layoutRingPlacer.getNextBond(ring, currentBond, currentAtom);
    currentAtom = currentBond.otherAtom(currentAtom);
    atomsToDraw.push(currentAtom);
  }
  addAngle = addAngle * direction;
  layoutAtomPlacer.populatePolygonCorners(atomsToDraw, ringCenter, startAngle, addAngle, radius);
};

layoutRingPlacer.getNextBond = function(ring, bond, atom) {
  for (var f = 0; f < ring.bonds.length; f++) {
    if (ring.bonds[f] !== bond &&
        (ring.bonds[f].source === atom || ring.bonds[f].target === atom)) {
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
layoutRingPlacer.placeSpiroRing = function(
    ring, sharedFrag, sharedAtomsCenter, ringCenterVector, bondLength) {
  var radius = layoutRingPlacer.getNativeRingRadius(ring.atoms.length, bondLength);
  ringCenterVector.normalize();
  ringCenterVector.scale(radius);
  var ringCenter = new goog.math.Coordinate(
      sharedAtomsCenter.x + ringCenterVector.x, sharedAtomsCenter.y + ringCenterVector.y);

  var addAngle = 2 * Math.PI / ring.atoms.length;

  var startAtom = sharedFrag.atoms[0];
  var startAngle =
      layoutAtomPlacer.getAngle(startAtom.coord.x - ringCenter.x, startAtom.coord.y - ringCenter.y);

  var atomsToPlace =
      layoutRingPlacer.atomsInPlacementOrder(startAtom, sharedFrag.bonds[0], ring.bonds);

  layoutAtomPlacer.populatePolygonCorners(atomsToPlace, ringCenter, startAngle, addAngle, radius);
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
layoutRingPlacer.getNativeRingRadius = function(size, bondLength) {
  return bondLength / (2 * Math.sin((Math.PI) / size));
};

layoutRingPlacer.getIntersectingAtoms = function(ring1, ring2) {
  var atoms = [];
  ring2.atoms.forEach(function(atom) {
    if (goog.array.contains(ring1.atoms, atom)) {
      atoms.push(atom);
    }
  });
  return atoms;
};

layoutRingPlacer.getIntersectingBonds = function(ring1, ring2) {
  var bonds = [];
  ring2.bonds.forEach(function(bond) {
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

  return new goog.math.Coordinate(sum.x / atoms.length, sum.y / atoms.length);
};

layoutRingPlacer.placeConnectedRings = function(ringset, ring, handleType, bondLength) {
  var connectedRings = ringPartitioner.directConnectedRings(ring, ringset);
  for (var r = 0, r1 = connectedRings.length; r < r1; r++) {
    var connectedRing = connectedRings[r];
    if (!connectedRing.flags[modelFlags.ISPLACED]) {
      var sharedFrag = {
        atoms: layoutRingPlacer.getIntersectingAtoms(ring, connectedRing),
        bonds: layoutRingPlacer.getIntersectingBonds(ring, connectedRing)
      };
      var sac = sharedFrag.atoms.length;
      if ((sac === 2 && handleType === 'FUSED') || (sac === 1 && handleType === 'SPIRO') ||
          (sac > 2 && handleType === 'BRIDGED')) {
        var debug = '';
        for (var qw = 0; qw < sharedFrag.atoms.length; qw++)
          debug +=
              ('\n         ' + sharedFrag.atoms[qw].coord + ' ' +
               sharedFrag.atoms[qw].flags[modelFlags.ISPLACED]);
        var sharedAtomsCenter = layoutAtomPlacer.getAtoms2DCenter(sharedFrag.atoms);
        var oldRingCenter = layoutAtomPlacer.getAtoms2DCenter(ring.atoms);
        var tempVector = new LayoutVector2D(sharedAtomsCenter.x, sharedAtomsCenter.y);
        var newRingCenterVector = new LayoutVector2D(tempVector.x, tempVector.y);
        newRingCenterVector.sub(new LayoutVector2D(oldRingCenter.x, oldRingCenter.y));
        var oldRingCenterVector = new LayoutVector2D(newRingCenterVector.x, newRingCenterVector.y);
        var tempPoint = new goog.math.Coordinate(
            sharedAtomsCenter.x + newRingCenterVector.x,
            sharedAtomsCenter.y + newRingCenterVector.y);
        layoutRingPlacer.placeRing(
            connectedRing, sharedFrag, sharedAtomsCenter, newRingCenterVector, bondLength);
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
layoutRingPlacer.resetUnplacedRingAtoms = function(ringset) {
  ringset.forEach(ring => {
    if (!ring.isPlaced) {
      ring.atoms.forEach(atom => {atom.setFlag(modelFlags.ISPLACED(false))});
    }
  });
};

layoutRingPlacer.findNextRingBondWithUnplacedRingAtom = function(bonds) {
  return goog.array.find(bonds, function(bond) {
    return goog.array.some([bond.source, bond.target], function(atom) {
      return atom.flags[modelFlags.ISINRING] && !atom.flags[modelFlags.ISPLACED] &&
          bond.otherAtom(atom).flags[modelFlags.ISPLACED];
    });
  });
};

layoutRingPlacer.layoutNextRingSystem = function(firstBondVector, molecule, sssr, ringsets) {

  layoutRingPlacer.resetUnplacedRingAtoms(sssr);
  var placedAtoms =
      goog.array.filter(molecule.atoms, function(atom) { return atom.flags[modelFlags.ISPLACED]; });

  var nextBond = layoutRingPlacer.findNextRingBondWithUnplacedRingAtom(molecule.bonds);

  if (nextBond) {
    var ringAtom = goog.array.find([nextBond.source, nextBond.target], function(atom) {
      return atom.flags[modelFlags.ISINRING] && !atom.flags[modelFlags.ISPLACED];
    });

    var chainAtom = nextBond.otherAtom(ringAtom);

    // ringset containing ringAtom
    var nextRingSet = goog.array.find(ringsets, function(ringset) {
      return goog.array.find(
          ringset, function(ring) { return goog.array.contains(ring.atoms, ringAtom); });
    });

    var oldRingAtomCoord = ringAtom.coord.clone();
    var oldChainAtomCoord = chainAtom.coord.clone();

    layoutCoordinateGenerator.ringSet(firstBondVector, nextRingSet);

    // Place all the substituents of next ring system
    layoutAtomPlacer.markNotPlaced(placedAtoms);
    var substituents =
        layoutRingPlacer.placeRingSubstituents(molecule, nextRingSet, layoutConfig.bondLength);
    layoutAtomPlacer.markPlaced(placedAtoms);

    var placedAtoms = goog.array.concat(
        substituents.atoms,
        goog.array.flatten(nextRingSet.map(function(ring) { return ring.atoms; })));
    goog.array.removeDuplicates(placedAtoms);

    var oldPoint2 = oldRingAtomCoord;
    var oldPoint1 = oldChainAtomCoord;
    var newPoint2 = ringAtom.coord;
    var newPoint1 = chainAtom.coord;
    var oldAngle = layoutAtomPlacer.getAngle(oldPoint2.x - oldPoint1.x, oldPoint2.y - oldPoint1.y);
    var newAngle = layoutAtomPlacer.getAngle(newPoint2.x - newPoint1.x, newPoint2.y - newPoint1.y);
    var angleDiff = oldAngle - newAngle;

    var translationVector = new LayoutVector2D(oldPoint1.x, oldPoint1.y);
    translationVector.sub(new LayoutVector2D(newPoint1.x, newPoint1.y));

    placedAtoms.forEach(function(atom) {
      atom.coord.x += translationVector.x;
      atom.coord.y += translationVector.y;
    });

    var costheta = Math.cos(angleDiff);
    var sintheta = Math.sin(angleDiff);
    placedAtoms.forEach(function(atom) {
      var point = atom.coord;
      var relativex = point.x - oldPoint1.x;
      var relativey = point.y - oldPoint1.y;
      point.x = relativex * costheta - relativey * sintheta + oldPoint1.x;
      point.y = relativex * sintheta + relativey * costheta + oldPoint1.y;
    });

    nextRingSet.forEach(function(ring) { ring.isPlaced = true; });
  }
};

module.exports = layoutCoordinateGenerator;
