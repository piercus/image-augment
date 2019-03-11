const h = require('hasard');
const AbstractAugmenter = require('./abstract');
const debug = require('debug')('image-augment:augmenters:background')
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

	buildParams({width, height, channels, boxes}) {
		const contextName = 'background';
		debug('start generator')
		const res = h.object({
			background: this.generator.build({width, height, channels, boxes})
		}, {
			contextName
		});
		debug('generator done')
		return res;
	}

	augmentImage({image}, {background}) {
		// console.log(image.getDataAsArray()[100].slice(50, 60))
		debug('start overlay')
		const res = this.backend.overlay({foreground: image, background: background.image, width: image.cols, height: image.rows, channels: image.channels});
		debug('overlay done')
		// console.log(res.getDataAsArray()[100].slice(50, 60))
		return res;
	}
	
	augmentBoxes({boxes}, {background}) {
		//console.log('augmentBoxes ', {boxes, back: background.boxes})
		return boxes.concat(background.boxes || []);
	}
}

module.exports = BackgroundAugmenter;
