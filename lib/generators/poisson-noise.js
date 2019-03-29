const h = require('hasard');
const AbstractNoise = require('./abstract-noise');
/**
* Poisson Noise generator
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
class PoissonNoiseGenerator extends AbstractNoise {
	constructor(opts, ia) {
		let o;
		if (typeof (opts) === 'number' || h.isHasard(opts)) {
			o = {lambda: opts};
		} else {
			o = opts;
		}

		super(o, ia);
		const {lambda} = o;
		this.lambda = lambda;
	}

	getHasardPixelValue() {
		return h.integer({
			type: 'poisson',
			lambda: this.lambda
		});
	}
}

module.exports = PoissonNoiseGenerator;
