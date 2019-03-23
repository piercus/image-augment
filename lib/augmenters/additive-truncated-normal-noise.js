const h = require('hasard');
const TruncatedNormalNoiseGenerator = require('../generators/truncated-normal-noise');
const AdditiveAugmenter = require('./additive');

/**
* Add a truncated normal noise
* When used with tfjs, this noise generator is much faster
*
* @param {Object | Number | Hasard} sigma options, if number, this is sigma
* @param {Number} [sigma.mean=0] `mean` of the gaussian distribution
* @param {Number} sigma.sigma `sigma` of the gaussian distribution
* @param {Number} [sigma.scale=1] if `scale` is defined (0 < scale < 1), then the noise can apply at a less granular scale
* @param {Number} [sigma.perChannel=false] If perChannel is true, then the sampled values may be different per channel (and pixel).
* @example
// Simple usage
new ia.Noise(3);
// alias of 
new ia.AdditiveTruncatedNormalNoise(3);
* @example
//Simple usage with random variable
*new ia.AdditiveTruncatedNormalNoise(h.number(0, 3));
* @example
// Explicit usage with random variable
new ia.AdditiveTruncatedNormalNoise({
	sigma: 3,
	scale: 0.5,
	perChannel: true,
	mean: 5
});
* @example
// Explicit usage with random variable
new ia.AdditiveTruncatedNormalNoise({
	sigma: h.integer(0, 3),
	scale: h.number(0.2, 1),
	perChannel: h.boolean(),
	mean: h.number(-5, 5)
});
*/

class AdditiveTruncatedNormalNoiseAugmenter extends AdditiveAugmenter {
	constructor(opts) {
		let o;
		if (typeof (opts) === 'number' || h.isHasard(opts)) {
			o = {sigma: opts};
		} else {
			o = opts;
		}

		o.Generator = TruncatedNormalNoiseGenerator;
		super(o);
	}
}

module.exports = AdditiveTruncatedNormalNoiseAugmenter;
