/*
 * Copyright [2010] [Mark Rijnbeek]
 * Copyright 2015-2016 Benjamin Abel bbig26@gmail.com
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied.
 * See the License for the specific language governing permissions and limitations under the
 * License.
 *
 * Ring finder classes, a JavaScript->Java conversion using
 * the MX Hanser ring finder classes.
 * For MX Java source see:
 * http://github.com/rapodaca/mx/tree/master/src/com/metamolecular/mx/ring/
 * http://metamolecular.com/mx
 */
'use strict';

const utilsArray = require('../utils/array');

const RingRing = require('./ring');
const RingPathEdge = require('./path_edge');
const RingPathGraph = require('./path_graph');

/**
 * Hanser ring finder.
 *
 * For details see: Th. Hanser, Ph. Jauffret, and G. Kaufmann A New Algorithm
 * for Exhaustive Ring Perception in a Molecular Graph J. kemia. Inf. Comput.
 * Sci. 1996, 36, 1146-1152
 */
const ringHanser = function() {};
/**
 * Hanser main loop, produces the rings for a given molecule.
 *
 * @param {kemia.model.Molecule} molecule
 * @param {number} maxLen
 * @return {Array.<kemia.model.Atom>}
 */
ringHanser.findRings = function(molecule, maxLen) {

  /** @type {Array.<kemia.model.Atom>} */
  var atomOnlyRings = [];

  /** @type {RingPathGraph} */
  var graph = new RingPathGraph(molecule);

  for (var i = 0, il = molecule.countAtoms(); i < il; i++) {
    /** @type {Array.<RingPathEdge>} */
    var edges = graph.remove(molecule.getAtom(i), maxLen);
    for (var j = 0; j < edges.length; j++) {
      /** @type {RingPathEdge} */
      var edge = edges[j];
      /** @type {Array.<kemia.model.Atom>} */
      var atomRing = edge.atoms;
      // Hanser last atom is same as first atom, remove it
      atomRing.pop();
      for (var k = 0, lk = atomRing.length; k < lk; k++) {
        atomRing[k] = molecule.indexOfAtom(atomRing[k]);
      }
      atomOnlyRings.push(atomRing);
    }
  }
  // xtra: sort array according to ring size
  atomOnlyRings.sort();
  return atomOnlyRings;
};

/**
 * The Hanser Ring Finder produces a ring as just a series of atoms. Here we
 * complete this information with the bonds and the ring center, creating a ring
 * object.
 *
 * @param {Array.<kemia.model.Atom>} atoms
 * @param {kemia.model.Molecule}  molecule
 * @return {RingRing}
 */
ringHanser.createRing = function(atoms, molecule) {

  var bonds = [];
  for (var i = 0, il = atoms.length - 1; i < il; i++) {
    var bond = molecule.findBond(atoms[i], atoms[i + 1]);
    if (bond !== null) {
      bonds.push(bond);
    }
  }
  // Hanser last atom is same as first atom, remove it..
  utilsArray.removeAt(atoms, atoms.length - 1);

  var ring = new RingRing(atoms, bonds);
  return ring;
};

module.exports = ringHanser;
