const debug = require('debug')('image-augment:augmenters:background');
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
	constructor(opts, ia) {
		let o;
		if (AbstractAugmenter.isGenerator(opts) || h.isHasard(opts)) {
			o = {generator: opts};
		} else {
			o = opts;
		}

		super(o, ia);
		const {generator} = o;
		if (!generator) {
			throw (new Error('background augmenter need a generator as input'));
		}

		this.generator = generator;
	}

	buildAllImagesHasard({metadatas}, runOpts) {
		const contextName = 'background';
		debug(`start generator ${this._name} (${this.backend._tf && this.backend._tf.memory().numTensors})`);
		this.generator.setBackend(this.backend.backendLib);
		const joinId = function(m){
			return m.width + m.height+m.channels;
		};
		const uniq = function (arr) {
			return arr.filter((a, index) => arr.indexOf(a) === index);
		};
		const mGroups = uniq(metadatas.map(joinId));
		
		if(mGroups.length > 1){
			const generatedImagesHasard = h.array(metadatas.map(m => {
				return this.generator.build({nImages: 1, width: m.width, height: m.height, channels: m.channels});
			}))
			return h.object({
				background: h.fn(ims => this.backend.mergeImages(ims.map(({images}) => images), true))(generatedImagesHasard),
			}, {
				contextName
			});
		} else {
			return h.object({
				background: this.generator.build(Object.assign({}, metadatas[0], {nImages : metadatas.length}))
			}, {
				contextName
			});
		}		

		return res;
	}

	augment({images, metadatas}, {background}) {
		// Console.log(image.getDataAsArray()[100].slice(50, 60))
		debug(`start overlay ${this._name} (${this.backend._tf && this.backend._tf.memory().numTensors})`);
		const res = this.backend.overlay({foregrounds: images, backgrounds: background.images, metadatas});
		this.backend.dispose(background.images);
		debug(`overlay done ${this._name} (${this.backend._tf && this.backend._tf.memory().numTensors})`);
		// Console.log(res.getDataAsArray()[100].slice(50, 60))
		return {images: res};
	}

	augmentBoxes({boxes}, {background}) {
		// Console.log('augmentBoxes ', {boxes, back: background.boxes})
		return boxes.concat(background.boxes || []);
	}
}

module.exports = BackgroundAugmenter;
