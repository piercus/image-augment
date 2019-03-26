const AbstractAugmenter = require('./abstract');

/**
* This augmenter does nothing
* it is used in combination with other augmenter
* Or to build sometimes augmenters
* @example
// Simple usage
const sometimes = ((aug) => h.value([aug, ia.identity()]))
*/

class IdentityAugmenter extends AbstractAugmenter {
	constructor(_, ia) {
		super({}, ia);
	}

	buildParams() {
	}

	augmentImage({image}) {
		return this.backend.identity(image);
	}
}

module.exports = IdentityAugmenter;
