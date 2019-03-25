const hasard = require('hasard');
const backends = require('../backend');
const Abstract = require('../abstract');
const debug = require('debug')('image-augment:augmenters');

/**
* All augmenters are following the same pattern
* * First create the augmenter
* * Then run it using `augmenter.run({images: <images>, points: <points per image>})`
*
* @example
// Create one simple augmenter and an image with opencv4nodejs
const ia = require('image-augment')
const cv = require('opencv4nodejs')
ia.setBackend(cv);
const augmenter = new ia.Blur(0.2)
const img = cv.imread('lenna.png')
augmenter.run({images: [img], points: [[[25, 90], [12, 32]]]})
* @example
// Create one simple augmenter and an image with tensorflowjs
const ia = require('image-augment');
const tf = require('@tensorflow/tfjs');
ia.setBackend(tf);
const augmenter = new ia.Blur(0.2)
const img = cv.imread('lenna.png')
augmenter.run({images: [img], points: [[[25, 90], [12, 32]]]})

* @example
// Run the augmenter once
const {images} = augmenter.runAugmenter([img])
cv.imwrite('output.png', images[0]);
* @example
// Run the augmenter 4 times
augmenter.run({images: [img, img, img, img]});
// => { images : [Mat, Mat, ...]}
* @example
// follow a point in the augmentation workflow
augmenter.run({images: [img], points: [[[25, 90], [12, 32]]]})
// => { images : [Mat], points: [[<first point new position>, <second point new position>]] }
**/
class AbstractAugmenter extends Abstract {
	constructor(opts, ia) {
		super(opts, ia);
		this._augmenter = true;
	}
	/**
	* @typedef {AugmenterFormat | Images} OneRunOption
	**/

	/**
	* @typedef {Object} AugmenterFormat
	* @property {Images} images the image to augment
	* @property {Array.<Point>} points the points to augment
	* @property {Array.<Box>} boxes bournding boxes to augment
	*/

	/**
	* Run the augmenter
	* @param {OneRunOption} o options
	* @returns {AugmenterFormat} the output is pipeable into other augmenters
	*/
	runAugmenter(runOpts) {
		let params1;
		if (runOpts && runOpts.images && this.backend.isImages(runOpts.images)) {
			params1 = runOpts;
		} else if (this.backend.isImages(runOpts)) {
			params1 = {images: runOpts};
		} else {
			throw (new Error('runOnce must have images in it'));
		}

		const metadata = this.backend.getMetadata(params1.images);

		const o2 = Object.assign({}, metadata, params1);
		const {nImages} = metadata;

		let resolved = [];

		if (typeof (this.buildAllImagesHasard) === 'function') {
			resolved = this.buildAllImagesHasard(o2).runOnce(runOpts);
		} else {
			debug(`buildHasard ${this._name} (${this.backend._tf && this.backend._tf.memory().numTensors})`);
			const params = this.buildHasard(o2);
			debug(`runOnce ${this._name} (${this.backend._tf && this.backend._tf.memory().numTensors})`);
			
			// Every image hasard is generated independantly
			for (let i = 0; i < nImages; i++) {
				const resolvedParams = hasard.isHasard(params) ? params.runOnce(runOpts) : params;
				resolved.push(resolvedParams);
			}
		}

		
		debug(`augment ${this._name} (${this.backend._tf && this.backend._tf.memory().numTensors})`);

		return Promise.resolve(this.augment(o2, resolved, runOpts));
	}

	fromFilenames({filenames}) {
		return this.backend.readImages(filenames).then(images => {
			return this.runAugmenter({images}).then(res => {
				this.backend.dispose(images)
				return res;
			});
		});
	}

	buildHasard(o) {
		return this.buildParams(o);
	}

	checkParams() {
		// Do nothing
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
	// run(o) {
	// 	if (Array.isArray(o)) {
	// 		return o.map(a => this.runAugmenter(a));
	// 	}
	//
	// 	if (o && typeof (o.times) === 'number') {
	// 		return this.runAugmenter();
	// 	}
	// }
	augment(attrs, opts, runOpts) {
		debug(`start augment ${this._name} (${this.backend._tf && this.backend._tf.memory().numTensors})`);

		opts.forEach(o => {
			this.checkParams(o);
		});
		const res = this.backend.splitImages(attrs.images, false).map((image, index) => {
			const points = ((attrs.points && attrs.points[index]) || []).map(p => {
				if (Array.isArray(p)) {
					return this.backend.point(p[0], p[1]);
				}

				return p;
			});

			const newAttrs = Object.assign(
				{},
				attrs,
				{image}, {images: null},
				{points},
				{boxes: (attrs.boxes && attrs.boxes[index]) || []}
			);
			const res = this.augmentOne(
				newAttrs,
				opts[index],
				runOpts
			);
			this.backend.dispose(image);
			return res;
		});
		const res2 = {
			images: this.backend.mergeImages(res.map(r => r.image), true),
			boxes: res.map(r => r.boxes),
			points: res.map(r => r.points)
		};
		debug(`end augment ${this._name} (${this.backend._tf && this.backend._tf.memory().numTensors})`);
		return res2;
	}

	augmentOne(attr, opts, runOpts) {
		debug(`start augmentOne ${this._name} (${this.backend._tf && this.backend._tf.memory().numTensors})`);
		
		const res = {
			image: this.augmentImage(attr, opts, runOpts),
			boxes: this.augmentBoxes(attr, opts, runOpts),
			points: this.augmentPoints(attr, opts, runOpts)
		};
		
		debug(`end augmentOne ${this._name} (${this.backend._tf && this.backend._tf.memory().numTensors})`);

		return res;
	}

	augmentImage({images}, opts, runOpts) {
		// By default do nothing
		return image;
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
