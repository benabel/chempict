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

const modelFlags = require('./flags');
const resourceCovalence = require('../resource/covalence');
goog.require('goog.math.Coordinate');

/**
 * Class representing an atom
 *
 * @param {string=} optSymbol, Atom symbol, defaults to "C"
 * @param {number=} optX X-coordinate of atom, defaults to 0
 * @param {number=} optY, Y-coordinate of atom, defaults to 0
 * @param {number=} optCharge, Charge of atom, defaults to 0.
 * @param {boolean=} optAromatic, whether atom is aromatic, defaults to false
 * @param {number=} optIsotope, isotope, defaults to 0
 * @constructor
 */
const ModelAtom = function(optSymbol, optX, optY, optCharge, optAromatic, optIsotope) {
  /**
   * Atom symbol
   *
   * @type {string}
   */
  this.symbol = goog.isDef(optSymbol) ? optSymbol : 'C';

  var x = optX ? optX : 0;

  var y = optY ? optY : 0;

  /**
   * 2d coordinates
   *
   * @type{goog.math.Coordinate}
   */
  this.coord = new goog.math.Coordinate(x, y);
  /**
   * Bonds belonging to this atom
   *
   * @type{Set}
   */
  this.bonds = new Set();
  /**
   * charge
   *
   * @type{number}
   */
  this.charge = optCharge ? optCharge : 0;

  /**
   * isotope
   *
   * @type{number}
   */
  this.isotope = optIsotope ? optIsotope : 0;

  /**
   * aromatic
   *
   * @type{boolean}
   */
  this.aromatic = goog.isDef(optAromatic) ? optAromatic : false;

  this.hybridization = null;

  /**
   * Array with property flags (true/false)
   */
  this.flags = new Array(modelFlags.MAX_FLAG_INDEX + 1);

};

/** @return {string} atomic symbol */
ModelAtom.prototype.getSymbol = function() {
  return this.symbol;
};

/** @return {number} atomic charge */
ModelAtom.prototype.getCharge = function() {
  return this.charge;
};

ModelAtom.prototype.countBonds = function() {
  return this.bonds.size;
};
/**
 * Implict hydrogen count
 *
 * @return {number}
 */
ModelAtom.prototype.hydrogenCount = function() {
  /** @type {number} */
  var cov = resourceCovalence[this.symbol];

  var bondArray = Array.from(this.bonds);

  var totalBondOrder = bondArray.reduce((r, v) => { return r + v.order; }, 0);
  var hydrogenCount = 0;
  if (cov) {
    hydrogenCount = cov - totalBondOrder + this.charge;
  }
  return hydrogenCount;
};

/**
 * Get an array with the neighbor atoms.
 *
 * @return {Array.<ModelAtom>}
 */
ModelAtom.prototype.getNeighbors = function() {
  var bonds = Array.from(this.bonds);
  var nbrs = [];
  for (var i = 0, li = bonds.length; i < li; i++) {
    nbrs.push(bonds[i].otherAtom(this));
  }
  return nbrs;
};
/**
 * @param {ModelAtom} atom
 * @return {number} the next angle
 */
ModelAtom.nextBondAngle = function(atom) {
  var bonds = Array.from(atom.bonds);

  var newAngle;

  if (bonds.length === 0) {
    newAngle = 0;

  } else if (bonds.length === 1) {
    var otherAtom = bonds[0].otherAtom(atom);
    var existingAngle =
        goog.math.angle(atom.coord.x, atom.coord.y, otherAtom.coord.x, otherAtom.coord.y);

    var otherAnglesDiff = otherArray.from(atom.bonds).map(function(b) {
      var notOther = b.otherAtom(otherAtom);
      if (notOther !== atom) {
        return goog.math.angleDifference(
            existingAngle,
            goog.math.angle(
                otherAtom.coord.x, otherAtom.coord.y, notOther.coord.x, notOther.coord.y));
      }
    });
    otherAnglesDiff.sort();

    var minAngle = otherAnglesDiff[0];

    if (minAngle > 0) {
      newAngle = existingAngle - 120;
    } else {
      newAngle = existingAngle + 120;
    }
    // this.logger.info('existingAngle ' + existingAngle + '
    // otherAnglesDiff ' + otherAnglesDiff.toString() + ' newAngle ' +
    // newAngle);
  } else if (bonds.length === 2) {
    var angles = bonds.map(function(bond) {
      var otherAtom = bond.otherAtom(atom);
      return goog.math.angle(atom.coord.x, atom.coord.y, otherAtom.coord.x, otherAtom.coord.y);
    });
    var diff = goog.math.angleDifference(angles[0], angles[1]);
    if (Math.abs(diff) < 180) {
      diff = 180 + diff / 2;
    } else {
      diff = diff / 2;
    }
    newAngle = angles[0] + diff;
  } else if (bonds.length === 3) {
    // find two bonds with least number of bonds on other end to insert
    // between
    bonds.sort(function(b1, b2) {
      return goog.array.defaultCompare(
          b1.otherAtom(atom).Array.from(bonds).length, b2.otherAtom(atom).Array.from(bonds).length);
    });
    var insertBetween = goog.array.slice(bonds, 0, 2);

    var angles = insertBetween.map(function(b) {
      var otherAtom = b.otherAtom(atom);
      return goog.math.angle(atom.coord.x, atom.coord.y, otherAtom.coord.x, otherAtom.coord.y);
    });
    newAngle = angles[0] + goog.math.angleDifference(angles[0], angles[1]) / 2;
    // this.logger.info('angles ' + angles.toString() + " newAngle "
    // + newAngle);
  }
  return newAngle;
};

/**
 * clones this atom
 *
 * @return {ModelAtom}
 */
ModelAtom.prototype.clone = function() {
  return new ModelAtom(
      this.symbol, this.coord.x, this.coord.y, this.charge, this.aromatic, this.isotope);
};

/**
 * Hybridization states
 *
 * @enum {number}
 */
ModelAtom.Hybridizations = {
  S: 0,
  SP1: 1,      // linear
  SP2: 2,      // trigonal planar (single pi-electron in pz)
  SP3: 3,      // tetrahedral
  PLANAR3: 4,  // trigonal planar (lone pair in pz)
  SP3D1: 5,    // trigonal planar
  SP3D2: 6,    // octahedral
  SP3D3: 7,    // pentagonal bipyramid
  SP3D4: 8,    // square antiprim
  SP3D5: 9
  // tricapped trigonal prism
};

/**
 * Set a flag to be true or false
 *
 * @param {Object}
 *            flagType <modelFlags>
 * @param {Object}
 *            flagValue true or false
 */
ModelAtom.prototype.setFlag = function(flagType, flagValue) {
  this.flags[flagType] = flagValue;
};
/**
 * @return {string}
 */
ModelAtom.prototype.toString = function() {
  return 'ModelAtom [' + this.symbol + '] ' + this.coord.toString();
};

module.exports = ModelAtom;
