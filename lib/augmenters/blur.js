const hasard = require('hasard');
const AbstractAugmenter = require('./abstract');

/**
* Add blur to the image
* @param {Array.<Number, Number>} opts.kernel kernel size
*/

class BlurAugmenter extends AbstractAugmenter {
	constructor(opts) {
		super(opts);
		const {kernel} = opts;
		this.kernel = this.toSize2(kernel);
	}

	buildParams() {
		return new hasard.Object({
			kernel: this.kernel
		});
	}

	/**
	* @param {PipedImageAttribute} imgAttributes
	* @param {AugmenterRandomProperties} augmenterRandomProperties
	* @returns {PipedImageAttribute}
	*/
	augmentImage({img}, {kernel}) {
		return this.backend.blur(img, kernel);
	}
}

module.exports = BlurAugmenter;
