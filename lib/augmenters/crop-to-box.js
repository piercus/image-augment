const hasard = require('hasard');
const CropAugmenter = require('./crop');

/**
* Crop the image
* @param {Object} opts options
* @param {NumberArgument} [opts.cornersVariation] length-2 x lenght-2 variate (in percent) of box
* ex : [[x1, y1], [x2, y2]] will cropp a box of size (x1+x2 +1)*width x (y1+y2 +1)*height
* Positive numbers will increase the size of the box
* @param {NumberArgument} opts.sigma sigma af a normal distribution of cornersVariation
* @param {NumberArgument} opts.mean mean of a normal distribution of cornersVariation
* @param {NumberArgument} [opts.boxIndex] index of the box to use, by default, will be randomly decided
* @example
// Simple usage, will crop a random box among boxes,
// and return it as the new image
// will throw an error if no boxes
new ia.CropToBox();
* @example
// default parameter is sigma, here 10% variation
new ia.CropToBox(0.1);
* @example
// here 20% variation, in the normal distribution
// and by average width of the cropped box will be 20% larger (10% + 10%) and same for height
new ia.CropToBox({sigma: 0.2, mean: 0.1});
*/

class CropToBoxAugmenter extends CropAugmenter {
	constructor(opts) {
		let o;
		if (typeof (opts) === 'number' || hasard.isHasard(opts)) {
			o = {sigma: opts};
		} else {
			o = opts;
		}

		super(o);
		const {sigma, mean = 0, boxIndex, cornersVariation} = o;

		this.sigma = this.toSize2(sigma);
		this.mean = this.toSize2(mean);
		this.cornersVariation = cornersVariation;
		this.boxIndex = boxIndex;
	}

	buildParams({boxes, width}) {
		return new hasard.Object({
			cornersVariation: this.cornersVariation || hasard.array({
				size: 2,
				value: new hasard.Array([
					new hasard.Number({
						type: 'normal',
						mean: hasard.getProperty(0, this.mean),
						std: hasard.getProperty(0, this.sigma)
					}),
					new hasard.Number({
						type: 'normal',
						mean: hasard.getProperty(1, this.mean),
						std: hasard.getProperty(1, this.sigma)
					})
				])
			}),
			box: hasard.getProperty(this.boxIndex || hasard.integer(0, boxes.length - 1), boxes)
		});
	}

	checkParams({size}) {
		// Override
	}

	getRect({width, height, params}) {
		const {cornersVariation} = params;
		const {box} = params;
		const x = Math.round(Math.max(0, box[0] - cornersVariation[0][0] * box[2]));
		const y = Math.round(Math.max(0, box[1] - cornersVariation[0][1] * box[3]));
		const w = Math.round(Math.min(width - x, box[2] + (cornersVariation[0][0] + cornersVariation[1][0]) * box[2]));
		const h = Math.round(Math.min(height - y, box[3] + (cornersVariation[0][1] + cornersVariation[1][1]) * box[3]));

		return {
			x,
			y,
			w,
			h
		};
	}
}

module.exports = CropToBoxAugmenter;
