const hasard = require('hasard');
const AbstractAugmenter = require('./abstract');
/**
* Applies a random four-point perspective transform to the image (kinda like an advanced form of cropping).
* Each point has a random distance from the image corner, derived from a normal distribution with sigma `sigma`.
* If `keepSize` is set to True (default), each image will be resized back to its original size.
* @param {Number} opts.sigma
* @param {Number} opts.keepSize
* @param {Number} [opts.borderValue=[0,0,0]]
* @param {Number} [opts.borderType="replicate"]
*/

class PerspectiveTransformAugmenter extends AbstractAugmenter {
	constructor(opts) {
		super(opts);
		const {sigma, keepSize, borderValue = [0, 0, 0], borderType = 'replicate', cornersVariation} = opts;
		this.sigma = this.toSize2(sigma) || [0, 0];
		this.keepSize = keepSize;
		this.borderValue = borderValue;
		this.borderType = borderType;
		this.cornersVariation = cornersVariation;
	}

	buildParams() {
		return new hasard.Object({
			cornersVariation: this.cornersVariation || new hasard.Array({
				size: 4,
				value: new hasard.Array([
					new hasard.Number({
						type: 'normal',
						std: this.sigma[0]
					}),
					new hasard.Number({
						type: 'normal',
						std: this.sigma[1]
					})
				])
			}),
			borderValue: this.borderValue,
			borderType: this.borderType
		});
	}

	/**
	* @param {PipedImageAttribute} imgAttributes
	* @param {AugmenterRandomProperties} augmenterRandomProperties
	* @returns {PipedImageAttribute}
	*/

	getTransformationMatrix({cornersVariation, width, height}) {
		const cornersSrc = [[0, 0], [1, 0], [0, 1], [1, 1]];
		const srcPoints = cornersSrc.map(c => this.backend.point(c[0] * width, c[1] * height));

		const destPoints = cornersSrc.map((c, index) => this.backend.point((c[0] + cornersVariation[index][0]) * width, (c[1] + cornersVariation[index][1]) * height));

		return this.backend.getPerspectiveTransform(srcPoints, destPoints);
	}

	augmentImage({img, width, height}, {cornersVariation, borderValue, borderType}) {
		const transformationMatrix = this.getTransformationMatrix({width, height, cornersVariation});
		return this.backend.perspective(img, {transformationMatrix, size: [width, height], borderType, borderValue});
	}

	augmentPoints({points, width, height}, {cornersVariation}) {
		const transformationMatrix = this.getTransformationMatrix({width, height, cornersVariation});

		const transformPoint = function (point) {
			return this.backend.matMul(transformationMatrix, point);
		};

		const res = points.map(transformPoint);
		return res;
	}
}

module.exports = PerspectiveTransformAugmenter;
