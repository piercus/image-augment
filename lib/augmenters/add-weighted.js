const h = require('hasard');
const GaussianNoiseGenerator = require('../generators/gaussian-noise');
const AbstractAugmenter = require('./abstract');

/**
* Adds noise sampled from a gaussian distribution
* @param {Object} opts options
* @param {Array.<Number>} opts.value length-3 RGB pixel to add to the image
* @param {Number} [opts.alpha=1] 
* @example
// Simple usage, add 12 red to the image's pixels
new ia.AddWeighted({
	value: [255, 255, 255],
	alpha: 0.1
});
*/

class AddAugmenter extends AbstractAugmenter {
	constructor(opts) {
		super(opts);
		const {value, alpha = 1} = opts;
		this.value = this.toSize3(value);
		this.alpha = alpha;
	}

	buildParams({width, height, channels}) {
		return h.object({
			mat: h.fn(v => this.backend.signedMatrixFromSize(width, height, 3, [v[2], v[1], v[0]]))(this.value),
			alpha: this.alpha
		})
	}

	augmentImage({image}, {alpha, mat}) {
		return this.backend.addWeighted(image, mat, alpha);
	}
}

module.exports = AddAugmenter;
