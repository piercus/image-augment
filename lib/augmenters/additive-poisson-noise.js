const h = require('hasard');
const AbstractAugmenter = require('./abstract');

/**
* Adds noise sampled from a poisson distribution
* @param {Object} lambda options
* @param {Number} lambda.lambda `lambda` is the exponent of the poisson distribution
* @param {Number} [lambda.scale=1] if `scale` is defined (0 < scale < 1), then the noise can apply at a less granular scale
* @param {Number} [lambda.perChannel=false] If perChannel is true, then the sampled values may be different per channel (and pixel).
* @example
// Simple usage
new ia.AdditivePoissonNoise(3);
* @example
//Simple usage with random variable
*new ia.AdditivePoissonNoise(h.integer(0, 3));
* @example
// Explicit usage with random variable
new ia.AdditivePoissonNoise({
	lambda: 3,
	perChannel: true,
	mean: 5
});
* @example
// Explicit usage with random variable
new ia.AdditivePoissonNoise({
	lambda: h.integer(0, 3),
	scale: h.number(0.2, 1),
	perChannel: h.boolean()
});
*/

class AdditivePoissonNoiseAugmenter extends AbstractAugmenter {
	constructor(opts) {
		let o;
		if (typeof (opts) === 'number' || h.isHasard(opts)) {
			o = {lambda: opts};
		} else {
			o = opts;
		}

		super(o);
		const {lambda, scale = 1, perChannel = false} = o;
		this.lambda = lambda;
		this.scale = scale;
		this.perChannel = perChannel;
	}

	buildParams({width, height, channels}) {
		const scaleRef = h.reference(this.scale);

		const hasardPixelValue = h.integer({
			type: 'poisson',
			lambda: this.lambda
		});

		const hasardPixelValueRef = h.reference({
			source: hasardPixelValue,
			context: 'colorPixel'
		});

		return h.object({
			noise: h.matrix({
				shape: h.array([
					h.round(h.multiply(scaleRef, width)),
					h.round(h.multiply(scaleRef, height))
				]),
				contextName: 'image',
				value: h.if(this.perChannel,
					h.array({
						values: channels === 4 ? [hasardPixelValue, hasardPixelValue, hasardPixelValue, 1] : [hasardPixelValue, hasardPixelValue, hasardPixelValue]
					}),
					h.array({
						values: channels === 4 ? [hasardPixelValueRef, hasardPixelValueRef, hasardPixelValueRef, 1] : [hasardPixelValueRef, hasardPixelValueRef, hasardPixelValueRef],
						contextName: 'colorPixel'
					})
				)
			}),
			scale: scaleRef
		});
	}

	augmentImage({img}, {noise, scale}) {
		return this.backend.addNoise(img, {noise, scale});
	}
}

module.exports = AdditivePoissonNoiseAugmenter;
