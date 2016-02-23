/**
 * Does a layout of all the rings in a connected ringset.
 *
 * @param {layoutVector2D}
 *            bondVector A vector for placement for the first bond
 * @param {Array.<kemia.ring.Ring>} ringset
 * The connected RingSet to be layed out
 */

module.exports = layoutRingSet = function(bondVector, ringset) {

  // TODO apply templates to layout pre-fab rings

  var bl = layoutCoordinateGenerator.bondLength;

  var mostComplexRing = layoutCoordinateGenerator.getMostComplexRing(ringset);

  if (!mostComplexRing.flags[modelFlags.ISPLACED]) {
    var sharedFrag = {
      atoms: layoutCoordinateGenerator.placeFirstBond(mostComplexRing.bonds[0], bondVector),
      bonds: [mostComplexRing.bonds[0]]
    };
    var sharedFragSum = goog.array.reduce(sharedFrag.atoms, function(r, atom) {
      return goog.math.Coordinate.sum(r, atom.coord);
    }, new goog.math.Coordinate(0, 0));
    var sharedFragCenter = new layoutVector2D(
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
