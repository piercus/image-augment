const h= require('hasard');
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
		if (Array.isArray(opts) || h.isHasard(opts)) {
			this.steps = opts;
		} else {
			this.steps = opts.steps;
		}
	}
	buildParams() {
		return this.steps;
	}
	augment(o, steps, runOpts) {
		let current = o;
		steps.forEach(s => {
			if(!this.backend.isImage(current.image)){
				throw(new Error(`Can only augment on object with image`))
			}
			if(this.backend.isEmptyImage(current.image)){
				throw(new Error(`Empty image not allowed`))
			}			
			current = s.runOnce(current, runOpts);
		});
		return current;
	}
}
module.exports = Sequential;
