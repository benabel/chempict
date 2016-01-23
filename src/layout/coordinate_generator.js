/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

const modelFlagsgoog = require('../model/flags');
const ringPartitioner = require('../ring/partitioner');

const layoutAtomPlacer = require('./atom_placer');
const layoutRingPlacer = require('./ring_placer');
const layoutOverlapResolver = require('./overlap_resolver');
const layoutVector2D = require('./vector2d');


/**
 * Generates 2D coordinates for a molecule for which only connectivity is known
 * or the coordinates have been discarded for some reason.
 *
 * Javascript version of CDK's StructureDiagramGenerator (author C.Steinbeck)
 *
 * @author: markr@ebi.ac.uk
 */
module.exports = layoutCoordinateGenerator = function() {
 };

layoutCoordinateGenerator.BOND_LENGTH = 1.5;


layoutCoordinateGenerator.generate = function(molecule){

    var safetyCounter = 0;
	var firstBondVector = new layoutVector2D(0, 1);

    var atCount=molecule.countAtoms();
    for (var f = 0; f < atCount; f++)
    {
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
    if (atCount == 1)
	{
	    molecule.getAtom(0).coords = new goog.math.Coordinate(0,0);
	    return molecule;
	}

    if (molecule.fragmentCount > 1){
    	throw Error('Molecule not connected.');
    }

    // TODO: insert template pre-fab substructures here

   var nrOfEdges = molecule.countBonds();
   var angle; // double
   var expectedRingCount = nrOfEdges - molecule.countAtoms() + 1;
   var sssr = molecule.getRings();

   // partition sssr into connected sets of rings
   var ringsets = new ringPartitioner.getPartitionedRings(sssr);

    if (expectedRingCount > 0) {

    	// flag all atoms in sssr as ISINRING
    	goog.array.forEach(sssr, function(ring){
    		goog.array.forEach(ring.atoms, function(atom){
    			atom.setFlag(modelFlags.ISINRING, true);
    				});
    	});

    	goog.array.sort(ringsets, function(a,b){
    		return goog.array.defaultCompare(a.length, b.length);
    	});
    	var largest_ringset = goog.array.peek(ringsets);
		//alert("ringsets length"+ ringsets.length+" largest_ringset is "+ largest_ringset.length)

		// place largest ringset
    	layoutCoordinateGenerator.layoutRingSet(firstBondVector, largest_ringset);

    	// place substituents on largest ringset
    	layoutRingPlacer.placeRingSubstituents(molecule, largest_ringset, layoutCoordinateGenerator.BOND_LENGTH);

    	goog.array.forEach(largest_ringset, function(ring){
    		ring.isPlaced = true;
    	});
    }
    else {
		/*
		 * We are here because there are no rings in the molecule so we get the
		 * longest chain in the molecule and placed in on a horizontal axis
		 */
		var longestChain = layoutAtomPlacer.getInitialLongestChain(molecule);

		longestChain.getAtom(0).coord= new goog.math.Coordinate(0,0);
		longestChain.getAtom(0).flags[modelFlags.ISPLACED]=true;
        angle = Math.PI *(-30/180);
		layoutAtomPlacer.placeLinearChain(longestChain, firstBondVector, layoutCoordinateGenerator.BOND_LENGTH);
	 }

	/* Do the layout of the rest of the molecule */
    var safetyCounter=0;
	do
	{
	    safetyCounter++;
	    /*
		 * do layout for all aliphatic parts of the molecule which are connected
		 * to the parts which have already been laid out.
		 */

	    layoutCoordinateGenerator.handleAliphatics(molecule,nrOfEdges, layoutCoordinateGenerator.BOND_LENGTH);

	    /*
		 * do layout for the next ring aliphatic parts of the molecule which are
		 * connected to the parts which have already been laid out.
		 */

	    layoutRingPlacer.layoutNextRingSystem(firstBondVector, molecule, sssr, ringsets);


	} while ( !layoutAtomPlacer.allPlaced(molecule, atCount) && safetyCounter <= molecule.countAtoms()  );

	//Optional..
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
 * Does a layout of all the rings in a connected ringset.
 *
 * @param {layoutVector2D}
 *            bondVector A vector for placement for the first bond
 * @param {Array.<kemia.ring.Ring>} ringset
 * The connected RingSet to be layed out
 */
layoutCoordinateGenerator.layoutRingSet=function(bondVector, ringset){

	// TODO apply templates to layout pre-fab rings

    var bl=layoutCoordinateGenerator.BOND_LENGTH;

	var most_complex_ring = layoutCoordinateGenerator.getMostComplexRing(ringset);

    if (!most_complex_ring.flags[modelFlags.ISPLACED]) {
		var shared_fragment = {atoms:layoutCoordinateGenerator.placeFirstBond( most_complex_ring.bonds[0], bondVector),
				bonds: [most_complex_ring.bonds[0]]};
		var shared_fragment_sum = goog.array.reduce(shared_fragment.atoms, function(r,atom){
			return goog.math.Coordinate.sum(r,atom.coord);},
			new goog.math.Coordinate(0,0));
		var shared_fragment_center = new layoutVector2D(shared_fragment_sum.x/shared_fragment.atoms.length, shared_fragment_sum.y/shared_fragment.atoms.length);

		var ringCenterVector = layoutRingPlacer.getRingCenterOfFirstRing(most_complex_ring, bondVector, bl);

		layoutRingPlacer.placeRing(most_complex_ring, shared_fragment, shared_fragment_center, ringCenterVector, bl);

	    most_complex_ring.setFlag(modelFlags.ISPLACED, true);

	}
    var thisRing = 0;
    do {
        if (most_complex_ring.flags[modelFlags.ISPLACED]) {
            layoutRingPlacer.placeConnectedRings(ringset, most_complex_ring, 'FUSED',bl);
            layoutRingPlacer.placeConnectedRings(ringset, most_complex_ring, 'BRIDGED', bl);
            layoutRingPlacer.placeConnectedRings(ringset, most_complex_ring, 'SPIRO',bl);
        }
        thisRing++;
        if (thisRing == ringset.length)
            thisRing = 0;
        most_complex_ring = ringset[thisRing];
    } while (!layoutCoordinateGenerator.allPlaced(ringset));

};


/**
 * places first bond of first ring with source at origin and target at scaled
 * vector
 *
 * @param {kemia.model.Bond}
 *            bond, subject bond to be placed
 * @param {layoutVector2D}
 *            vector, where to put the bond.target
 * @return {Array.<kemia.model.Atom>} array of the atoms placed
 */
layoutCoordinateGenerator.placeFirstBond=function(bond, vector){
	vector.normalize();
	vector.scale(layoutCoordinateGenerator.BOND_LENGTH);
	bond.source.coord = new goog.math.Coordinate(0,0);
	bond.source.setFlag(modelFlags.ISPLACED, true);
	bond.target.coord = new goog.math.Coordinate(vector.x, vector.y);
	bond.target.setFlag(modelFlags.ISPLACED, true);
	return [bond.source, bond.target];
};

layoutCoordinateGenerator.allPlaced=function(rings){
    for (var f1=0; f1<rings.length; f1++) {
        if (!rings[f1].flags[modelFlags.ISPLACED]) {
            return false;
        }
    }
    return true;
};

/**
 * Returns the next atom with unplaced aliphatic neighbors
 */
layoutCoordinateGenerator.getNextAtomWithAliphaticUnplacedNeigbors = function(molecule,bondCount){
    for (var bc=0; bc<bondCount; bc++) {
        var bond = molecule.getBond(bc);

        if ( bond.source.flags[modelFlags.ISPLACED]  &&
            !bond.target.flags[modelFlags.ISPLACED] ) {
            return bond.source;
        }
        if (!bond.source.flags[modelFlags.ISPLACED]  &&
             bond.target.flags[modelFlags.ISPLACED] ) {
            return bond.target;
        }
    }
    return null;
};

layoutCoordinateGenerator.getAtoms = function(atom,molecule,bondCount,placed){
  var atoms = new modelMolecule;
	var bonds = molecule.getConnectedBondsList(atom);
	for (var ga=0, bLen=bonds.length; ga<bLen; ga++ ) {
	    var connectedAtom = bonds[ga].otherAtom(atom);
		if (placed && connectedAtom.flags[modelFlags.ISPLACED] )
            atoms.addAtom(connectedAtom);
		else
        if (!placed && !connectedAtom.flags[modelFlags.ISPLACED] )
            atoms.addAtom(connectedAtom);
	}
	return atoms;
};

/**
 * Does a layout of all aliphatic parts connected to the parts of the molecule
 * that have already been laid out. Starts at the first bond with unplaced
 * neighbours and stops when a ring is encountered.
 */
layoutCoordinateGenerator.handleAliphatics = function(molecule, bondCount,bondLength){

    var cntr = 0;
	var at;
    do {
        cntr++;
        var done = false;
        at = layoutCoordinateGenerator.getNextAtomWithAliphaticUnplacedNeigbors(molecule, bondCount);
        var direction=null;
        var startVector=null;
        if (at != null) {
            var unplacedAtoms = layoutCoordinateGenerator.getAtoms(at,molecule,bondCount,false);
            var placedAtoms = layoutCoordinateGenerator.getAtoms(at,molecule,bondCount,true);
            var longestUnplacedChain = layoutAtomPlacer.getLongestUnplacedChain (molecule, at);
			if (longestUnplacedChain.countAtoms() > 1) {
				if (placedAtoms.countAtoms() > 1) {
					layoutAtomPlacer.distributePartners(at, placedAtoms, layoutAtomPlacer.get2DCenter(placedAtoms), unplacedAtoms, bondLength);
					direction = new layoutVector2D(longestUnplacedChain.getAtom(1).coord.x, longestUnplacedChain.getAtom(1).coord.y);
					startVector = new layoutVector2D(at.coord.x, at.coord.y);
					direction.sub(startVector);
				}
				else {
					direction = layoutAtomPlacer.getNextBondVector(at, placedAtoms.getAtom(0), layoutAtomPlacer.get2DCenter(molecule), true);
				}

                for (var z=1, zCnt=longestUnplacedChain.countAtoms(); z<zCnt; z++) {
                    longestUnplacedChain.getAtom(z).flags[modelFlags.ISPLACED]=false;
                }
                layoutAtomPlacer.placeLinearChain(longestUnplacedChain, direction, bondLength);

            } else
                done = true;
        } else
            done = true;
    }
    while (!done && cntr <= molecule.countAtoms());
};

layoutCoordinateGenerator.getMostComplexRing = function(ringSet){
    var neighbors = new Array(ringSet.length);
	for (var i=0; i<neighbors.length; i++) {
		neighbors[i]=0;
	}
    var mostComplex = 0;
	var mostComplexPosition = 0;
    for (i = 0; i < ringSet.length; i++) {
        var ring1 = ringSet[i];
        for (var j = 0; j < ring1.atoms.length; j++){
            var atom1 = ring1[j];
            for (var k = i + 1; k < ringSet.length; k++) {
                var ring2 = ringSet[k];
                if (ring1 != ring2){
                    for (var l = 0; l < ring2.atoms.length; l++){
                        var atom2 = ring2[l];
                        if (atom1 == atom2) {
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
        if (neighbors[i] > mostComplex)
        {
            mostComplex = neighbors[i];
            mostComplexPosition = i;
        }
    }
    return ringSet[mostComplexPosition];
};
