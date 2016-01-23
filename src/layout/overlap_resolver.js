/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

const layoutVector2D = require('./vector2d.js');
const layoutCoordinateGenerator = require('./coordinate_generator.js');

module.exports = layoutOverlapResolver = function() {
 };

/**
 * Helper class for Structure Diagram Generation. Resolves atom or bond
 * overlaps after the actual generation of coords was done
 *
 * Javascript version of CDK's OverlapResolver (author C.Steinbeck)
 *
 * @author: markr@ebi.ac.uk
 */

layoutOverlapResolver.resolveOverlap = function(molecule, sssr){

    var overlappingAtoms = new Array();
    var overlapScore = layoutOverlapResolver.getOverlapScore(molecule, overlappingAtoms);
    if (overlapScore > 0)
        overlapScore = layoutOverlapResolver.displace(molecule, overlappingAtoms);
    return overlapScore;
};

/**
 *  Calculates a score based on the overlap of atoms.
 *  The overlap is calculated by summing up the distances between all pairs of
 *  atoms, if they are less than half the standard bondlength apart.
 */
layoutOverlapResolver.getOverlapScore = function(molecule, overlappingAtoms){

    var overlapScore = 0;
    var overlapCutoff = layoutCoordinateGenerator.BOND_LENGTH/5;

    var atCount= molecule.countAtoms();
    for (var f = 0; f < atCount; f++)
    {
        var atom1 = molecule.getAtom(f);
        var p1 = atom1.coord;
        for (var g = f + 1; g < atCount; g++)
        {
            var atom2 = molecule.getAtom(g);
            var p2 = atom2.coord;
            var distance = goog.math.Coordinate.distance(p1, p2);
            if (distance < overlapCutoff)
            {
                overlapScore += overlapCutoff;
				//alert("pushing "+atom1.symbol+" "+atom2.symbol)
                overlappingAtoms.push(new Array(atom1, atom2));
            }
        }
    }
    return overlapScore;
};



/**
 *  Makes a small displacement to some atoms or rings in the given
 *  atomcontainer.
 *
 *@param  molecule          Molecule to work on
 *@param  overlappingAtoms  Atoms that overlap (within a certain margin)
 */
layoutOverlapResolver.displace = function(molecule, overlappingAtoms)
{
    var maxSteps = 25;
	var steps=0;
    do {
        var p = Math.round(Math.random() * overlappingAtoms.length);
		if (p>=overlappingAtoms.length)
		  p=overlappingAtoms.length-1;
        var op = overlappingAtoms[p];
        if (op != undefined) {
			/* Now we have an overlapping pair of atoms, we calculate the 2D vector formed by the
	         * positions of both and translate one of the atoms by one tenth of a bond length. */
			var a1 = op[0];
			var a2 = op[1];
			var v1 = new layoutVector2D(a1.coord.x, a1.coord.y);
			var v2 = new layoutVector2D(a2.coord.x - a1.coord.x, a2.coord.y - a1.coord.y);
			v2.normalize();

			if (isNaN(v2.x))
				v2.x = 0.01;
			if (isNaN(v2.y))
				v2.y = 0.01;

			v2.scale(-1*layoutCoordinateGenerator.BOND_LENGTH/3);

			var choice = Math.random();
			if (choice > 0.5) {
				a2.coord.x += v2.x;
				a2.coord.y += v2.y;
			}
			else {
				a1.coord.x -= v2.x;
				a1.coord.y -= v2.y;
			}
			var overlapScore = layoutOverlapResolver.getOverlapScore(molecule, overlappingAtoms);
			steps++;
		}
		else {
			alert('problem layoutOverlapResolver.displace p is '+ p +' and len '+overlappingAtoms.length+' and '+op );
		}
    }
	while (overlapScore > 0 && !(steps > maxSteps));
    return overlapScore;
};
