const h = require('hasard');
const AbstractAugmenter = require('./abstract');

class AdditiveAugmenter extends AbstractAugmenter {
	constructor(opts) {
		if (typeof (opts.Generator) !== 'object') {
			throw (new TypeError('Generator class is required in AdditiveAugmenter'));
		}

		super(opts);
		const opts2 = Object.assign({}, opts);
		const {Generator} = opts2;
		delete opts2.Generator;
		this.generator = new Generator(opts2);
	}

	buildParams({width, height, channels}) {
		return h.object({
			generated: this.generator.build({width, height, channels})
		});
	}

	augmentImage({img}, {generated}) {
		return this.backend.addNoise(img, generated);
	}
}

module.exports = AdditiveAugmenter;