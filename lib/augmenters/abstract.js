const debug = require('debug')('image-augment:augmenters');
const hasard = require('hasard');
const Abstract = require('../abstract');

/**
* @description
* All augmenters are following the same pattern
* * First create the augmenter
* * Then run it
*   * using `augmenter.readFiles([filename1, filename2, ...])`
*   * using `augmenter.run({images: <images>, points: <points per image>})`
*
* @example
// Create one simple augmenter
const augmenter = new ia.Blur(0.2)
* @example
// Augment using filenames
augmenter.read([filename1, filename2, filename3]).then(({images}) => {
	console.log(images.length)
	// => 3
})
* @example
// Run the augmenter 4 times
augmenter.run({images: [img, img, img, img]}).then(({images}) => {
	console.log(images.length)
	// => 4
})
* @example
// follow a point in the augmentation workflow
augmenter.run({images: images, points: [[[25, 90], [12, 32]]]}).then(({images, points}) => {
	console.log(points.length)
	// => 1
})
**/
class AbstractAugmenter extends Abstract {
	constructor(opts, ia) {
		super(opts, ia);
		this._augmenter = true;
	}

	/**
	* @typedef {Array.<OpenCVImage> | Tensor4d} Images
	*/
	/**
	* @typedef {Object} AugmenterFormat
	* @property {Images} images the image to augment
	* @property {Array.<Point>} points the points to augment
	* @property {Array.<Box>} boxes bournding boxes to augment
	*/
	/**
	* Augment images
	* @param {AugmenterFormat|String|Array.<String>|Images} runOpts {images, points}
	* @returns {Promise.<AugmenterFormat>} the output is pipeable into other augmenters
	*/
	read(runOpts) {
		if (typeof (runOpts) === 'string') {
			return this.fromFilenames([runOpts]);
		}

		if (Array.isArray(runOpts)) {
			if (runOpts.length === 0) {
				return {images: this.backend.emptyImage(), points: [], boxes: []};
			}

			if (typeof (runOpts[0]) === 'string') {
				return this.fromFilenames({filenames: runOpts});
			}

			return this.run({images: runOpts});
		}

		return this.run(runOpts);
	}

	/**
	* @typedef {Array.<OpenCVImage> | Tensor4d} Images
	*/
	/**
	* @typedef {Object} AugmenterFormat
	* @property {Images} images the image to augment
	* @property {Array.<Point>} points the points to augment
	* @property {Array.<Box>} boxes bournding boxes to augment
	*/
	/**
	* Augment images
	* @param {AugmenterFormat|String|Array.<String>|Images} runOpts {images, points}
	* @returns {Promise} the output is pipeable into other augmenters
	*/
	toGrid(runOpts, {gridShape, filename, imageShape}) {
		return this.read(runOpts).then(({images}) => {
			return this.backend.writeImagesGrid({
				filename,
				gridShape,
				images,
				imageShape
			});
		});
	}

	/**
	* Run the augmenter
	* @ignore
	* @param {AugmenterFormat} runOpts {images, points}
	* @returns {Promise.<AugmenterFormat>} the output is pipeable into other augmenters
	*/
	run(runOpts) {
		let params1;
		if (runOpts && runOpts.images && this.backend.isImages(runOpts.images)) {
			params1 = runOpts;
		} else if (this.backend.isImages(runOpts)) {
			params1 = {images: runOpts};
		} else {
			throw (new Error('runOnce must have images in it'));
		}

		const metadatas = this.backend.getMetadata(params1.images);

		const o2 = Object.assign({}, {metadatas}, params1);
		const nImages = metadatas.length;

		let resolved = [];

		if (typeof (this.buildAllImagesHasard) === 'function') {
			resolved = this.buildAllImagesHasard(o2, runOpts).runOnce(runOpts);
		} else {
			// Every image hasard is generated independantly
			for (let i = 0; i < nImages; i++) {
				debug(`buildHasard ${this._name} (${this.backend._tf && this.backend._tf.memory().numTensors})`);
				const params = this.buildHasard(Object.assign({}, metadatas[i], params1));
				debug(`runOnce ${this._name} (${this.backend._tf && this.backend._tf.memory().numTensors})`);
				const resolvedParams = hasard.isHasard(params) ? params.runOnce(runOpts) : params;
				resolved.push(resolvedParams);
			}
		}

		debug(`augment ${this._name} (${this.backend._tf && this.backend._tf.memory().numTensors})`);

		return Promise.resolve(this.augment(o2, resolved, runOpts));
	}

	/**
	* Run the augmenter
	* @ignore
	* @param {AugmenterFormat} runOpts {images, points}
	* @returns {AugmenterFormat} the output is pipeable into other augmenters
	*/
	fromFilenames({filenames}) {
		return this.backend.readImages(filenames).then(images => {
			return this.run({images}).then(res => {
				this.backend.dispose(images);
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
	* @ignore
	* @param {OneRunOption | Number | Array.<OneRunOption> | MultipleRunOptions} o options
	* @returns {Array.<AugmenterFormat>} the output is pipeable into other augmenters
	*/
	// run(o) {
	// 	if (Array.isArray(o)) {
	// 		return o.map(a => this.run(a));
	// 	}
	//
	// 	if (o && typeof (o.times) === 'number') {
	// 		return this.run();
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
				attrs.metadatas[index],
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
		debug(`beforeMerge augment ${this._name} (${this.backend._tf && this.backend._tf.memory().numTensors})`);
		const newImages = this.backend.mergeImages(res.map(r => r.image), true)
		debug(`afterMerge augment ${this._name} (${this.backend._tf && this.backend._tf.memory().numTensors})`);

		const res2 = {
			images: newImages,
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

	augmentImage() {
		// By default do nothing
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
