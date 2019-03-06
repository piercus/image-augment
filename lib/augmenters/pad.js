const hasard = require('hasard');
const AbstractAugmenter = require('./abstract');

/**
* Add padding to the image
* @param {Object} opts options
* @param {ArraylRTB} opts.percent size of padding in percent
* @param {ColorArgument} [opts.borderValue=[0,0,0]] if borderType is "constant" this is used as border pixel values
* @param {BorderTypeArgument} [opts.borderType="constant"] "constant", "replicate", "transparent"
*/

class PadAugmenter extends AbstractAugmenter {
	constructor(opts) {
		super(opts);
		const {borderValue = [0, 0, 0], borderType = 'replicate', percent = 0} = opts;
		this.percent = this.toSize4(percent);
		this.percent.forEach(p => {
			if (p < 0) {
				throw (new Error('only positive value allowed in pad for percent'));
			}
		});
		this.borderValue = borderValue;
		this.borderType = borderType;
	}

	buildParams() {
		return new hasard.Object({
			percent: this.percent,
			borderValue: this.borderValue,
			borderType: this.borderType
		});
	}

	augmentImage({img, width, height}, {percent, borderValue, borderType}) {
		const borders = this.getBorders({percent, width, height});

		return this.backend.pad(img, {borders, borderType, borderValue});
	}

	getBorders({percent, width, height}) {
		return [
			Math.round(percent[0] * width),
			Math.round(percent[1] * height),
			Math.round(percent[2] * width),
			Math.round(percent[3] * height)
		];
	}

	augmentPoints({points, width, height}, {percent}) {
		const borders = this.getBorders({percent, width, height});
		const origin = this.backend.point(borders[0], borders[2]);
		return points.map(p => p.add(origin));
	}
}

module.exports = PadAugmenter;
