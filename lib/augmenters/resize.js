const hasard = require('hasard');
const AbstractAugmenter = require('./abstract');

/**
* Add blur to the image
* @param {Array.<Number, Number>} opts.kernel kernel size
*/

class ResizeAugmenter extends AbstractAugmenter {
	constructor(opts) {
		super(opts);
		const {size} = opts;
		this.size = this.toSize2(size);
	}

	buildParams() {
		return new hasard.Object({
			size: this.size
		});
	}

	/**
	* @param {PipedImageAttribute} imgAttributes
	* @param {AugmenterRandomProperties} augmenterRandomProperties
	* @returns {PipedImageAttribute}
	*/
	augmentImage({img}, {size}) {
		return img.resize(size[1], size[0]);
	}

	augmentPoints({points, width, height}, {size}) {
		const sizeBefore = [width, height];
		return points.map(p => this.backend.point(p.x / sizeBefore[0] * size[0], p.y / sizeBefore[1] * size[1]));
	}
}

module.exports = ResizeAugmenter;
