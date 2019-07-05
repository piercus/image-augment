const h = require('hasard');
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

	buildAllImagesHasard({metadatas}) {
		this.generator.setBackend(this.backend.backendLib);
		const joinId = function (m) {
			return m.width + m.height + m.channels;
		};

		const uniq = function (arr) {
			return arr.filter((a, index) => arr.indexOf(a) === index);
		};

		const mGroups = uniq(metadatas.map(joinId));

		if (mGroups.length > 1) {
			const generatedImagesHasard = h.array(metadatas.map(m => {
				return this.generator.build({nImages: 1, width: m.width, height: m.height, channels: m.channels});
			}));
			return h.object({images: h.fn(ims => this.backend.mergeImages(ims.map(({images}) => images), true))(generatedImagesHasard)});
		}

		return this.generator.build(Object.assign({}, metadatas[0], {nImages: metadatas.length}));
	}

	augment(attrs, params) {
		const images = this.backend.addNoise(attrs.images, params.images);
		this.backend.dispose(params.images);
		return {images, boxes: attrs.boxes};
	}
}

module.exports = AdditiveAugmenter;
