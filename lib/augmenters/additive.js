const h = require('hasard');
const AbstractAugmenter = require('./abstract');

class AdditiveAugmenter extends AbstractAugmenter {
	constructor(opts) {
		if (typeof (opts.Generator) !== 'function') {
			throw (new TypeError('Generator class is required in AdditiveAugmenter'));
		}

		super(opts);
		const opts2 = Object.assign({}, opts);
		const {Generator} = opts2;
		delete opts2.Generator;
		this.generator = new Generator(opts2);
	}

	buildAllImagesHasard({nImages, width, height, channels}) {
		return this.generator.build({nImages, width, height, channels});
	}
	augment(attrs, params, runOpts) {
		return {images: this.backend.addNoise(attrs.images, params.images)};
	}
}

module.exports = AdditiveAugmenter;
