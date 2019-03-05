const h = require('hasard');
const AbstractAugmenter = require('./abstract');

/**
* Adds noise sampled from a gaussian distribution
* @param {Number} [opts.mean=0] `mean` of the gaussian distribution
* @param {Number} opts.sigma `sigma` of the gaussian distribution
* @param {Number} [opts.scale=1] if `scale` is defined (0 < scale < 1), then the noise can apply at a less granular scale
* @param {Number} [opts.perChannel=false] If perChannel is true, then the sampled values may be different per channel (and pixel).
*/

class AdditiveGaussianNoiseAugmenter extends AbstractAugmenter {
	constructor(opts) {
		super(opts);
		const {mean=0, sigma, scale=1, perChannel=false} = opts;
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
		
		const perChannelRef = h.reference({
			source: this.perChannel,
			context: 'image'
		});
		return h.object({
			noise: h.matrix({
				shape: h.array([
					h.round(h.multiply(scaleRef, width)), 
					h.round(h.multiply(scaleRef, height))
				]),
				contextName: 'image',
				value: h.if(this.perChannel,
					h.array([
						hasardPixelValue,
						hasardPixelValue,
						hasardPixelValue
					]),
					h.array({
						values: [
							hasardPixelValueRef,
							hasardPixelValueRef,
							hasardPixelValueRef
						],
						contextName: 'colorPixel'
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

module.exports = AdditiveGaussianNoiseAugmenter;
