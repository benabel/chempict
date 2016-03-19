/** ***
*
*   Vector2D.js
*
*   copyright 2001-2002, Kevin Lindsey
*   Copyright 2015-2016 Benjamin Abel bbig26@gmail.com
*
*   markr: added extra functions
*
*****/
'use strict';

/** ***
*
*   constructor
*
*****/

const MathVector2D = function(x, y) {
  if (arguments.length > 0) {
    this.x = x;
    this.y = y;
  }
};

/** ***
*
*   length
*
*****/
MathVector2D.prototype.length = function() {
  return Math.sqrt(this.x * this.x + this.y * this.y);
};

/** ***
*
*   dot
*
*****/
MathVector2D.prototype.dot = function(that) {
  return this.x * that.x + this.y * that.y;
};

/** ***
*
*   cross
*
*****/
MathVector2D.prototype.cross = function(that) {
  return this.x * that.y - this.y * that.x;
};

/** ***
*
*   unit
*
*****/
MathVector2D.prototype.unit = function() {
  return this.divide(this.length());
};

/** ***
*
*   unitEquals
*
*****/
MathVector2D.prototype.unitEquals = function() {
  this.divideEquals(this.length());

  return this;
};

/** ***
*
*   add
*
*****/
MathVector2D.prototype.add = function(that) {
  return new MathVector2D(this.x + that.x, this.y + that.y);
};

/** ***
*
*   addEquals
*
*****/
MathVector2D.prototype.addEquals = function(that) {
  this.x += that.x;
  this.y += that.y;

  return this;
};

/** ***
*
*   subtract
*
*****/
MathVector2D.prototype.subtract = function(that) {
  return new MathVector2D(this.x - that.x, this.y - that.y);
};

/** ***
*
*   subtractEquals
*
*****/
MathVector2D.prototype.subtractEquals = function(that) {
  this.x -= that.x;
  this.y -= that.y;

  return this;
};

/** ***
*
*   multiply
*
*****/
MathVector2D.prototype.multiply = function(scalar) {
  return new MathVector2D(this.x * scalar, this.y * scalar);
};

/** ***
*
*   multiplyEquals
*
*****/
MathVector2D.prototype.multiplyEquals = function(scalar) {
  this.x *= scalar;
  this.y *= scalar;

  return this;
};

/** ***
*
*   divide
*
*****/
MathVector2D.prototype.divide = function(scalar) {
  return new MathVector2D(this.x / scalar, this.y / scalar);
};

/** ***
*
*   divideEquals
*
*****/
MathVector2D.prototype.divideEquals = function(scalar) {
  this.x /= scalar;
  this.y /= scalar;

  return this;
};

/** ***
*
*   perp
*
*****/
MathVector2D.prototype.perp = function() {
  return new MathVector2D(-this.y, this.x);
};

/** ***
*
*   perpendicular
*
*****/
MathVector2D.prototype.perpendicular = function(that) {
  return this.subtract(this.project(that));
};

/** ***
*
*   project
*
*****/
MathVector2D.prototype.project = function(that) {
  var percent = this.dot(that) / that.dot(that);

  return that.multiply(percent);
};

/** ***
*
*   toString
*
*****/
MathVector2D.prototype.toString = function() {
  return this.x + ',' + this.y;
};

/** ***
*
*   fromPoints
*
*****/
MathVector2D.fromPoints = function(p1, p2) {
  return new MathVector2D(p2.x - p1.x, p2.y - p1.y);
};

/**
 * Sets the value of this tuple to the scalar multiplication
 * of itself.
 * @param s the scalar value
 */
MathVector2D.prototype.scale = function(s) {
  this.x *= s;
  this.y *= s;
};

/**
 * Normalizes this vector in place.
 */
MathVector2D.prototype.normalize = function() {
  var norm = (1.0 / Math.sqrt(this.x * this.x + this.y * this.y));
  this.x *= norm;
  this.y *= norm;
};

/**
 * Sets the value of this tuple to the vector difference of
 * itself and tuple t1 (this = this - t1).
 * @param t1 the other vector
 */
MathVector2D.prototype.sub = function(t1) {
  this.x -= t1.x;
  this.y -= t1.y;
};

/**
 * Sets the value of this tuple to the negation of tuple t1.
 * @param t1 the source vector
 */
MathVector2D.prototype.negate = function(t1) {
  this.x = -t1.x;
  this.y = -t1.y;
};
/**
 * Negates the value of this vector in place.
 */
MathVector2D.prototype.negate = function() {
  this.x = -this.x;
  this.y = -this.y;
};

/**
*   Returns the angle in radians between this vector and the vector
*   parameter; the return value is constrained to the range [0,PI].
*   @param v1    the other vector
*   @return   the angle in radians in the range [0,PI]
*/
MathVector2D.prototype.angle = function(v1) {
  var vDot = this.dot(v1) / (this.length() * v1.length());
  if (vDot < -1.0) {
    vDot = -1.0;
  }
  if (vDot > 1.0) {
    vDot = 1.0;
  }
  return ((Math.acos(vDot)));
};

module.exports = MathVector2D;
