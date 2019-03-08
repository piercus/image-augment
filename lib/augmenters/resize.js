const hasard = require('hasard');
const AbstractAugmenter = require('./abstract');

/**
* Resize the image
* @param {Object} opts options
* @param {ArrayXY} opts.size size of the result image
* @example
// Simple usage, resize to 100x100 square
new ia.Resize(100);
* @example
// Simple usage, resize to 100x50 square
new ia.Resize([100, 50]);
* @example
// Explicit form
new ia.Resize({size: [100, 50]});
*/

class ResizeAugmenter extends AbstractAugmenter {
	constructor(opts) {
		let o;
		if (typeof (opts) === 'number' || Array.isArray(opts) || hasard.isHasard(opts)) {
			o = {size: opts};
		} else {
			o = opts;
		}

		super(o);
		const {size} = o;
		this.size = this.toSize2(size);
	}

	buildParams() {
		return new hasard.Object({
			size: this.size
		});
	}

	augmentImage({image}, {size}) {
		return image.resize(size[1], size[0]);
	}

	augmentPoints({points, width, height}, {size}) {
		const sizeBefore = [width, height];
		return points.map(p => this.backend.point(p.x / sizeBefore[0] * size[0], p.y / sizeBefore[1] * size[1]));
	}
}

module.exports = ResizeAugmenter;
