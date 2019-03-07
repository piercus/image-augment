const backends = require('../backend');
/**
* All augmenters are extending this abstract class
* @example
// Create one simple augmenter and an img
const generator = new ia.GaussianNoise(0.2)
const hGenerator = generator.build({width, height, channels})
// => returns a Hasard object that is resolved by a widthxheightxchannels image
// => [{ image : Mat, points: [<first point new position>, <second point new position>] }]
hGenerator.runOnce()
// Generates an image
// => image
**/
class AbstractGenerator {
	constructor(opts) {
		this._generator = true;
		this.backend = opts.backend ? backends.get(opts.backend) : backends.getDefault();
	}

	/**
	* Run the augmenter
	* @param {Object} o options
	* @param {Number} o.width width of the generated image
	* @param {Height} o.width width of the generated image
	* @param {Width} o.width width of the generated image
	* @returns {Hasard.<Image>} an hasard object resolved by image
	*/
	build(o) {
		return this.buildHasard(o);
	}

	buildHasard() {
		throw (new Error('override me'));
	}
}

module.exports = AbstractGenerator;
