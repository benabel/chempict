'use strict';

const layoutConnectionMatrix = function() {};

layoutConnectionMatrix.getMatrix = function(molecule) {

  var indexAtom1;
  var indexAtom2;

  var cntAtoms = molecule.countAtoms();
  var conMat = new Array(cntAtoms);
  for (var i = 0; i < cntAtoms; ++i) {
    conMat[i] = new Array(cntAtoms);
    for (var j = 0; j < cntAtoms; j++) conMat[i][j] = 0;
  }

  var cntBonds = molecule.countBonds();
  for (var f = 0; f < cntBonds; f++) {
    var bond = molecule.getBond(f);
    indexAtom1 = molecule.indexOfAtom(bond.source);
    indexAtom2 = molecule.indexOfAtom(bond.target);
    conMat[indexAtom1][indexAtom2] = 1;
    conMat[indexAtom2][indexAtom1] = 1;
  }
  // layoutConnectionMatrix.display(conMat);
  return conMat;
};

layoutConnectionMatrix.display = function(matrix) {
  var debug = '';
  var size = matrix.length;
  for (var i = 0; i < size; i++) {
    for (var i2 = 0; i2 < size; i2++) {
      if (matrix[i][i2] == undefined)
        debug += '[ ]';
      else
        debug += '[' + matrix[i][i2] + ']';
    }
    debug += '\n';
  }
  alert(debug);
};

module.exports = layoutConnectionMatrix;
