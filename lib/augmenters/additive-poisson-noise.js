const h = require('hasard');
const AbstractAugmenter = require('./abstract');

/**
* Adds noise sampled from a poisson distribution
* @param {Number} opts.lambda `lambda` is the exponent of the poisson distribution
* @param {Number} [opts.scale=1] if `scale` is defined (0 < scale < 1), then the noise can apply at a less granular scale
* @param {Number} [opts.perChannel=false] If perChannel is true, then the sampled values may be different per channel (and pixel).
*/

class AdditivePoissonNoiseAugmenter extends AbstractAugmenter {
	constructor(opts) {
		super(opts);
		const {lambda, scale, perChannel} = opts;
		this.lambda = lambda;
		this.scale = scale;
		this.perChannel = perChannel;
	}

	buildParams({width, height, channels}) {
		const scaleRef = h.reference(this.scale);

		console.log([width, height, channels, this.lambda]);

		const hasardPixelValue = h.multiply(
			h.if(h.boolean(), -1, 1),
			h.integer({
				type: 'poisson',
				lambda: this.lambda
			})
		);

		const hasardPixelValueRef = h.reference({
			source: hasardPixelValue,
			inScope: 'colorPixel'
		});
		return h.object({
			noise: h.matrix({
				shape: [height, width, 4],
				value: h.if(this.perChannel,
					h.array([
						hasardPixelValue,
						hasardPixelValue,
						hasardPixelValue,
						0
					]),
					h.array({
						values: [
							hasardPixelValueRef,
							hasardPixelValueRef,
							hasardPixelValueRef,
							0
						],
						scope: 'colorPixel'
					})
				)
			}),
			scale: scaleRef
		});
	}

	/**
	* @param {PipedImageAttribute} imgAttributes
	* @param {AugmenterRandomProperties} augmenterRandomProperties
	* @returns {PipedImageAttribute}
	*/
	augmentImage({img}, {noise, scale}) {
		return this.backend.addNoise(img, {noise, scale});
	}
}

module.exports = AdditivePoissonNoiseAugmenter;
