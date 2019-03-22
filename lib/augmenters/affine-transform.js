const hasard = require('hasard');
const AbstractAugmenter = require('./abstract');

/**
* @typedef {Number  | Hasard.<Number>} NumberArgument
*/
/**
* @typedef {Boolean  | Hasard.<Boolean>} BooleanArgument
*/

/**
* A color (3 channels or 4 channels) to use in the augmentation step
* @typedef {Array.<Number>  | Hasard.<Array.<Number>>} ColorArgument
*/
/**
* @typedef {String  |  Hasard.<String>} BorderTypeArgument
* describe how to handle the new pixel created by the augmentation step
* * "constant" : use a constant variable
* * "transparent" : use transparent pixels
* * "replicate" : replicate the border's colors
*/

/**
*  Applies affine transformations to images.
* @constructor
* @param {Object} opts options
* @param {ArrayXY} [opts.scale= [0,0]] Scales (>1=zoom in, <1=zoom out),
* @param {ArrayXY} [opts.translatePercent = [0,0]] translates
* @param {ArrayXY} [opts.scale = [1,1]] scale percent
* @param {NumberArgument} [opts.rotate=0] degrees of rotation
* @param {NumberArgument} [opts.shear=0] degrees of shear
* @param {BooleanArgument} [keepSize=false] If true, the output image plane size will be fitted to the distorted image size, i.e. images rotated by 45deg will not be partially outside of the image plane.
* @param {ColorArgument} [opts.borderValue=[0,0,0]] if borderType is "constant" this is used as border pixel values
* @param {BorderTypeArgument} [opts.borderType="constant"] "constant", "replicate", "transparent"
* @example
// Simple usage, Affine transform with scale change
new ia.AffineTransform({scale: 1.2});
* @example
// Affine transform with rotation of 90° and random scale between 100% and 150%
new ia.AffineTransform({scale: h.number(1, 1.5), rotate: 90});
*/

class AffineTransformAugmenter extends AbstractAugmenter {
	constructor(opts) {
		super(opts);
		const {scale = [1, 1], translatePercent = [0, 0], rotate = 0, shear = 0, keepSize = false, borderValue = [0, 0, 0], borderType = 'constant'} = opts;
		this.scale = this.toSize2(scale);
		this.translatePercent = this.toSize2(translatePercent);
		this.rotate = rotate;
		this.shear = shear;
		this.keepSize = keepSize;
		this.borderValue = borderValue;
		this.borderType = borderType;
	}

	buildParams() {
		const {scale, translatePercent, rotate, shear, borderValue, borderType} = this;
		return new hasard.Object({
			scale,
			translatePercent,
			rotate,
			shear,
			borderValue,
			borderType
		});
	}

	getMatrix({
		scale,
		translatePercent,
		rotate,
		shear,
		width,
		height
	}) {
		const centerX = width / 2;
		const centerY = height / 2;
		// From http://scikit-image.org/docs/dev/api/skimage.transform.html#skimage.transform.AffineTransform

		const rot = rotate / 180 * Math.PI;
		const shr = shear / 180 * Math.PI;

		const a0 = scale[0] * Math.cos(rot);
		const a1 = -1 * scale[1] * Math.sin(rot + shr);

		const a2Base = (translatePercent[0] * width);

		const a2 = a2Base - (a0 * centerX) - (a1 * centerY) + centerX;

		const b0 = scale[0] * Math.sin(rot);
		const b1 = scale[1] * Math.cos(rot + shr);

		const b2Base = (translatePercent[1] * height);
		const b2 = b2Base - (b0 * centerY) - (b1 * centerX) + centerY;
		return this.backend.floatMatrix([[a0, a1, a2], [b0, b1, b2]]);
	}

	augmentImage({width, height, image}, {
		scale,
		translatePercent,
		rotate,
		shear,
		borderValue,
		borderType
	}) {
		const affineMatrix = this.getMatrix({
			scale,
			translatePercent,
			rotate,
			shear,
			width,
			height
		});
		console.log({borderType, borderValue})
		return this.backend.affine(image, {
			affineMatrix,
			size: [width, height],
			borderType,
			borderValue
		});
	}

	augmentPoints({points, width, height}, attr) {
		const affineMatrix = this.getMatrix(Object.assign({}, attr, {width, height}));
		const transformPoint = point => {
			const res = this.backend.matMul(affineMatrix, this.backend.point3(point.x, point.y, 1), affineMatrix.type);
			const res2 = this.backend.pointToArray(this.backend.point2FromMat(res));
			return res2
		};

		return points.map(transformPoint);
	}
}

module.exports = AffineTransformAugmenter;
