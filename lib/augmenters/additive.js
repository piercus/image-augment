const AbstractAugmenter = require('./abstract');

class AdditiveAugmenter extends AbstractAugmenter {
	constructor(opts, ia) {
		if (typeof (opts.Generator) !== 'function') {
			throw (new TypeError('Generator class is required in AdditiveAugmenter'));
		}

		super(opts, ia);
		const opts2 = Object.assign({}, opts);
		const {Generator} = opts2;
		delete opts2.Generator;
		this.generator = new Generator(opts2, ia);
	}

	buildAllImagesHasard({nImages, width, height, channels}) {
		this.generator.setBackend(this.backend.backendLib);
		const res = this.generator.build({nImages, width, height, channels});
		return res;
	}

	augment(attrs, params) {
		const images = this.backend.addNoise(attrs.images, params.images);
		this.backend.dispose(params.images);
		return {images};
	}
}

module.exports = AdditiveAugmenter;
