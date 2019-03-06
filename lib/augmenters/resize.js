const hasard = require('hasard');
const AbstractAugmenter = require('./abstract');

/**
* Resize the image
* @param {Object} opts options
* @param {ArrayXY} opts.size size of the result image
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

	augmentImage({img}, {size}) {
		return img.resize(size[1], size[0]);
	}

	augmentPoints({points, width, height}, {size}) {
		const sizeBefore = [width, height];
		return points.map(p => this.backend.point(p.x / sizeBefore[0] * size[0], p.y / sizeBefore[1] * size[1]));
	}
}

module.exports = ResizeAugmenter;
