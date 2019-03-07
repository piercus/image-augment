const hasard = require('hasard');
const AbstractAugmenter = require('./abstract');

/**
* Build a sequence of actions
* @param {Object} opts options
* @param {Array.<ImageAugment> | Hasard.<Array.<ImageAugment>>} opts.steps steps to be run in sequence
* @example
* // Simple usage
* const img = cv.imread('lenna.jpg');
* const augmenter = new ia.Sequential([
* 	new ia.Blur(2),
* 	new ia.PerspectiveTransform(0.2)
* ]);
* const {image} = augmenter.runOnce({image: img});
*/

class Sequential extends AbstractAugmenter {
	constructor(opts) {
		super(opts);
		if (Array.isArray(opts) || hasard.isHasard(opts)) {
			this.steps = opts;
		} else {
			this.steps = opts.steps;
		}
	}
	buildParams() {
		return this.steps;
	}
	augment(o, steps) {
		let current = o;
		steps.forEach(s => {
			current = s.runOnce(current, runOpts);
		});
		return current;
	}
}
module.exports = Sequential;
