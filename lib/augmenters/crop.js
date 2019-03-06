const hasard = require('hasard');
const AbstractAugmenter = require('./abstract');

/**
* Left - Top - Right - Bottom array
* If Size 2, then we consider Left = Right and Top = Bottom
* If Number, then Left = Top = Right = Bottom = Number
* @typedef {Number  | Array.<Number> | Hasard.<Number> | Hasard.<Array.<Number>>} ArraylRTB
*/

/**
* Add blur to the image
* @param {Object} opts options
* @param {ArraylRTB} opts.percent percent of cropping to do
*/

class CropAugmenter extends AbstractAugmenter {
	constructor(opts) {
		super(opts);
		const {percent = 0} = opts;
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
