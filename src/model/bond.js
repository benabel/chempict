var modelAtom = require('./atom');

/**
 * Base class representing a Bond
 *
 * @param {modelAtom}
 *            source, Atom at one end of bond.
 * @param {modelAtom}
 *            target, Atom at other end of bond.
 * @param {modelBond.ORDER=}
 *            optOrder, order of bond
 *
 * @param {modelBond.STEREO=}
 *            optStereo, stereochemistry of bond
 *
 * @param {boolean=}
 *            optAromatic, true if aromatic
 * @param {kemia.model.Molecule=} optMolecule, parent molecule
 *
 * @constructor
 */
module.exports = modelBond = function(source, target, optOrder, optStereo,
  optAromatic, optMolecule) {
  /**
   * source Atom
   *
   * @type {modelAtom}
   */
  this.source = source;
  /**
   * target Atom
   *
   * @type{modelAtom}
   */
  this.target = target;

  /**
   * The bond order.
   *
   * @type {modelBond.ORDER}
   */
  this.order = goog.isDef(optOrder) ? optOrder : modelBond.ORDER.SINGLE;

  /**
   * Stereochemistry
   *
   * @type {modelBond.STEREO}
   */
  this.stereo = goog.isDef(optStereo) ? optStereo : modelBond.STEREO.NOT_STEREO;

  /**
   * Aromatic flag.
   *
   * @type {boolean}
   */
  this.aromatic = goog.isDef(optAromatic) ? optAromatic : false;

  /**
   * parent molecule
   *
   * @type {kemia.model.Molecule}
   */
  this.molecule = goog.isDef(optMolecule) ? optMolecule : null;
};

/**
 * Get the atom at the other end of the bond from the subject atom
 *
 * @param {modelAtom}
 *            atom, the subject atom
 *
 * @return {modelAtom} The other bond atom or null if the specified atom
 *         is not part of the bond.
 */
modelBond.prototype.otherAtom = function(atom) {
  if (atom === this.source) {
    return this.target;
  }
  if (atom === this.target) {
    return this.source;
  }
  return null;
};

modelBond.prototype.getLength = function() {
  return goog.math.Coordinate.distance(this.source.coord, this.target.coord);
};

/**
 * clones this bond
 *
 * @return {modelBond}
 */
modelBond.prototype.clone = function() {
  return new modelBond(this.source, this.target, this.order,
    this.stereo, this.aromatic, this.molecule);
};

modelBond.prototype.deepClone = function() {
  return new modelBond(this.source.clone(), this.target.clone(), this.order,
    this.stereo, this.aromatic, this.molecule);

};

/**
 * enum for bond order
 *
 * @enum {number}
 */
modelBond.ORDER = {
  SINGLE: 1,
  DOUBLE: 2,
  TRIPLE: 3,
  QUADRUPLE: 4
};

/**
 * enum for bond stereochemistry
 *
 * @enum {number}
 */
modelBond.STEREO = {
  NOT_STEREO: 10,
  UP: 11,
  UP_OR_DOWN: 12,
  DOWN: 13
};

modelBond.prototype.toString = function() {
  var molname = this.molecule ? this.molecule.name : 'no molecule';
  return 'modelBond[' +
    this.order + ', ' +
    this.stereo + ']  ' +
    this.source.toString() + ' -- ' +
    this.target.toString() + ' mol: ' +
    molname;

};
