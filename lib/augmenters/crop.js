const hasard = require('hasard');
const AbstractAugmenter = require('./abstract');

/**
* Left - Top - Right - Bottom array
* If Size 2, then we consider Left = Right and Top = Bottom
* If Number, then Left = Top = Right = Bottom = Number
* @typedef {Number  | Array.<Number> | Hasard.<Number> | Hasard.<Array.<Number>>} ArraylRTB
*/

/**
* Crop the image
* @param {Object} opts options, if number of array, it is considered as size
* @param {ArraylRTB} opts.percent percent of cropping to do
* @param {ArraylRTB} opts.size value of cropping to do
* @example
// Simple usage, crop by 10px, on every side
new ia.Crop(10);
* @example
//Simple usage with random variable crop by 10% to 30%
new ia.Crop({percent : h.number(0.1, 0.3)});
* @example
//Crop by 10% on left, 20% on top, to 30% on the right, 10% on the bottom
new ia.Crop({percent: [0.1, 0.2, 0.3, 0.1]});
*/

class CropAugmenter extends AbstractAugmenter {
	constructor(opts) {
		let o;
		if (typeof (opts) === 'number' || Array.isArray(opts) || hasard.isHasard(opts)) {
			o = {size: opts};
		} else {
			o = opts;
		}

		super(o);
		const {percent, size} = o;
		if(hasard.isHasard(size) || typeof(size) === 'number' || Array.isArray(size)){
			this.size = this.toSize4(size);
		} else {
			this.percent = this.toSize4(percent);
		}
	}

	buildParams({width, height}) {
		return new hasard.Object({
			size: this.size || hasard.fn(p => [
				Math.round(width*p[0]), 
				Math.round(height*p[1]),
				Math.round(width*p[2]), 
				Math.round(height*p[3])				
			])(this.percent)
		});
	}
	
	checkParams({size}){
		size.forEach(p => {
			if (p < 0) {
				throw (new Error('only positive value allowed in pad for percent'));
			}
		});
	}
			

	getRect({width, height, params}) {
		const size = params.size.concat();
		return {
			x: size[0],
			y: size[1],
			w: width - size[2] - size[0],
			h: height - size[3] - size[1]
		};
	}

	augmentImage({image, width, height}, params) {
		const rect = this.getRect({width, height, params});
		if (rect.w <= 0 || rect.h <= 0) {
			throw (new Error(`Cannot crop by [${percent.map(p => (p * 100) + '%').join(', ')}]`));
		}
		return this.backend.crop(image, rect);
	}

	augmentPointsOnImage({points, width, height}, params) {
		const rect = this.getRect({width, height, params});
		const origin = this.backend.point(rect.x, rect.y);
		return points.map(p => p.sub(origin));
	}
}

module.exports = CropAugmenter;
