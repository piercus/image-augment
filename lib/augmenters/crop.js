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
* @param {Object} opts options
* @param {ArraylRTB} opts.percent percent of cropping to do
* @example
// Simple usage, crop by 10%, on every side
new ia.Crop(0.1);
* @example
//Simple usage with random variable crop by 10% to 30%
new ia.Crop(h.number(0.1, 0.3));
* @example
//Crop by 10% on left, 20% on top, to 30% on the right, 10% on the bottom
new ia.Crop([0.1, 0.2, 0.3, 0.1]);
*/

class CropAugmenter extends AbstractAugmenter {
	constructor(opts) {
		let o;
		if (typeof (opts) === 'number' || Array.isArray(opts) || hasard.isHasard(opts)) {
			o = {percent: opts};
		} else {
			o = opts;
		}

		super(o);
		const {percent} = o;
		this.percent = this.toSize4(percent);
		this.percent.forEach(p => {
			if (p < 0) {
				throw (new Error('only positive value allowed in pad for percent'));
			}
		});
	}

	buildParams() {
		return new hasard.Object({
			percent: this.percent,
			borderValue: this.borderValue,
			borderType: this.borderType
		});
	}

	getRect({width, height, percent}) {
		return {
			x: Math.round(percent[0] * width),
			y: Math.round(percent[1] * height),
			w: width - Math.round(percent[2] * width) - Math.round(percent[0] * width),
			h: height - Math.round(percent[3] * height) - Math.round(percent[1] * height)
		};
	}

	augmentImage({img, width, height}, {percent}) {
		const rect = this.getRect({width, height, percent});
		if (rect.w <= 0 || rect.h <= 0) {
			throw (new Error(`Cannot crop by [${percent.map(p => (p * 100) + '%').join(', ')}]`));
		}

		return this.backend.crop(img, rect);
	}

	augmentPoints({points, width, height}, {percent}) {
		const rect = this.getRect({width, height, percent});
		const origin = this.backend.point(rect.x, rect.y);
		return points.map(p => p.sub(origin));
	}
}

module.exports = CropAugmenter;
