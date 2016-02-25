/*****
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

/*****
*
*   constructor
*
*****/

const LayoutVector2D = function(x, y) {
  if (arguments.length > 0) {
    this.x = x;
    this.y = y;
  }
};

/*****
*
*   length
*
*****/
LayoutVector2D.prototype.length = function() {
  return Math.sqrt(this.x * this.x + this.y * this.y);
};

/*****
*
*   dot
*
*****/
LayoutVector2D.prototype.dot = function(that) {
  return this.x * that.x + this.y * that.y;
};

/*****
*
*   cross
*
*****/
LayoutVector2D.prototype.cross = function(that) {
  return this.x * that.y - this.y * that.x;
};

/*****
*
*   unit
*
*****/
LayoutVector2D.prototype.unit = function() {
  return this.divide(this.length());
};

/*****
*
*   unitEquals
*
*****/
LayoutVector2D.prototype.unitEquals = function() {
  this.divideEquals(this.length());

  return this;
};

/*****
*
*   add
*
*****/
LayoutVector2D.prototype.add = function(that) {
  return new LayoutVector2D(this.x + that.x, this.y + that.y);
};

/*****
*
*   addEquals
*
*****/
LayoutVector2D.prototype.addEquals = function(that) {
  this.x += that.x;
  this.y += that.y;

  return this;
};

/*****
*
*   subtract
*
*****/
LayoutVector2D.prototype.subtract = function(that) {
  return new LayoutVector2D(this.x - that.x, this.y - that.y);
};

/*****
*
*   subtractEquals
*
*****/
LayoutVector2D.prototype.subtractEquals = function(that) {
  this.x -= that.x;
  this.y -= that.y;

  return this;
};

/*****
*
*   multiply
*
*****/
LayoutVector2D.prototype.multiply = function(scalar) {
  return new LayoutVector2D(this.x * scalar, this.y * scalar);
};

/*****
*
*   multiplyEquals
*
*****/
LayoutVector2D.prototype.multiplyEquals = function(scalar) {
  this.x *= scalar;
  this.y *= scalar;

  return this;
};

/*****
*
*   divide
*
*****/
LayoutVector2D.prototype.divide = function(scalar) {
  return new LayoutVector2D(this.x / scalar, this.y / scalar);
};

/*****
*
*   divideEquals
*
*****/
LayoutVector2D.prototype.divideEquals = function(scalar) {
  this.x /= scalar;
  this.y /= scalar;

  return this;
};

/*****
*
*   perp
*
*****/
LayoutVector2D.prototype.perp = function() {
  return new LayoutVector2D(-this.y, this.x);
};

/*****
*
*   perpendicular
*
*****/
LayoutVector2D.prototype.perpendicular = function(that) {
  return this.subtract(this.project(that));
};

/*****
*
*   project
*
*****/
LayoutVector2D.prototype.project = function(that) {
  var percent = this.dot(that) / that.dot(that);

  return that.multiply(percent);
};

/*****
*
*   toString
*
*****/
LayoutVector2D.prototype.toString = function() {
  return this.x + ',' + this.y;
};

/*****
*
*   fromPoints
*
*****/
LayoutVector2D.fromPoints = function(p1, p2) {
  return new LayoutVector2D(p2.x - p1.x, p2.y - p1.y);
};

/**
 * Sets the value of this tuple to the scalar multiplication
 * of itself.
 * @param s the scalar value
 */
LayoutVector2D.prototype.scale = function(s) {
  this.x *= s;
  this.y *= s;
};

/**
 * Normalizes this vector in place.
 */
LayoutVector2D.prototype.normalize = function() {
  var norm = (1.0 / Math.sqrt(this.x * this.x + this.y * this.y));
  this.x *= norm;
  this.y *= norm;
};

/**
 * Sets the value of this tuple to the vector difference of
 * itself and tuple t1 (this = this - t1).
 * @param t1 the other vector
 */
LayoutVector2D.prototype.sub = function(t1) {
  this.x -= t1.x;
  this.y -= t1.y;
};

/**
 * Sets the value of this tuple to the negation of tuple t1.
 * @param t1 the source vector
 */
LayoutVector2D.prototype.negate = function(t1) {
  this.x = -t1.x;
  this.y = -t1.y;
};
/**
 * Negates the value of this vector in place.
 */
LayoutVector2D.prototype.negate = function() {
  this.x = -this.x;
  this.y = -this.y;
};

/**
*   Returns the angle in radians between this vector and the vector
*   parameter; the return value is constrained to the range [0,PI].
*   @param v1    the other vector
*   @return   the angle in radians in the range [0,PI]
*/
LayoutVector2D.prototype.angle = function(v1) {
  var vDot = this.dot(v1) / (this.length() * v1.length());
  if (vDot < -1.0) vDot = -1.0;
  if (vDot > 1.0) vDot = 1.0;
  return ((Math.acos(vDot)));

};

module.exports = LayoutVector2D;
