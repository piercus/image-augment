const h = require('hasard');
const AbstractAugmenter = require('./abstract');

/**
* Adds noise sampled from a gaussian distribution
* @param {Object} opts options
* @param {Array.<Number>} opts.value length-3 RGB pixel to add to the images
* @param {Number} [opts.alpha=1] if 0 = transparent overlay 1 = opaque
* @example
// Simple usage, overlay 10% opacity white layer over the image
ia.addWeighted({
	value: [255, 255, 255],
	alpha: 0.1
});
*/

class AddWeightedAugmenter extends AbstractAugmenter {
	constructor(opts, ia) {
		super(opts, ia);
		const {value, alpha = 1} = opts;
		this.value = this.toColor(value);
		this.alpha = alpha;
	}

	buildParams({width, height, channels}) {
		return h.object({
			mat: h.fn(v => {
				const fill = channels === 3 ? [v[2], v[1], v[0]] : [v[2], v[1], v[0], typeof (v[3]) === 'number' ? v[3] : 255];
				const m = this.backend.signedMatrixFromSize(width, height, channels, fill);
				return m;
			})(this.value),
			alpha: this.alpha
		});
	}

	augmentImage({image}, {alpha, mat}) {
		const res = this.backend.addWeighted(image, mat, alpha);
		this.backend.dispose(mat);
		return res;
	}
}

module.exports = AddWeightedAugmenter;
