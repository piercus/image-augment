const hasard = require('hasard');
const backends = require('../backend');
/**
* All augmenters are extending this abstract class
* @example
// Create one simple augmenter and an img
const cv = require('opencv4nodejs')
const img = cv.imread('lenna.png')
const augmenter = new ia.PerspectiveTransform(0.2)
* @example
// Run the augmenter once
const {image} = augmenter.runOnce(image)
cv.imread('output.png', image);
* @example
// Run the augmenter multiple times
augmenter.run({image, times: 10});
// => [{ image : Mat }, { image : Mat }, ...]
* @example
// follow a point in the augmentation workflow
augmenter.run({image, points: [[25, 90], [12, 32]]})
// => [{ image : Mat, points: [<first point new position>, <second point new position>] }]
**/
class AbstractAugmenter {
	constructor(opts) {
		this._augmenter = true;
		this.backend = opts.backend ? backends.get(opts.backend) : backends.getDefault();
	}
	/**
	* @typedef {AugmenterFormat | Image} OneRunOption
	**/

	/**
	* @typedef {Object} AugmenterFormat
	* @property {Image} img the image to augment
	* @property {Array.<Point>} points the points to augment
	* @property {Array.<Box>} boxes bournding boxes to augment
	*/

	/**
	* Run the augmenter
	* @param {OneRunOption} o options
	* @returns {AugmenterFormat} the output is pipeable into other augmenters
	*/
	runOnce(o) {
		let params1;

		if (o && o.img) {
			params1 = o;
		} else if (o) {
			params1 = {img: o};
		} else {
			params1 = {img: null};
		}

		const metadata = this.backend.getMetadata(params1.img);

		const points = (params1.points || []).map(p => {
			if (Array.isArray(p)) {
				return this.backend.point(p[0], p[1]);
			}

			return p;
		});

		const o2 = Object.assign({}, {boxes: []}, metadata, params1, {points});
		const params = this.buildParams(o2);
		const resolved = params.runOnce();
		return this.augment(o2, resolved);
	}

	/**
	* @typedef {OneRunOption} MultipleRunOptions
	* @property {Number} times how many times to run this augmenter
	*/
	/**
	* Run the augmenter
	* @param {OneRunOption | Number | Array.<OneRunOption> | MultipleRunOptions} o options
	* @returns {Array.<AugmenterFormat>} the output is pipeable into other augmenters
	*/
	run(o) {
		if (Array.isArray(o)) {
			return o.map(a => this.runOnce(a));
		}

		if (o && typeof (o.times) === 'number') {
			return this.runOnce();
		}
	}

	toSize2(opt) {
		const fn = function (size) {
			if (typeof (size) === 'number') {
				return [size, size];
			}

			if (Array.isArray(size)) {
				if (opt.length === 2) {
					return size;
				}

				throw new Error(`${size} whould be a length-2 array or a number`);
			}
		};

		if (hasard.isHasard(opt)) {
			return hasard.fn(fn)(opt);
		}

		return fn(opt);
	}

	toSize4(opt) {
		const fn = function (size) {
			if (typeof (size) === 'number') {
				return [size, size, size, size];
			}

			if (Array.isArray(size)) {
				if (opt.length === 2) {
					return [size[0], size[1], size[0], size[1]];
				}

				if (opt.length === 4) {
					return size;
				}

				throw new Error(`${size} whould be a number, a length-2 or a lenght-4 array`);
			}
		};

		if (hasard.isHasard(opt)) {
			return hasard.fn(fn)(opt);
		}

		return fn(opt);
	}

	augment(attr, opts) {
		return {
			img: this.augmentImage(attr, opts),
			boxes: this.augmentBoxes(attr, opts),
			points: this.augmentPoints(attr, opts)
		};
	}

	augmentImage({img}) {
		return img;
	}

	augmentPoints({points}) {
		return points;
	}

	static isGenerator(o) {
		return (typeof (o) === 'object' && o._generator);
	}

	static isAugmenter(o) {
		return (typeof (o) === 'object' && o._augmenter);
	}

	augmentBoxes(attr, opts) {
		const {boxes} = attr;
		const points = boxes.map(b => {
			return [
				this.backend.point(b[0], b[1]),
				this.backend.point(b[0] + b[2], b[1]),
				this.backend.point(b[0], b[1] + b[3]),
				this.backend.point(b[0] + b[2], b[1] + b[3])
			];
		}).reduce((a, b) => a.concat(b), []);

		const pointsAfter = this.augmentPoints(Object.assign({}, attr, {points}), opts);

		const boxesAfter = [];
		for (let i = 0; i < boxes.length; i++) {
			const left = Math.min(...pointsAfter.map(p => p.x));
			const right = Math.max(...pointsAfter.map(p => p.x));
			const top = Math.min(...pointsAfter.map(p => p.y));
			const bottom = Math.max(...pointsAfter.map(p => p.y));

			boxesAfter.push([
				left,
				top,
				right - left,
				bottom - top
			]);
		}

		return boxesAfter;
	}
}

module.exports = AbstractAugmenter;
