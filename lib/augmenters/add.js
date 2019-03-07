const h = require('hasard');
const GaussianNoiseGenerator = require('../generators/gaussian-noise');
const AbstractAugmenter = require('./abstract');

/**
* Adds noise sampled from a gaussian distribution
* @param {Object | Array.<Number> | Hasard} value 
* @example
// Simple usage, add 12 red to the image's pixels
new ia.Add([12, 0, 0]);
*/

class AddAugmenter extends AbstractAugmenter {
	constructor(opts) {
		let o;
		if (typeof (opts) === 'number' || Array.isArray(opts) || h.isHasard(opts)) {
			o = {kernel: opts};
		} else {
			o = opts;
		}

		super(opts);
		const {value} = o;
		this.value = this.toSize3(value);
	}

	buildParams({width, height, channels}) {
		return h.fn(v => this.backend.signedMatrixFromSize(width, height, 3, [v[2], v[1], v[0]]))(this.value)
	}

	augmentImage({img}, im) {
		return this.backend.addNoise(img, im);
	}
}

module.exports = AddAugmenter;
