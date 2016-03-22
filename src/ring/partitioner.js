/*
 * Copyright 2010 Paul Novak paul@wingu.com
 * Copyright 2015-2016 Benjamin Abel bbig26@gmail.com
 *
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

const utilsArray = require('../utils/array');
const ringPartitioner = function() {};

/**
 * partitions array of rings into connected lists
 *
 * @param {Array.<ringRing>} rings list of rings to group into connected arrays
 * @return {Array.<ringRing>} array of arrays of Rings
 */

ringPartitioner.GetPartitionedRings = function(rings) {
  var partitions = [];
  var search = rings;
  rings.forEach(function(ring) {
    if (!utilsArray.flatten(partitions).find(e => e === ring)) {
      var connections = partitions.find(function(rings) { return rings.find(e => e === ring); });
      if (connections === undefined) {
        connections = [ring];  // start a new group of rings
        search = search.filter(function(r) { return r !== ring; });
      }
      var connected = ringPartitioner.directConnectedRings(ring, search);
      connections = [].concat(connections, connected);
      search = search.filter(function(r) { return connected.find(e => e === r); });
      partitions.push(connections);
    }
  });
  return partitions;
};

/**
 * finds rings directly connected to the subject ring
 *
 * @param{ringRing} ring the ring which we want to find direct
 *                         connections to
 * @param{Array.<ringRing>} rings to search for connections
 * @return{Array.<ringRing>} - rings connected to the ring parameter
 */
ringPartitioner.directConnectedRings = function(ring, rings) {
  var result = [];
  rings.forEach(function(r) {
    var isConnected = r.atoms.some(function(atom) {
      if (r === ring) {
        return false;
      }
      return ring.atoms.find(a => a === atom);
    });
    if (isConnected) {
      result.push(r);
    }
  });
  return result;
};

module.exports = ringPartitioner;
