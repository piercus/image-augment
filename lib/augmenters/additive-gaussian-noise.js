const h = require('hasard');
const GaussianNoiseGenerator = require('../generators/gaussian-noise');
const AdditiveAugmenter = require('./additive');

/**
* Adds noise sampled from a gaussian distribution
*
* Warning : This function is slow, use `ia.additiveNoise` with tensorflowjs for fast noise generation
*
* @param {Object | Number | Hasard} sigma options, if number, this is sigma
* @param {Number} [sigma.mean=0] `mean` of the gaussian distribution
* @param {Number} sigma.sigma `sigma` of the gaussian distribution
* @param {Number} [sigma.scale=1] if `scale` is defined (0 < scale < 1), then the noise can apply at a less granular scale
* @param {Number} [sigma.perChannel=false] If perChannel is true, then the sampled values may be different per channel (and pixel).
* @example
// Simple usage
ia.additiveGaussianNoise(3);
* @example
//Simple usage with random variable
ia.additiveGaussianNoise(h.number(0, 3));
* @example
// Explicit usage with random variable
ia.additiveGaussianNoise({
	sigma: 3,
	scale: 0.5,
	perChannel: true,
	mean: 5
});
* @example
// Explicit usage with random variable
ia.additiveGaussianNoise({
	sigma: h.number(0, 3),
	scale: h.number(0.2, 1),
	perChannel: h.boolean(),
	mean: h.number(-5, 5)
});
*/

class AdditiveGaussianNoiseAugmenter extends AdditiveAugmenter {
	constructor(opts, ia) {
		let o;
		if (typeof (opts) === 'number' || h.isHasard(opts)) {
			o = {sigma: opts};
		} else {
			o = opts;
		}

		o.Generator = GaussianNoiseGenerator;
		super(o, ia);
	}
}

module.exports = AdditiveGaussianNoiseAugmenter;
