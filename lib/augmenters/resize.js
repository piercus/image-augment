const hasard = require('hasard');
const AbstractAugmenter = require('./abstract');

/**
* Resize the image
* @param {Object} opts options, if array, or number, considered as the size parameter
* @param {ArrayXY} [opts.size] mandatory if percent not defined
* @param {ArrayXY} [opts.percent] mandatory if size not defined
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
	constructor(opts, ia) {
		let o;
		if (typeof (opts) === 'number' || Array.isArray(opts) || hasard.isHasard(opts)) {
			o = {size: opts};
		} else {
			o = opts;
		}

		super(o, ia);
		const {size, percent} = o;
		if (hasard.isHasard(size) || typeof (size) === 'number' || Array.isArray(size)) {
			this.size = this.toSize2(size);
			this.percent = null;
		} else if (percent) {
			this.size = null;
			this.percent = this.toSize2(percent);
		} else {
			throw (new Error('size or percent is mandatory in Resize augmenter'));
		}
	}

	buildParams({width, height}) {
		return new hasard.Object({
			size: this.size || hasard.fn(p => [Math.round(width * p[0]), Math.round(height * p[1])])(this.percent)
		});
	}

	checkParams({size}) {
		size.forEach(p => {
			if (p < 0) {
				throw (new Error('only positive value allowed in pad for percent'));
			}
		});
	}

	augmentImage({image}, {size}) {
		return this.backend.resize(image, size[0], size[1]);
	}

	augmentPoints({points, width, height}, {size}) {
		const sizeBefore = [width, height];
		return points.map(p => this.backend.point(p.x / sizeBefore[0] * size[0], p.y / sizeBefore[1] * size[1]));
	}
}

module.exports = ResizeAugmenter;
