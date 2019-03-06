const h = require('hasard');
const AbstractAugmenter = require('./abstract');

/**
* Adds noise sampled from a gaussian distribution
* @param {Object | Number | Hasard} sigma options, if number, this is sigma
* @param {Number} [sigma.mean=0] `mean` of the gaussian distribution
* @param {Number} sigma.sigma `sigma` of the gaussian distribution
* @param {Number} [sigma.scale=1] if `scale` is defined (0 < scale < 1), then the noise can apply at a less granular scale
* @param {Number} [sigma.perChannel=false] If perChannel is true, then the sampled values may be different per channel (and pixel).
* @example
// Simple usage
new ia.AdditiveGaussianNoise(3);
* @example
//Simple usage with random variable
*new ia.AdditiveGaussianNoise(h.integer(0, 3));
* @example
// Explicit usage with random variable
new ia.AdditiveGaussianNoise({
	sigma: 3,
	scale: 0.5,
	perChannel: true,
	mean: 5
});
* @example
// Explicit usage with random variable
new ia.AdditiveGaussianNoise({
	sigma: h.integer(0, 3),
	scale: h.number(0.2, 1),
	perChannel: h.boolean(),
	mean: h.number(-5, 5)
});
*/

class AdditiveGaussianNoiseAugmenter extends AbstractAugmenter {
	constructor(opts) {
		let o;
		if (typeof (opts) === 'number' || h.isHasard(opts)) {
			o = {sigma: opts};
		} else {
			o = opts;
		}

		super(o);
		const {mean = 0, sigma, scale = 1, perChannel = false} = o;
		this.mean = mean;
		this.sigma = sigma;
		this.scale = scale;
		this.perChannel = perChannel;
	}

	buildParams({width, height, channels}) {
		const scaleRef = h.reference(this.scale);

		const hasardPixelValue = h.round(h.number({
			type: 'normal',
			mean: this.mean,
			sigma: this.sigma
		}));

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
						size: channels,
						value: hasardPixelValue
					}),
					h.array({
						size: channels,
						value: hasardPixelValueRef,
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

module.exports = AdditiveGaussianNoiseAugmenter;
