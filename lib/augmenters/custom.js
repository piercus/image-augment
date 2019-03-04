const hasard = require('hasard');
const AbstractAugmenter = require('./abstract');

/**
* Add blur to the image
* @param {Array.<Number, Number>} opts.kernel kernel size
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

	/**
	* @param {PipedImageAttribute} imgAttributes
	* @param {AugmenterRandomProperties} augmenterRandomProperties
	* @returns {PipedImageAttribute}
	*/
	augmentImage({points, img, width, height, boxes}, opts) {
		const img2 = this._fnImage({points, img, width, height, boxes}, opts);
		console.log(img2);
		return img2;
	}
}

module.exports = CustomAugmenter;
