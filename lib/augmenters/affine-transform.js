const hasard = require('hasard');
const AbstractAugmenter = require('./abstract');

/**
*  Applies affine transformations to images.
* @param {Hasard.<[Number, Number]>} [opts.scale= [0,0]] Scales (>1=zoom in, <1=zoom out),
* @param {Hasard.<[Number, Number]>} [opts.translatePercent = [0,0]] translates
* @param {Hasard.<Number>} [opts.rotate=0] degrees of rotation
* @param {Hasard.<Number>} [opts.shear=0] degrees of shear
* @param {Hasard.<Boolean>} [keepSize=false] If true, the output image plane size will be fitted to the distorted image size, i.e. images rotated by 45deg will not be partially outside of the image plane.
* @param {Number} [opts.borderValue=[0,0,0]]
* @param {String} [opts.borderType="constant"] "constant", "replicate", "transparent"
*/

class AffineTransformAugmenter extends AbstractAugmenter {
	constructor(opts) {
		super(opts);
		const {scale = [0, 0], translatePercent = [0, 0], rotate = 0, shear = 0, keepSize = false, borderValue = [0, 0, 0], borderType = 'constant'} = opts;
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
		const a2 = (translatePercent[0] * width) + ((1 - scale[0]) * centerX) + (scale[0] * (centerX - (centerX * Math.cos(rot)) + (centerY * Math.sin(rot + shr))));

		const b0 = scale[0] * Math.sin(rot);
		const b1 = scale[1] * Math.cos(rot + shr);
		const b2 = (translatePercent[0] * height) + ((1 - scale[1]) * centerY) + (scale[1] * (centerY - (centerY * Math.cos(rot + shr)) - (centerX * Math.sin(rot))));

		return this.backend.floatMatrix([[a0, a1, a2], [b0, b1, b2]]);
	}

	/**
	* @param {PipedImageAttribute} imgAttributes
	* @param {PipedImageAttribute} augmenterRandomProperties
	*/
	augmentImage({width, height, img}, {
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
		return this.backend.affine(img, {
			affineMatrix,
			size: [width, height],
			borderType,
			borderValue
		});
	}

	augmentPoints({points, width, height}, attr) {
		const affineMatrix = this.getMatrix(Object.assign({}, attr, {width, height}));
		const transformPoint = function (point) {
			return this.backend.matMul(point, affineMatrix);
		};

		return points.map(transformPoint);
	}
}

module.exports = AffineTransformAugmenter;
