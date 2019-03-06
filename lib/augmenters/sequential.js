const hasard = require('hasard');
const AbstractAugmenter = require('./abstract');

class Sequential extends AbstractAugmenter {
	constructor(opts) {
		super(opts);
		if (Array.isArray(opts) || hasard.isHasard(opts)) {
			this.steps = opts;
		} else {
			this.steps = opts.steps;
		}
	}

	runOnce({img, points = [], boxes = []}) {
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

		let res = {img, points, width, height, boxes};

		steps.forEach(step => {
			res = step.runOnce(res);
		});

		return res;
	}
}
module.exports = Sequential;
