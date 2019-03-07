const h = require('hasard');
const AbstractAugmenter = require('./abstract');

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

	buildParams({width, height, channels}) {
		const contextName = 'background';
		return h.object({
			background: this.generator.build({width, height, channels})
		}, {
			contextName
		});
	}

	augmentImage({img}, {background}) {
		return this.backend.overlay({foreground: img, background, width: img.cols, height: img.rows, channels: img.channels});
	}
}

module.exports = BackgroundAugmenter;
