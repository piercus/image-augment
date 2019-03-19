const hasard = require('hasard');
const backends = require('../backend');
const Abstract = require('../abstract');
const debug = require('debug')('image-augment:augmenters');

/**
* All augmenters are extending this abstract class
* @example
// Create one simple augmenter and an image
const cv = require('opencv4nodejs')
const img = cv.imread('lenna.png')
const augmenter = new ia.PerspectiveTransform(0.2)
* @example
// Run the augmenter once
const {image} = augmenter.runAugmenter(img)
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
class AbstractAugmenter extends Abstract{
	constructor(opts) {
		super(opts)
		this._augmenter = true;
	}
	/**
	* @typedef {AugmenterFormat | Image} OneRunOption
	**/

	/**
	* @typedef {Object} AugmenterFormat
	* @property {Image} image the image to augment
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
		if (runOpts && this.backend.isImage(runOpts.image)) {
			params1 = runOpts;
		} else if (this.backend.isImage(runOpts)) {
			params1 = {image: runOpts};
		} else {
			console.log(runOpts.image, this.backend.key)
			throw(new Error('runOnce must have an image in it'));
		}
		const metadata = this.backend.getMetadata(params1.image);

		const points = (params1.points || []).map(p => {
			if (Array.isArray(p)) {
				return this.backend.point(p[0], p[1]);
			}
			return p;
		});
		debug(`buildHasard ${this._name}`);

		const o2 = Object.assign({}, {boxes: []}, metadata, params1, {points});
		const params = this.buildHasard(o2);
		debug(`runOnce ${this._name}`);
		const resolved = hasard.isHasard(params) ? params.runOnce(runOpts) : params;
		//console.log({resolved, params})
		debug(`augment ${this._name}`);
		return Promise.resolve(this.augment(o2, resolved, runOpts));
	}
	
	buildHasard(o){
		return this.buildParams(o);
	}
	checkParams(){
		// do nothing
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
	augment(attr, opts) {
		this.checkParams(opts);
		return {
			image: this.augmentImage(attr, opts),
			boxes: this.augmentBoxes(attr, opts),
			points: this.augmentPoints(attr, opts)
		};
	}

	augmentImage({image}) {
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
