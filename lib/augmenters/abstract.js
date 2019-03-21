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
class AbstractAugmenter extends Abstract{
	constructor(opts) {
		super(opts)
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
			throw(new Error('runOnce must have images in it'));
		}
		const metadata = this.backend.getMetadata(params1.images);
		
		debug(`buildHasard ${this._name}`);

		const o2 = Object.assign({}, metadata, params1);
		const nImages = metadata.nImages;

		const params = this.buildHasard(o2);
		
		debug(`runOnce ${this._name}`);
		const resolved = [];
		
		// every image hasard is generated independantly
		for(var i = 0; i< nImages; i++){
			const resolvedParams = hasard.isHasard(params) ? params.runOnce(runOpts) : params
			resolved.push(resolvedParams);
		}
		//console.log({resolved, params})
		debug(`augment ${this._name}`);
		return Promise.resolve(this.augment(o2, resolved, runOpts));
	}
	
	fromFilenames({filenames}){
		return this.backend.readImages(filenames).then(images => {
			this.runAugmenter({images: images})
		});
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
	augment(attrs, opts, runOpts) {
		opts.forEach(o => {
			this.checkParams(o);
		})
		
		const res = this.backend.splitImages(attrs.images).map((image, index) => {
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
			)			
			return this.augmentOne(
				newAttrs, 
				opts[index],
				runOpts
			)
		});
		
		return {
			images: res.map(r => r.image),
			boxes: res.map(r => r.boxes),
			points: res.map(r => r.points)
		};
	}
	augmentOne(attr, opts, runOpts) {
		return {
			image: this.augmentImage(attr, opts, runOpts),
			boxes: this.augmentBoxes(attr, opts, runOpts),
			points: this.augmentPoints(attr, opts, runOpts)
		};
	}
	
	augmentImage({images}, opts, runOpts) {
		// by default do nothing
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
