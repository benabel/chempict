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

goog.require('goog.array');

const ringPartitioner = function() {};

/**
 * partitions array of rings into connected lists
 *
 * @param {Array.
 *            <kemia.ring.Ring>} rings list of rings to group into connected
 *            arrays
 * @return {Array.<Array.<kemia.ring.Ring>>} array of arrays of Rings
 */
ringPartitioner.getPartitionedRings = function(rings) {
  var partitions = [];
  var done = new Array(rings.length);
  for (var x = 0, x2 = rings.length; x < x2; x++) {
    done[x] = false;
  }
  for (var i = 0, j = rings.length; i < j; i++) {
    if (!done[i]) {
      var partition = new Array();
      partition.push(rings[i]);
      done[i] = true;
      var atomCount = rings[i].atoms.length;
      for (var k = i + 1; k < rings.length; k++) {
        if (!done[k]) {
          var atomCount2 = rings[k].atoms.length;
          connected: for (var p = 0; p < partition.length; p++) {
            atomCount = partition[p].atoms.length;
            for (var a = 0; a < atomCount; a++) {
              for (var a2 = 0; a2 < atomCount2; a2++) {
                if (partition[p].atoms[a] === rings[k].atoms[a2]) {
                  partition.push(rings[k]);
                  done[k] = true;
                  k = i;
                  break connected;
                }
              }
            }
          }
        }
      }
      partitions.push(partition);
    }
  }
  return partitions;
};

/**
 * finds rings directly connected to the subject ring
 *
 * @param{kemia.ring.Ring} ring, the ring which we want to find direct
 *                         connections to
 * @param{Array.<kemia.ring.Ring>} rings, the rings we want to search for
 *               connections
 * @return{Array.<kemia.ring.Ring>} array of directly connected rings, which
 *                does *not* include the subject ring
 */
ringPartitioner.directConnectedRings = function(ring, rings) {
  var result = [];
  var atomCount = ring.atoms.length;
  for (var k = 0, k1 = rings.length; k < k1; k++) {
    if (ring !== rings[k]) {
      var atomCount2 = rings[k].atoms.length;
      connected: for (var a = 0; a < atomCount; a++) {
        for (var a2 = 0; a2 < atomCount2; a2++) {
          if (ring.atoms[a] === rings[k].atoms[a2]) {
            result.push(rings[k]);
            break connected;
          }
        }
      }
    }
  }
  return result;
};

/**
 * partitions array of rings into connected lists
 *
 * @param {Array.
 *            <kemia.ring.Ring>} rings list of rings to group into connected
 *            arrays
 * @return {Array.<Array.<kemia.ring.Ring>>} array of arrays of Rings
 */

ringPartitioner.getPartitionedRings = function(rings) {
  var partitions = [];
  var search = rings;
  goog.array.forEach(rings, function(ring) {
    if (!goog.array.contains(goog.array.flatten(partitions), ring)) {
      var connections =
          goog.array.find(partitions, function(rings) { return goog.array.contains(rings, ring); });
      if (connections === null) {
        connections = [ring];  // start a new group of rings
        search = goog.array.filter(search, function(r) { return r !== ring; });
      }
      var connected = ringPartitioner.directConnectedRings(ring, search);
      connections = goog.array.concat(connections, connected);
      search = goog.array.filter(search, function(r) { goog.array.contains(connected, r); });
      partitions.push(connections);
    };
  });
  return partitions;
};

/**
 * finds rings directly connected to the subject ring
 *
 * @param{kemia.ring.Ring} ring the ring which we want to find direct
 *                         connections to
 * @param{Array.<kemia.ring.Ring>} rings to search for connections
 * @return{Array.<kemia.ring.Ring>}
 */
ringPartitioner.directConnectedRings = function(ring, rings) {
  var result = [];
  goog.array.forEach(rings, function(r) {
    var isConnected = goog.array.some(r.atoms, function(atom) {
      if (r === ring) {
        return false;
      } else {
        return goog.array.contains(ring.atoms, atom);
      }
    });
    if (isConnected) {
      result.push(r);
    }
  });
  return result;
};

module.exports = ringPartitioner;
