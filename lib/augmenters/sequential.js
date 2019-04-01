const h = require('hasard');
const debug = require('debug')('image-augmenter:augmenters:sequential');
const AbstractAugmenter = require('./abstract');

/**
* Build a sequence of actions
* @param {Object} opts options
* @param {Array.<ImageAugment> | Hasard.<Array.<ImageAugment>>} opts.steps steps to be run in sequence
* @example
* // Simple usage
* const img = cv.imread('lenna.jpg');
* const augmenter = ia.sequential([
* 	ia.blur(2),
* 	ia.perspectiveTransform(0.2)
* ]);
* const {image} = augmenter.read({images: [img]});
*/

class Sequential extends AbstractAugmenter {
	constructor(opts, ia) {
		super(opts, ia);
		if (Array.isArray(opts) || h.isHasard(opts)) {
			this.steps = opts;
		} else {
			this.steps = opts.steps;
		}

		this.hasHasardSteps = h.isHasard(this.steps);
	}

	buildParams() {
		return this.steps;
	}

	augment(o, steps, runOpts) {
		if (this.hasHasardSteps) {
			return this._augmentNonParallel(o, steps, runOpts);
		}

		return this._augmentParallel(o, steps, runOpts);
	}

	_augmentParallel(o, steps, runOpts) {
		// When using augmentParallel steps
		// are not hasard object
		// then they are the same for each image
		// so we can run one parrallel process for every image

		return this._runSteps({steps: steps[0], runOpts, images: o.images});
	}

	_augmentNonParallel(o, steps, runOpts) {
		// When using _augmentNonParallel
		// steps are hasard object
		// then they are not the same for each image
		// and we cannot parallelize the images processing

		const promises = this.backend.splitImages(o.images).map((image, imageIndex) => {
			return this._runSteps({steps: steps[imageIndex], runOpts, images: [image]});
		});

		return Promise.all(promises).then(results => {
			return {
				images: results.map(({images}) => images).reduce((a, b) => a.concat(b)),
				points: results.map(({points}) => points).reduce((a, b) => a.concat(b)),
				boxes: results.map(({boxes}) => boxes).reduce((a, b) => a.concat(b))
			};
		});
	}

	_runSteps({steps, runOpts, images}) {
		let promise = Promise.resolve({images, disposable: false});
		steps.forEach(s => {
			// Console.log({s})
			promise = promise.then(current => {
				return this._runOneStep({step: s, runOpts, current}).then(res => {
					return res;
				});
			});
		});
		return promise;
	}

	_runResolvedStep({step, runOpts, current}) {
		step.setBackend(this.backend.backendLib);
		if (!this.backend.isImages(current.images)) {
			// Console.log(this.backend.isImages.toString(), current)
			throw (new Error('Can only augment on object with image property in it'));
		}

		if (this.backend.isEmptyImages(current.images)) {
			throw (new Error('Empty image not allowed'));
		}

		const runOpts2 = Object.assign({}, runOpts, current);
		debug(`Step ${step.constructor.name}/${step.backend.key} started`);
		return step.run(runOpts2).then(res => {
			if (current.disposable) {
				this.backend.dispose(current.images);
			}

			debug(`Step ${step.constructor.name}/${step.backend.key} done`);
			return Object.assign({}, res, {disposable: true});
		});
	}

	_runOneStep({step, runOpts, current}) {
		if (h.isHasard(step)) {
			const promises = this.backend.splitImages(current.images).map(image => {
				const stepResolved = step.runOnce(runOpts);
				return this._runResolvedStep({step: stepResolved, runOpts, current: Object.assign({}, current, {images: [image]})});
			});
			return Promise.all(promises).then(results => {
				return {
					images: this.backend.mergeImages(results.map(({images}) => images)),
					points: results.map(({points}) => points).reduce((a, b) => a.concat(b)),
					boxes: results.map(({boxes}) => boxes).reduce((a, b) => a.concat(b))
				};
			});
		}

		return this._runResolvedStep({step, runOpts, current});
	}
}
module.exports = Sequential;
