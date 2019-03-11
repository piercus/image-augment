const hasard = require('hasard');
const AbstractAugmenter = require('./abstract');

/**
* Resize the image
* @param {Object} opts options, if array, or number, considered as the color
* @param {ArrayColor} [opts.color] mandatory if percent not defined
* @example
// Draw boxes in black
new ia.DrawBoxes();
* @example
// Draw boxes in white
new ia.DrawBoxes([255, 255, 255]);
* @example
// Explicit format
new ia.DrawBoxes({color: [255, 255, 255]});
*/

class DrawBoxesAugmenter extends AbstractAugmenter {
	constructor(opts) {
		let o;
		if (typeof (opts) === 'number' || Array.isArray(opts) || hasard.isHasard(opts)) {
			o = {color: opts};
		} else {
			o = opts;
		}

		super(o);
		const {color = [0,0,0]} = o;
		this.color = color;
	}

	buildParams() {
		return new hasard.Object({
			color: this.color
		});
	}
	
	augmentImage({image, boxes}, {color}) {
		return this.backend.drawBoxes(image, boxes, color);
	}
}

module.exports = DrawBoxesAugmenter;
