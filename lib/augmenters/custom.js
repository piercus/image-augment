const hasard = require('hasard');
const AbstractAugmenter = require('./abstract');

/**
* Extend this class to add custom augmenters
*/

class CustomAugmenter extends AbstractAugmenter {
	constructor({fnImage, opts}) {
		super(opts);
		this._opts = opts;
		this._fnImage = fnImage;
	}

	buildParams() {
		return new hasard.Object(this._opts);
	}

	augmentImage({points, img, width, height, boxes}, opts) {
		const img2 = this._fnImage({points, img, width, height, boxes}, opts);
		return img2;
	}
}

module.exports = CustomAugmenter;
