goog.provide('kemia.graphics.AffineTransform');
goog.require('goog.graphics.AffineTransform');

/**
 * @param {number=} opt_m00 The m00 coordinate of the transform.
 * @param {number=} opt_m10 The m10 coordinate of the transform.
 * @param {number=} opt_m01 The m01 coordinate of the transform.
 * @param {number=} opt_m11 The m11 coordinate of the transform.
 * @param {number=} opt_m02 The m02 coordinate of the transform.
 * @param {number=} opt_m12 The m12 coordinate of the transform.
 * @constructor
 * @extends {goog.graphics.AffineTransform}
 */
kemia.graphics.AffineTransform = function(opt_m00, opt_m10, opt_m01,
		opt_m11, opt_m02, opt_m12) {
	goog.graphics.AffineTransform.call(this);
	if (arguments.length == 6) {
		this.setTransform(/** @type {number} */
		(opt_m00),
		/** @type {number} */
		(opt_m10),
		/** @type {number} */
		(opt_m01),
		/** @type {number} */
		(opt_m11),
		/** @type {number} */
		(opt_m02),
		/** @type {number} */
		(opt_m12));
	}
};
goog.inherits(kemia.graphics.AffineTransform, goog.graphics.AffineTransform);

/**
 * convenience method to
 * transform array of coordinates
 *
 * @param trans {goog.graphics.AffineTransform} transform to apply.
 * @param source_coords {!Array.
 *            <goog.math.Coordinate>}
 * @return {!Array.<goog.math.Coordinate>}
 */
kemia.graphics.AffineTransform.transformCoords = function(trans, source_coords) {
	var pairs = goog.array.map(source_coords, function(coord) {
		return [coord.x, coord.y];
	});
	var source_points = goog.array.flatten(pairs);
	var dest_points = [];
	trans.transform(source_points, 0, dest_points, 0, source_points.length / 2);

	var dest_coords = [];
	for (var i = 0; i < dest_points.length; i += 2) {
		dest_coords.push(new goog.math.Coordinate(dest_points[i],
				dest_points[i + 1]));
	}
;
	return dest_coords;
};

/**
 * transform array of coordinates
 *
 * @param source_coords {!Array.
 *            <goog.math.Coordinate>}
 * @return {!Array.<goog.math.Coordinate>}
 */
kemia.graphics.AffineTransform.prototype.transformCoords = function(
		source_coords) {
	return kemia.graphics.AffineTransform.transformCoords(this, source_coords);
};

/**
 * @return {!kemia.graphics.AffineTransform} An AffineTransform object
 *     representing the inverse transformation.
 */
kemia.graphics.AffineTransform.prototype.createInverse = function() {
  var det = this.getDeterminant();
  return new kemia.graphics.AffineTransform(
      this.m11_ / det,
      -this.m10_ / det,
      -this.m01_ / det,
      this.m00_ / det,
      (this.m01_ * this.m12_ - this.m11_ * this.m02_) / det,
      (this.m10_ * this.m02_ - this.m00_ * this.m12_) / det);
};

kemia.graphics.AffineTransform.getRotateInstance = function(theta, x, y) {
	return new kemia.graphics.AffineTransform().setToRotation(theta, x, y);
};

kemia.graphics.AffineTransform.getScaleInstance = function(sx , sy) {
	return new kemia.graphics.AffineTransform().setToScale(sx, sy);
};



