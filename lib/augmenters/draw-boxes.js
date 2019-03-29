const hasard = require('hasard');
const AbstractAugmenter = require('./abstract');

/**
* Draw boxes in the image
*
* @param {Object} opts options, if array, or number, considered as the color
* @param {ArrayColor} [opts.color] the RGB color to draw
* @example
// Draw boxes in black
ia.drawBoxes();
* @example
// Draw boxes in white
ia.drawBoxes([255, 255, 255]);
* @example
// Explicit format
ia.drawBoxes({color: [255, 255, 255]});
*/

class DrawBoxesAugmenter extends AbstractAugmenter {
	constructor(opts, ia) {
		let o;
		if (typeof (opts) === 'number' || Array.isArray(opts) || hasard.isHasard(opts)) {
			o = {color: opts};
		} else {
			o = opts;
		}

		super(o, ia);
		const {color = [0, 0, 0]} = o;
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
