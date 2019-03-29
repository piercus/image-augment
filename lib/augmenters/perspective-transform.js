const hasard = require('hasard');
const AbstractAugmenter = require('./abstract');
/**
* Applies a random four-point perspective transform to the image (kinda like an advanced form of cropping).
* Each point has a random distance from the image corner, derived from a normal distribution with sigma `sigma`.
*
* Warning : this is only working with opencv4nodejs backend
*
* @param {Object} sigma options
* @param {NumberArgument} sigma.sigma the sigma of the normal distribution
* @param {BooleanArgument} sigma.keepSize If `keepSize` is set to True (default), each image will be resized back to its original size.
* @param {ColorArgument} [sigma.borderValue=[0,0,0]] if borderType is "constant" this is used as border pixel values
* @param {BorderTypeArgument} [sigma.borderType="constant"] can be "constant", "replicate", "transparent"
* @param {Array.<Array.<Number>>} [sigma.cornersVariation=null] if set, sigma is not used. For more deterministic behavior, use this to set manually the percent (x,y) variation of each corner
* @example
// Simple usage, perspective transform on a sigma=10% random perspective tarnsform
ia.perspectiveTransform(0.1);
* @example
// Now replicate the borders
ia.perspectiveTransform({
	sigma: 0.1,
	borderType: "replicate"
});
*/

class PerspectiveTransformAugmenter extends AbstractAugmenter {
	constructor(opts, ia) {
		let o;
		if (typeof (opts) === 'number' || hasard.isHasard(opts)) {
			o = {sigma: opts};
		} else {
			o = opts;
		}

		super(o, ia);
		const {sigma, keepSize, borderValue = [0, 0, 0], borderType = 'constant', cornersVariation} = o;
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
						std: hasard.getProperty(0, this.sigma)
					}),
					new hasard.Number({
						type: 'normal',
						std: hasard.getProperty(1, this.sigma)
					})
				])
			}),
			borderValue: this.borderValue,
			borderType: this.borderType
		});
	}

	getTransformationMatrix({cornersVariation, width, height}) {
		const cornersSrc = [[0, 0], [1, 0], [0, 1], [1, 1]];
		const srcPoints = cornersSrc.map(c => this.backend.point(c[0] * width, c[1] * height));

		const destPoints = cornersSrc.map((c, index) => this.backend.point((c[0] + cornersVariation[index][0]) * width, (c[1] + cornersVariation[index][1]) * height));
		return this.backend.getPerspectiveTransform(srcPoints, destPoints);
	}

	augmentImage({image, width, height}, {cornersVariation, borderValue, borderType}) {
		const transformationMatrix = this.getTransformationMatrix({width, height, cornersVariation});
		const res = this.backend.perspective(image, {transformationMatrix, size: [width, height], borderType, borderValue});
		this.backend.dispose(transformationMatrix);
		return res;
	}

	augmentPoints({points, width, height}, {cornersVariation}) {
		const transformationMatrix = this.getTransformationMatrix({width, height, cornersVariation});

		const transformPoint = point => {
			const res = this.backend.matMul(transformationMatrix, this.backend.point3(point.x, point.y, 1), transformationMatrix.type);
			const p2 = this.backend.pointFromMat(res);
			const res2 = this.backend.pointToArray(p2);
			this.backend.dispose(res);
			return [res2[0] / res2[2], res2[1] / res2[2]];
		};

		const res = points.map(transformPoint);
		this.backend.dispose(transformationMatrix);

		return res;
	}
}

module.exports = PerspectiveTransformAugmenter;
