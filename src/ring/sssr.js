/*
 * Copyright 2010 Tim Vandermeersch
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

goog.require('goog.structs.Set');
goog.require('goog.array');
const RingRing = goog.require('./ring');
goog.require('goog.array');
goog.require('goog.json');

/**
 * Smallest Set of Smallest rings.
 *
 * A robust method for searching the smallest set of smallest rings with a
 * path-included distance matrix, Chang Lee, PNAS, Oct. 13, 2009, vol. 16,
 * no. 41, pages 17355-17358
 *
 * http://www.pnas.org/content/106/41/17355.full
 * http://www.pnas.org/content/106/41/17355/suppl/DCSupplemental
 */

const ringSSSR = function() {};

/**
 * Make a deep copy of an array
 * @param {Array} arr
 * @return {Array}
 */
ringSSSR.deepCopy = function(arr) {
  var newArray = [];
  for (var i = 0, li = arr.length; i < li; i++) {
    var item = arr[i];
    if (item instanceof Array) {
      newArray.push(ringSSSR.deepCopy(item));
    } else {
      newArray.push(item);
    }
  }
  return newArray;
};

/**
 * Debug helper function
 * @param {Array.<Array.<number>>} matrix
 * @return {string}
 */
ringSSSR.matrixToHTML = function(matrix) {
  var text = '';
  var n = matrix.length;
  for (var i = 0; i < n; i++) {
    for (var j = 0; j < n; j++) {
      text += goog.json.serialize(matrix[i][j]) + ' ';
    }
    text += '<br>';
  }
  return text;
};

/**
 * Create a n x n matrix with all elements set to 0.
 * @param {number} n dimension
 * @return {Array.<Array.<number>>}
 */
ringSSSR.createEmptyMatrix = function(n) {
  var matrix = [];
  for (var i = 0; i < n; i++) {
    var row = [];
    for (var j = 0; j < n; j++) {
      row.push(0);
    }
    matrix.push(row);
  }
  return matrix;
};

/**
 * Create an initial distance matrix. This is  the D matrix from the paper.
 * @param {kemia.model.Molecule} molecule
 * @param {number} n
 * @return {Array.<Array.<number>>}
 */
ringSSSR.createWeightMatrix = function(molecule, n) {
  var matrix = [];
  for (var i = 0; i < n; i++) {
    var row = [];
    for (var j = 0; j < n; j++) {
      if (i === j) {
        row.push(0);
      } else if (molecule.findBond(molecule.getAtom(i), molecule.getAtom(j))) {
        row.push(1);
      } else {
        row.push(99999999);
      }
    }
    matrix.push(row);
  }
  return matrix;
};

/**
 * Create an empty Path-Included Distance matrix. This is an n x n matrix
 * with all elements set to an empty list (i.e. there is no path between
 * i and j)
 * @param {number} n
 * @return {Array.<Array.<Array>>}
 */
ringSSSR.createEmptyPIDMatrix = function(n) {
  var matrix = [];
  for (var i = 0; i < n; i++) {
    var row = [];
    for (var j = 0; j < n; j++) {
      row.push([]);
    }
    matrix.push(row);
  }
  return matrix;

};

/**
 * Create the initial Pe matrix. The supplementary information
 * indicates this should be an empty PID matrix, this makes no sense though.
 * We initialize it with adding all bonds as paths of length 1 when atom i
 * and j are connected.
 * @param {kemia.model.Molecule} molecule
 * @param {number} n
 * @return {Array.<Array.<Array.<Array.<number>>>>}
 */
ringSSSR.createPIDMatrix = function(molecule, n) {
  var matrix = [];
  for (var i = 0; i < n; i++) {
    var row = [];
    for (var j = 0; j < n; j++) {
      var beginAtom = molecule.getAtom(i);
      var endAtom = molecule.getAtom(j);
      var bond = molecule.findBond(beginAtom, endAtom);
      if (bond) {
        row.push([[molecule.indexOfBond(bond)]]);
      } else {
        row.push([]);
      }
    }
    matrix.push(row);
  }
  return matrix;
};

/**
 * Update a path included distance matrix element (i.e. lhs) by merging
 * p1 with p2.
 * @param {Array} lhs
 * @param {Array} p1
 * @param {Array} p2
 */
ringSSSR.appendPath = function(lhs, p1, p2) {
  if (!lhs.length) {
    lhs[0] = p1[0].concat(p2[0]);
  } else {
    lhs.push(p1[0].concat(p2[0]));
  }
};

/**
 * Create the two Path-Included Distance matrices (Pe and Pe') and the
 * distance matrix D. This is Algorithm 1 in the supplementary information
 * that comes with the paper.
 * @param {kemia.model.Molecule} molecule
 * @return {Object}
 */
ringSSSR.makePIDMatrixes = function(molecule) {
  var n = molecule.countAtoms();
  var D = ringSSSR.createWeightMatrix(molecule, n);
  var Pe1 = ringSSSR.createPIDMatrix(molecule, n);  // Pe
  var Pe2 = ringSSSR.createEmptyPIDMatrix(n);       // Pe'
  var lastD = D;

  // debug("Pe =<br>" + matrixToHTML(Pe1));
  // debug("Pe' =<br>" + matrixToHTML(Pe2));

  for (var k = 0; k < n; k++) {
    for (var i = 0; i < n; i++) {
      for (var j = 0; j < n; j++) {
        var lastPathLength = lastD[i][j];
        var pathLength = lastD[i][k] + lastD[k][j];
        var path1 = Pe1[i][k];
        var path2 = Pe1[k][j];

        // ignore invalid paths
        if (pathLength === 100000000) {
          continue;
        }

        if (lastPathLength > pathLength) {
          if (lastPathLength === pathLength + 1) {
            // a new shortest path = previous shortest path -1 => Pe' <- Pe
            Pe2[i][j] = ringSSSR.deepCopy(Pe1[i][j]);
          } else {
            Pe2[i][j] = [];
          }

          // a new shortest path is found
          D[i][j] = pathLength;
          Pe1[i][j] = [path1[0].concat(path2[0])];  // change path
        } else if (lastPathLength === pathLength) {
          // another shortest path is found
          if (path1.length && path2.length) {
            ringSSSR.appendPath(Pe1[i][j], path1, path2);  // append path
          }
        } else if (lastPathLength === pathLength - 1) {
          // shortest path + 1 found
          ringSSSR.appendPath(Pe2[i][j], path1, path2);  // append path
        } else {
          D[i][j] = lastD[i][j];
        }
      }
    }
  }

  // debug("D =<br>" + matrixToHTML(D));
  // debug("Pe =<br>" + matrixToHTML(Pe1));
  // debug("Pe' =<br>" + matrixToHTML(Pe2));

  return {'D': D, 'Pe1': Pe1, 'Pe2': Pe2};
};

/**
 * Sort function to sort the set of candidates by increasing Cnum (i.e. ring size).
 */
ringSSSR.sortByCnum = function(a, b) {
  return a['Cnum'] - b['Cnum'];
};

/**
 * Compute the set of ring candidates using the distance matrix and the
 * two path-included distance matrices. This is algorithm 2 in supplementary
 * information.
 * @param {Array.<Array.<number>>} D
 * @param {Array.<Array.<Array.<number>>>} Pe1
 * @param {Array.<Array.<Array>>} Pe2
 * @return {Array}
 */
ringSSSR.makeCandidateSet = function(D, Pe1, Pe2) {
  var n = D.length;
  var Cset = [];

  for (var i = 0; i < n; i++) {
    for (var j = 0; j < n; j++) {
      if (D[i][j] === 0 || (Pe1[i][j].length === 1 && Pe2[i][j].length === 0)) {
        continue;  // skip degenerate cases
      } else {
        var Cnum;
        if (Pe2[i][j].length) {
          Cnum = 2 * (D[i][j] + 0.5);  // odd ring candidate
        } else {
          Cnum = 2 * D[i][j];  // even ring candidate
        }
        Cset.push({'Cnum': Cnum, 'Pe1': Pe1[i][j], 'Pe2': Pe2[i][j]});
      }
    }
  }

  // sort the candidates by increasing ring size
  Cset.sort(ringSSSR.sortByCnum);

  return Cset;
};

/**
 * Check if a candidate is already part of the SSSR set. A ring is considered
 * to be in the set if the set contains an identical ring or a ring that is a
 * subset of the candidate. This is the XOR function from the paper.
 *
 * Update: The paper is wrong in it's definition. The problem was found with
 * a carborane structure containing a benzene ring. Carborane forms a icosahedron
 * and is one of the  platonic solids. We can reduce the problem to the case
 * for a tetrahedron. With it's m (6) bonds and n (4) atoms, Euler's formula
 * gives the number of rings in the SSSR as m - n + 1. This is 3 in the
 * tetrahedral case. Applying the rules from the paper there are 4 unique
 * rings though, one for each face. The 4th ring is not identical to the 3
 * previous and also doesn't contain any of them. The best solution is to
 * keep track of an atoms' ring count. If there is at least one atom with a
 * ring count less than it's valence minus one, the ring candidate is part
 * of the SSSR.
 * @param {Array.<number>} C
 * @param {Array} Csssr
 * @param {Array} valences
 * @param {Array} ringCount
 * @return {boolean}
 */
ringSSSR.isCandidateInSet = function(C, Csssr, valences, ringCount) {
  for (var i = 0, li = Csssr.length; i < li; i++) {
    var sssr = Csssr[i];
    // the part from the paper
    if (C.length >= sssr.length) {
      var candidateContainsRing = true;
      for (var j = 0, lj = sssr.length; j < lj; j++) {
        if (!goog.array.contains(C, sssr[j])) {
          candidateContainsRing = false;
        }
      }
      if (candidateContainsRing) return true;
    }
    // updated part
    for (j = 0, lj = C.length; j < lj; j++) {
      if (goog.array.contains(sssr, C[j])) {
        ringCount[j]++;
      }
    }
  }

  // If the candidate has at least one atom with a ringCount less than the
  // valence minus one, the candidate is a new ring. You can work this out
  // on paper for tetrahedron, cube, ...
  var isNewRing = false;
  for (j = 0, lj = C.length; j < lj; j++) {
    if (ringCount[C[j]] < valences[C[j]] - 1) {
      isNewRing = true;
    }
  }

  if (isNewRing) {
    for (j = 0, lj = C.length; j < lj; j++) {
      ringCount[C[j]]++;
    }
    return false;
  }
  return true;
};

/**
 * Convert an array of bond indexes to an array of atom indexes.
 * @param {Array.<number>} ring
 * @param {kemia.model.Molecule} molecule
 * @return {Array.<number>}
 */
ringSSSR.bondRingToAtomRing = function(ring, molecule) {
  var atoms = [];
  for (var i = 0, li = ring.length; i < li; i++) {
    var bond = molecule.getBond(ring[i]);
    var sourceIndex = molecule.indexOfAtom(bond.source);
    var targetIndex = molecule.indexOfAtom(bond.target);
    if (!goog.array.contains(atoms, sourceIndex)) {
      atoms.push(sourceIndex);
    }
    if (!goog.array.contains(atoms, targetIndex)) {
      atoms.push(targetIndex);
    }
  }
  return atoms;
};

/**
 * Process a candidate by checking if it is already in the set.
 * Add the ring ring to the SSSR set if it is not.
 * @param {Array.<number>} bondIndexes
 * @param {Array} Csssr
 * @param {kemia.model.Molecule} molecule
 * @param {Array} valences
 * @param {Array} ringCount
 */
ringSSSR.processCandidate = function(bondIndexes, Csssr, molecule, valences, ringCount) {
  var atomIndexes = ringSSSR.bondRingToAtomRing(bondIndexes, molecule);
  if (bondIndexes.length !== atomIndexes.length) {
    // these are two connected rings for example;
    //      1 --- 4
    //     / \   /    The path is 1-2, 2-3, 3-1,
    //    /   \ /                 1-4 and 4-3
    //   2 --- 3
    return;
  }
  if (!ringSSSR.isCandidateInSet(atomIndexes, Csssr, valences, ringCount)) {
    Csssr.push(atomIndexes);
  }
};

/**
 * Search the candidates to find the Smallest Set of Smallest rings. This
 * is algorithm 3 from the supplementary information.
 * @param {Array} Cset
 * @param {number} nsssr
 * @param {kemia.model.Molecule} molecule
 * @param {Object} D
 * @return {Array}
 */
ringSSSR.candidateSearch = function(Cset, nsssr, molecule, D) {
  // The final SSSR set
  var Csssr = [];
  // store the valences for all atoms
  var valences = [];
  for (var i = 0, li = molecule.countAtoms(); i < li; i++) {
    valences.push(molecule.getAtom(i).countBonds());
  }

  var ringCount = [];
  for (var i = 0; i < molecule.countAtoms(); i++) {
    ringCount[i] = 0;
  }

  for (var i = 0, li = Cset.length; i < li; i++) {
    var set = Cset[i];

    if (set['Cnum'] % 2) {
      // odd ring
      for (var j = 0, lj = set['Pe2'].length; j < lj; j++) {
        var bondIndexes = set['Pe1'][0].concat(set['Pe2'][j]);
        ringSSSR.processCandidate(bondIndexes, Csssr, molecule, valences, ringCount);
        if (Csssr.length === nsssr) {
          return Csssr;
        }
      }
    } else {
      // even ring
      for (var j = 0, lj = set['Pe1'].length - 1; j < lj; j++) {
        var bondIndexes = set['Pe1'][j].concat(set['Pe1'][j + 1]);
        ringSSSR.processCandidate(bondIndexes, Csssr, molecule, valences, ringCount);
        if (Csssr.length === nsssr) {
          return Csssr;
        }
      }
    }
  }
  return Csssr;
};

/**
 *
 * @param {Array.<number>} atomIndexes
 * @param {kemia.model.Molecule} molecule
 * @return {Array}
 */
ringSSSR.sortByPath = function(atomIndexes, molecule) {
  var pathAtomIndexes = [atomIndexes[0]];
  var beginAtom = molecule.getAtom(atomIndexes[0]);
  var l = 0;
  while (atomIndexes.length !== pathAtomIndexes.length) {
    l++;
    if (l > 1000) break;
    for (var i = 1, li = atomIndexes.length; i < li; i++) {
      var iAtom = molecule.getAtom(pathAtomIndexes[pathAtomIndexes.length - 1]);
      var jAtom = molecule.getAtom(atomIndexes[i]);
      if (goog.array.contains(pathAtomIndexes, atomIndexes[i])) {
        continue;
      }
      if (molecule.findBond(iAtom, jAtom)) {
        pathAtomIndexes.push(atomIndexes[i]);
      } else if (molecule.findBond(beginAtom, jAtom)) {
        goog.array.insertAt(pathAtomIndexes, atomIndexes[i], 0);
      }
    }
  }
  return pathAtomIndexes;
};

/**
 * Find the Smallest Set of Smallest rings.
 * @param {kemia.model.Molecule} molecule
 * @return {Array.<Array.<number>>}
 */
ringSSSR.findRings = function(molecule) {
  // var start = new Date().getTime();
  // Compute the number of rings in the SSSR using Euler's formula.
  //
  //   nsssr = m - n + 1    m: number of bonds
  //                        n: number of atoms
  //
  var nsssr = molecule.countBonds() - molecule.countAtoms() + 1;
  if (!nsssr) {
    // If there are no rings, exit now
    return [];
  }
  // Create the path-included distance matrices
  var matrices = ringSSSR.makePIDMatrixes(molecule);
  // Create the initial candidate set. This will be  sets with bond indexes.
  var Cset = ringSSSR.makeCandidateSet(matrices['D'], matrices['Pe1'], matrices['Pe2']);
  // Select the SSSR from the candidates
  var indexes = ringSSSR.candidateSearch(Cset, nsssr, molecule, matrices['D']);

  for (var i = 0, li = indexes.length; i < li; i++) {
    indexes[i] = ringSSSR.sortByPath(indexes[i], molecule);
  }

  return indexes;
};

module.exports = ringSSSR;
