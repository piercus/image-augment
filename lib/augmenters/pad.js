const hasard = require('hasard');
const AbstractAugmenter = require('./abstract');

/**
* Add padding to the image
* @param {Object} opts options, if number or array, considered as size argument
* @param {ArraylRTB} opts.percent size of padding in percent
* @param {ArraylRTB} opts.size size of padding in piwels
* @param {ColorArgument} [opts.borderValue=[0,0,0]] if borderType is "constant" this is used as border pixel values
* @param {BorderTypeArgument} [opts.borderType="constant"] "constant", "replicate", "transparent"
* @example
// Simple usage, pad by 10px, on every side
new ia.Pad(10);
* @example
// pad by 10%, with transparent background
new ia.Pad({
	percent: 0.1,
	borderType: "transparent"
});
* @example
// pad by 10% (left, right), 20% (top, bottom), with constant blue background
new ia.Pad({
	percent: [0.1, 0.2],
	borderType: "transparent",
	borderValue: [0, 0, 255]
});
*/

class PadAugmenter extends AbstractAugmenter {
	constructor(opts, ia) {
		let o;
		if (typeof (opts) === 'number' || Array.isArray(opts) || hasard.isHasard(opts)) {
			o = {percent: opts};
		} else {
			o = opts;
		}

		super(o, ia);
		const {size, borderValue = [0, 0, 0], borderType = 'replicate', percent = 0} = o;
		if (hasard.isHasard(size) || typeof (size) === 'number' || Array.isArray(size)) {
			this.size = this.toSize4(size);
		} else {
			this.percent = this.toSize4(percent);
		}

		this.borderValue = borderValue;
		this.borderType = borderType;
	}

	buildParams({width, height}) {
		return new hasard.Object({
			size: this.size || hasard.fn(p => [
				Math.round(width * p[0]),
				Math.round(height * p[1]),
				Math.round(width * p[2]),
				Math.round(height * p[3])
			 ])(this.percent),
			borderValue: this.borderValue,
			borderType: this.borderType
		});
	}

	checkParams({size}) {
		size.forEach(p => {
			if (p < 0) {
				throw (new Error('only positive value allowed in pad for percent'));
			}
		});
	}

	augmentImage({image, width, height}, {size, borderValue, borderType}) {
		return this.backend.pad(image, {borders: size, borderType, borderValue});
	}

	augmentPoints({points, width, height}, {size}) {
		const borders = size;
		const origin = this.backend.point(borders[0], borders[2]);
		return points.map(p => p.add(origin));
	}
}

module.exports = PadAugmenter;
