/**
 * Copyright 2010 Paul Novak (paul@wingu.com)
 * Copyright 2015-2016 Benjamin Abel bbig26@gmail.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';
const utilsArray = require('../utils/array');
const RingPathEdge = require('./path_edge');

/**
 * @param {modelMolecule} molecule -
 * @constructor
 */
const RingPathGraph = function(molecule) {
  /** @type{Array.<RingPathEdge>} */
  this.edges = [];

  /** @type{Array.<modelAtom>} */
  this.atoms = [];

  // load edges
  for (let i = 0, il = molecule.countBonds(); i < il; i++) {
    var bond = molecule.getBond(i);
    var edge = [bond.source, bond.target];
    this.edges.push(new RingPathEdge(edge));
  }
  // load atoms
  for (let i = 0, il = molecule.countAtoms(); i < il; i++) {
    this.atoms.push(molecule.getAtom(i));
  }
};

/**
 * @param {modelAtom} atom -
 * @param {number} maxLen -
 * @return {Array.<RingPathEdge>} -
 */
RingPathGraph.prototype.remove = function(atom, maxLen) {
  /** @type {Array.<ringPathEdge>} */
  var oldEdges = this.getEdges(atom);
  /** @type {Array.<kemia.ring.PathEdge>} */
  var result = [];
  for (let i = 0, il = oldEdges.length; i < il; i++) {
    if (oldEdges[i].isCycle()) {
      result.push(oldEdges[i]);
    }
  }

  oldEdges = utilsArray.diff(oldEdges, result);
  this.edges = utilsArray.diff(this.edges, result);

  /** @type {Array.<ringPathEdge>} */
  var newEdges = this.spliceEdges(oldEdges);

  this.edges = utilsArray.diff(this.edges, oldEdges);

  /*
   * for (Path newPath : newPaths) { if (maxPathLen == null || newPath.size() <=
   * (maxPathLen+1)) { paths.add(newPath); } }
   */

  for (let i = 0; i < newEdges.length; i++) {
    if (!this.edges.includes(newEdges[i]) && (newEdges[i].atoms.length <= maxLen + 1)) {
      this.edges.push(newEdges[i]);
    }
  }
  utilsArray.remove(this.atoms, atom);
  return result;
};

/**
 * @param {modelAtom} atom
 * @return {Array.<RingPathEdge>}
 */
RingPathGraph.prototype.getEdges = function(atom) {
  /** @type {Array.<RingPathEdge>} */
  var result = [];

  for (let i = 0, il = this.edges.length; i < il; i++) {
    /** @type {RingPathEdge} */
    var edge = this.edges[i];

    if (edge.isCycle()) {
      if (edge.atoms.includes(atom)) {
        result.push(edge);
      }
    } else {
      var lastAtomPos = edge.atoms.length - 1;
      if ((edge.atoms[0] === atom) || (edge.atoms[lastAtomPos] === atom)) {
        result.push(edge);
      }
    }
  }
  return result;
};

/**
 * @param {Array.<RingPathEdge>} _edges
 * @return {Array.<RingPathEdge>}
 */

RingPathGraph.prototype.spliceEdges = function(_edges) {
  var result = [];

  for (let i = 0, il = _edges.length; i < il; i++) {
    for (let j = i + 1; j < il; j++) {
      var spliced = _edges[j].splice(_edges[i]);
      if (spliced !== null) {
        result.push(spliced);
      }
    }
  }
  return result;
};

module.exports = RingPathGraph;
