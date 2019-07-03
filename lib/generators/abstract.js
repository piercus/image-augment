const h = require('hasard');
const Abstract = require('../abstract');

/**
* All augmenters are extending this abstract class
* @example
// Create one simple generator
const generator = new ia.GaussianNoise(0.2)
const hGenerator = generator.build({width, height, channels})
// => returns a Hasard object that is resolved by a nImages x width x height x channels images
hGenerator.runOnce()
// Generates images
// => {images: [Mat]}
**/
class AbstractGenerator extends Abstract {
	constructor(opts = {}, ia) {
		super(opts, ia);
		// By doing this every object of the image-augment library
		// is considered by Hasard library as
		// an hasard object and will be 'resolved' recursively
		this._hasard = true;
		this._generator = true;
		this._opts = opts;
	}

	/**
	* @typedef {Object} Metadata
	* @property width
	* @property height
	* @property channels
	*/
	/**
	* Build hasard object from the generator
	* This method is used to create an hasard object from the generator
	* Without resolving yet
	*
	* @param {Object} o options
	* @param {Array.<Metadata>} o.metadatas number of images to generate
	* @param {Object} [runOpts] hasard options
	* @returns {Hasard.<AugmenterFormat>} an hasard object resolved by image
	*
	* @example
	const h = require('hasard');
	const ia = require('image-augment');
	const generator1 = new ia.GaussianNoise(5);
	const generator2 = new ia.GaussianNoise(20);

	const genObj = h.object({
		foo: generator1.build({metadatas : [{width: 22, height: 33, channels: 3}]}),
		bar: generator2.build({metadatas : [{width: 55, height: 31, channels: 3}]})
	})

	genObj.runOnce()
	// => {
	//   foo: {images: <Images>},
	//   bar: {images: <Images>}
	// }
	*/
	build(o, runOpts) {
		return this.buildAllImagesHasard(Object.assign({}, o || {}, this._opts), runOpts);
	}

	/**
	* Apply an augmenter after the generator
	* @param {Augmenter} augmenter augmenter to apply
	* @returns {Generator} the augmented generator
	*/

	apply(augmenter) {
		return new AugmentedGenerator({
			source: this,
			augmenter
		});
	}

	buildHasard() {
		throw (new Error('override me'));
	}

	/**
	* Run the generator
	*
	* @param {Object} o options
	* @param {Array.<Metadata>} o.metadatas number of images to generate
	* @param {Object} [runOpts] hasard options
	* @returns {Hasard.<Image>} an hasard object resolved by image
	*/
	runOnce(o = {}, runOpts) {
		const build = this.build(o, runOpts);
		const res = build.runOnce(runOpts);
		return res;
	}
}

class AugmentedGenerator extends AbstractGenerator {
	constructor(o) {
		super(o);
		const {source, augmenter} = o;
		this.source = source;
		this.augmenter = augmenter;
	}

	buildAllImagesHasard(o, runOpts) {
		const h1 = this.source.build({}, runOpts);
		const h2 = this.augmenter.buildParams(h1);
		const r = h.fn((o2, p2) => {
			// Console.log('in augmented Generator,', {o2})
			return this.augmenter.run(Object.assign({}, o2), p2, runOpts);
		})(h1, h2);
		// Console.log('after buildHasard AugmentedGenerator', rand)
		return r;
	}
}

module.exports = AbstractGenerator;
