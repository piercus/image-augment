const h = require('hasard');
const AbstractAugmenter = require('./abstract');

/**
* Adds noise sampled from a gaussian distribution
* @param {Object | Array.<Number> | Hasard} value
* @example
// Simple usage, add 12 red to the image's pixels
ia.add([12, 0, 0]);
*/

class AddAugmenter extends AbstractAugmenter {
	constructor(opts, ia) {
		let o;
		if (typeof (opts) === 'number' || Array.isArray(opts) || h.isHasard(opts)) {
			o = {value: opts};
		} else {
			o = opts;
		}

		super(o, ia);
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
		const res = this.backend.addNoiseOne(image, im);
		this.backend.dispose(im);
		return res;
	}
}

module.exports = AddAugmenter;
