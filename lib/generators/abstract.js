const h = require('hasard');
const backends = require('../backend');
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
	* Run the augmenter
	* @param {Object} o options
	* @param {Number} o.nImages number of images to generate
	* @param {Number} o.width width of the generated image
	* @param {Number} o.height width of the generated image
	* @param {Number} o.channels width of the generated image
	* @returns {Hasard.<Image>} an hasard object resolved by image
	*/
	build(o, runOpts) {
		return this.buildHasard(Object.assign({}, o || {}, this._opts), runOpts);
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

	runOnce(runOpts) {
		const build = this.build({}, runOpts);
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

	buildHasard(o, runOpts) {
		const h1 = this.source.build({}, runOpts);
		const h2 = this.augmenter.buildParams(h1);
		const r = h.fn((o2, p2) => {
			// Console.log('in augmented Generator,', {o2})
			return this.augmenter.augment(Object.assign({}, o2), p2, runOpts);
		})(h1, h2);
		// Console.log('after buildHasard AugmentedGenerator', rand)
		return r;
	}
}

module.exports = AbstractGenerator;
