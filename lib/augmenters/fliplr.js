const h = require('hasard');
const AbstractAugmenter = require('./abstract');

/**
* Vertical Flip (Left to Right)
* @param {Object | Hasard | Number} [probability=1]
* @example
// Simple usage
ia.fliplr();
*/

class FliplrAugmenter extends AbstractAugmenter {
	constructor(opts, ia) {
		let o;

		if (typeof (opts) === 'undefined') {
			o = {probability: 1};
		} else if (typeof (opts) === 'number' || h.isHasard(opts)) {
			o = {probability: opts};
		} else {
			o = opts;
		}

		super(o, ia);
		const {probability = 1} = o;
		this.probability = probability;
	}

	buildParams() {
		if (this.probability === 1) {
			return h.value([true]);
		}

		if (this.probability === 0) {
			return h.value([false]);
		}

		return h.boolean(this.probability);
	}

	augmentImage({image}, toFlip) {
		if (toFlip) {
			return this.backend.fliplr(image);
		}

		return this.backend.identity(image);
	}
}

module.exports = FliplrAugmenter;
