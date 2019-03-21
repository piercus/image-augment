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
* const {image} = augmenter.runAugmenter({image: img});
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
		const promises = this.backend.splitImages(o.images).map((image, imageIndex) => {
			let promise = Promise.resolve({images: [image]})
			steps[imageIndex].forEach(s => {
				s.setBackend(this.backend.key)
				//console.log({s})
				promise = promise.then(current => {

					if(!this.backend.isImages(current.images)){
						//console.log(this.backend.isImages.toString(), current)
						throw(new Error(`Can only augment on object with image property in it`))
					}
					if(this.backend.isEmptyImages(current.images)){
						throw(new Error(`Empty image not allowed`))
					}
					const runOpts2 = Object.assign({},runOpts, current);
					return s.runAugmenter(runOpts2);
				})
			});
			return promise;
		})
		
		return Promise.all(promises).then(results => {
			return {
				images: results.map(({images}) => images).reduce((a,b) => a.concat(b)), 
				points: results.map(({points}) => points).reduce((a,b) => a.concat(b)),
				boxes: results.map(({boxes}) => boxes).reduce((a,b) => a.concat(b))
			}
		});
	}
}
module.exports = Sequential;
