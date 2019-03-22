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
		this.value = this.toColor(value);
	}

	buildParams({width, height, channels}) {
		return h.fn(v => {
			const fill = channels === 3 ? [v[0], v[1], v[2]] : [v[0], v[1], v[2], typeof (v[3]) === 'number' ? v[3] : 255];
			const m = this.backend.signedMatrixFromSize(width, height, channels, fill);
			return m;
		})(this.value);
	}

	augmentImage({image}, im) {
		return this.backend.addNoiseOne(image, im);
	}
}

module.exports = AddAugmenter;
