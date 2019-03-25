const hasard = require('hasard');
const AbstractAugmenter = require('./abstract');
const debug = require('debug')('image-augment:augmenters:blur')
/**
* @typedef {Number  | Array.<Number> | Hasard.<Number> | Hasard.<Array.<Number>>} ArrayXY
*/

/**
* Add blur to the image
* @param {Object | Number | Hasard} opts kernel size or explict options
* @param {ArrayXY} opts.kernel kernel size, ([x,y]) or n (for square kernel)
* @example
new ia.Blur(3);
* @example
new ia.Blur(h.integer(0, 3));
* @example
new ia.Blur({ kernel: h.integer(0, 3) });
* @example
new ia.Blur({ kernel: 3 });
*/

class BlurAugmenter extends AbstractAugmenter {
	constructor(opts, ia) {
		let o;
		if (typeof (opts) === 'number' || Array.isArray(opts) || hasard.isHasard(opts)) {
			o = {kernel: opts};
		} else {
			o = opts;
		}

		super(o, ia);
		const {kernel} = o;
		this.kernel = this.toSize2(kernel);
	}

	buildParams() {
		return new hasard.Object({
			kernel: this.kernel
		});
	}

	augmentImage({image}, {kernel}) {
		if (kernel[0] === 0 || kernel[1] === 0) {
			return image;
		}
		return this.backend.blur(image, kernel);
	}
}

module.exports = BlurAugmenter;
