const hasard = require('hasard');
const backends = require('../backend');

class AbstractAugmenter {
	constructor(opts) {
		this.backend = opts.backend ? backends.get(opts.backend) : backends.getDefault();
	}

	runOnce(o) {
		const metadata = this.backend.getMetadata(o.img);
		const points = (o.points || []).map(p => {
			if(Array.isArray(p)){
				return this.backend.point(p[0], p[1]);
			} else {
				return p;
			}
		})
		const o2 = Object.assign({}, {boxes: []}, metadata, o, {points});
		const params = this.buildParams(o2);
		const resolved = params.runOnce();
		return this.augment(o2, resolved);
	}

	toSize2(opt) {
		const fn = function (size) {
			if (typeof (size) === 'number') {
				return [size, size];
			}

			if (Array.isArray(size)) {
				if (opt.length === 2) {
					return size;
				}

				throw new Error(`${size} whould be a length-2 array or a number`);
			}
		};

		if (hasard.isHasard(opt)) {
			return hasard.fn(fn)(opt);
		}

		return fn(opt);
	}

	toSize4(opt) {
		const fn = function (size) {
			if (typeof (size) === 'number') {
				return [size, size, size, size];
			}

			if (Array.isArray(size)) {
				if (opt.length === 2) {
					return [size[0], size[1], size[0], size[1]];
				}

				if (opt.length === 4) {
					return size;
				}

				throw new Error(`${size} whould be a number, a length-2 or a lenght-4 array`);
			}
		};

		if (hasard.isHasard(opt)) {
			return hasard.fn(fn)(opt);
		}

		return fn(opt);
	}

	/**
	* @param {PipedImageAttribute} imgAttributes
	* @param {AugmenterRandomProperties} augmenterRandomProperties
	* @returns {PipedImageAttribute}
	*/
	augment(attr, opts) {
		return {
			img: this.augmentImage(attr, opts),
			boxes: this.augmentBoxes(attr, opts),
			points: this.augmentPoints(attr, opts)
		};
	}

	augmentImage({img}) {
		return img;
	}

	augmentPoints({points}) {
		return points;
	}

	augmentBoxes(attr, opts) {
		const {boxes} = attr;
		const points = boxes.map(b => {
			return [
				this.backend.point(b[0], b[1]),
				this.backend.point(b[0] + b[2], b[1]),
				this.backend.point(b[0], b[1] + b[3]),
				this.backend.point(b[0] + b[2], b[1] + b[3])
			];
		}).reduce((a, b) => a.concat(b), []);

		const pointsAfter = this.augmentPoints(Object.assign({}, attr, {points}), opts);

		const boxesAfter = [];
		for (let i = 0; i < boxes.length; i++) {
			const left = Math.min(...pointsAfter.map(p => p.x));
			const right = Math.max(...pointsAfter.map(p => p.x));
			const top = Math.min(...pointsAfter.map(p => p.y));
			const bottom = Math.max(...pointsAfter.map(p => p.y));

			boxesAfter.push([
				left,
				top,
				right - left,
				bottom - top
			]);
		}

		return boxesAfter;
	}
}

module.exports = AbstractAugmenter;
