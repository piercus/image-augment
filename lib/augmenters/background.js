const h = require('hasard');
const AbstractAugmenter = require('./abstract');
const debug = require('debug')('image-augment:augmenters:background');
/**
* Overlay an image on top of another image
* @param {Object | Generator | Hasard} generator kernel size or explict options
* @param {Generator} generator.generator Generator
* @example
// Add a noisy background
const noiseGenerator = new ia.GaussianNoise();
const augmenter = new ia.Background(noiseGenerator);
*/

class BackgroundAugmenter extends AbstractAugmenter {
	constructor(opts) {
		let o;
		if (AbstractAugmenter.isGenerator(opts) || h.isHasard(opts)) {
			o = {generator: opts};
		} else {
			o = opts;
		}

		super(o);
		const {generator} = o;
		this.generator = generator;
	}

	buildAllImagesHasard(o) {
		const contextName = 'background';
		debug('start generator');
		this.generator.setBackend(this.backend.engine);
		const res = h.object({
			background: this.generator.build(o)
		}, {
			contextName
		});
		debug('generator done');
		return res;
	}

	augment({images, width, height, channels}, {background}) {
		// Console.log(image.getDataAsArray()[100].slice(50, 60))
		debug('start overlay');
		const res = this.backend.overlay({foregrounds: images, backgrounds: background.images, width, height, channels});
		debug('overlay done');
		// Console.log(res.getDataAsArray()[100].slice(50, 60))
		return {images: res};
	}

	augmentBoxes({boxes}, {background}) {
		// Console.log('augmentBoxes ', {boxes, back: background.boxes})
		return boxes.concat(background.boxes || []);
	}
}

module.exports = BackgroundAugmenter;
