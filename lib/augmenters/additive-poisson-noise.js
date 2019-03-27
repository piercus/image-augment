const h = require('hasard');
const PoissonNoiseGenerator = require('../generators/poisson-noise');
const AdditiveAugmenter = require('./additive');

/**
* Adds noise sampled from a poisson distribution
*
* Warning : This function is slow, use `ia.additiveNoise` with tensorflowjs for fast noise generation
*
* @param {Object} lambda options
* @param {Number} lambda.lambda `lambda` is the exponent of the poisson distribution
* @param {Number} [lambda.scale=1] if `scale` is defined (0 < scale < 1), then the noise can apply at a less granular scale
* @param {Number} [lambda.perChannel=false] If perChannel is true, then the sampled values may be different per channel (and pixel).
* @example
// Simple usage
ia.additivePoissonNoise(3);
* @example
//Simple usage with random variable
ia.additivePoissonNoise(h.integer(0, 3));
* @example
// Explicit usage with random variable
ia.additivePoissonNoise({
	lambda: 3,
	perChannel: true,
	mean: 5
});
* @example
// Explicit usage with random variable
ia.additivePoissonNoise({
	lambda: h.integer(0, 3),
	scale: h.number(0.2, 1),
	perChannel: h.boolean()
});
*/

class AdditivePoissonNoiseAugmenter extends AdditiveAugmenter {
	constructor(opts, ia) {
		let o;
		if (typeof (opts) === 'number' || h.isHasard(opts)) {
			o = {lambda: opts};
		} else {
			o = opts;
		}

		o.Generator = PoissonNoiseGenerator;
		super(o, ia);
	}
}

module.exports = AdditivePoissonNoiseAugmenter;
