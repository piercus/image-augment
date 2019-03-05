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

		const a2 = a2Base - a0 * centerX - a1 * centerY + centerX;

		const b0 = scale[0] * Math.sin(rot);
		const b1 = scale[1] * Math.cos(rot + shr);

		const b2Base = (translatePercent[1] * height);
		const b2 = b2Base - b0 * centerY - b1 * centerX + centerY;
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
		const transformPoint = point => {
			const res = this.backend.matMul(affineMatrix, this.backend.point3(point.x, point.y, 1), affineMatrix.type);
			return this.backend.point(
				res.at(0, 0),
				res.at(1, 0)
			);
		};

		return points.map(transformPoint);
	}
}

module.exports = AffineTransformAugmenter;
