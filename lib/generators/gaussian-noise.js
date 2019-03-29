const h = require('hasard');
const AbstractNoise = require('./abstract-noise');
/**
* Gaussian noise
* @param {Object | Number | Hasard} sigma options, if number, this is sigma
* @param {Number} [sigma.mean=0] `mean` of the gaussian distribution
* @param {Number} sigma.sigma `sigma` of the gaussian distribution
* @param {Number} [sigma.scale=1] if `scale` is defined (0 < scale < 1), then the noise can apply at a less granular scale
* @param {Number} [sigma.perChannel=false] If perChannel is true, then the sampled values may be different per channel (and pixel).
* @example
// Simple usage
new ia.GaussianNoise(3);
* @example
//Simple usage with random variable
*new ia.GaussianNoise(h.number(0, 3));
* @example
// Explicit usage with random variable
new ia.GaussianNoise({
	sigma: 3,
	scale: 0.5,
	perChannel: true,
	mean: 5
});
* @example
// Explicit usage with random variable
new ia.GaussianNoise({
	sigma: h.integer(0, 3),
	scale: h.number(0.2, 1),
	perChannel: h.boolean(),
	mean: h.number(-5, 5)
});
*/
class GaussianNoiseGenerator extends AbstractNoise {
	constructor(opts, ia) {
		let o;
		if (typeof (opts) === 'number' || h.isHasard(opts)) {
			o = {sigma: opts};
		} else {
			o = opts;
		}

		super(o, ia);
		const {mean = 0, sigma = 1} = o;
		this.mean = mean;
		this.sigma = sigma;
	}

	getHasardPixelValue() {
		return h.round(h.number({
			type: 'normal',
			mean: this.mean,
			std: this.sigma
		}));
	}
}
module.exports = GaussianNoiseGenerator;
