const hasard = require('hasard');

class Pipeline {
	constructor(array) {
		this.conf = array;
	}

	run({img, points = [], boxes = []}) {
		let conf;
		if (hasard.isHasard(this.conf)) {
			conf = this.conf.runOnce();
		} else {
			conf = this.conf;
		}

		if (!Array.isArray(conf)) {
			throw (new TypeError(`${conf} should be an array`));
		}

		const width = img.cols;
		const height = img.rows;

		let promise = Promise.resolve({img, points, width, height, boxes});

		conf.forEach(step => {
			const newPromise = promise.then(o => {
				return step.run(o);
			});

			promise = newPromise;
		});

		return promise;
	}
}
module.exports = Pipeline;
