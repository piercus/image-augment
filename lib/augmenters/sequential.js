const hasard = require('hasard');

class Sequential {
	constructor(opts) {
		if(Array.isArray(opts) || hasard.isHasard(opts)){
			this.steps = opts;
		} else {
			this.steps = opts.steps
		}
		
	}

	run({img, points = [], boxes = []}) {
		let steps;
		if (hasard.isHasard(this.steps)) {
			steps = this.steps.runOnce();
		} else {
			steps = this.steps;
		}

		if (!Array.isArray(steps)) {
			throw (new TypeError(`${steps} should be an array`));
		}

		const width = img.cols;
		const height = img.rows;

		let promise = Promise.resolve({img, points, width, height, boxes});

		steps.forEach(step => {
			const newPromise = promise.then(o => {
				return step.runOnce(o);
			});

			promise = newPromise;
		});

		return promise;
	}
}
module.exports = Sequential;
