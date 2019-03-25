const api = {
	Sequential: require('./augmenters/sequential'),
	AffineTransform: require('./augmenters/affine-transform'),
	PerspectiveTransform: require('./augmenters/perspective-transform'),
	Blur: require('./augmenters/blur'),
	AdditivePoissonNoise: require('./augmenters/additive-poisson-noise'),
	AdditiveGaussianNoise: require('./augmenters/additive-gaussian-noise'),
	AdditiveTruncatedNormalNoise: require('./augmenters/additive-truncated-normal-noise'),
	AdditiveNoise: require('./augmenters/additive-truncated-normal-noise'),
	Resize: require('./augmenters/resize'),
	Pad: require('./augmenters/pad'),
	Crop: require('./augmenters/crop'),
	CropToBox: require('./augmenters/crop-to-box'),
	Background: require('./augmenters/background'),
	Add: require('./augmenters/add'),
	AddWeighted: require('./augmenters/add-weighted'),
	DrawBoxes: require('./augmenters/draw-boxes'),
	PoissonNoise: require('./generators/poisson-noise'),
	GaussianNoise: require('./generators/gaussian-noise'),
	Noise: require('./generators/truncated-normal-noise'),
	TruncatedNormalNoise: require('./generators/truncated-normal-noise'),
	AbstractGenerator: require('./generators/abstract')
};

const backendTools = require('./backend');

class ImageAugmenter {
	constructor(backendLib) {
		this.backendLib = backendLib;
		const imageAugmenter = this;
		for (const key of Object.keys(api)) {
			this[key[0].toLowerCase() + key.slice(1)] = (k => {
				return function (o) {
					return new api[k](o, imageAugmenter);
				};
			})(key);
		}
	}
}

const createImageAugmenter = function (backendLib) {
	return new ImageAugmenter(backendLib);
};

for (var key of Object.keys(api)) {
	createImageAugmenter[key] = function (o) {
		return api[key](o);
	};
}

module.exports = createImageAugmenter;
