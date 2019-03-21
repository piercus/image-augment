module.exports = {
	Sequential: require('./augmenters/sequential'),
	AffineTransform: require('./augmenters/affine-transform'),
	PerspectiveTransform: require('./augmenters/perspective-transform'),
	Blur: require('./augmenters/blur'),
	AdditivePoissonNoise: require('./augmenters/additive-poisson-noise'),
	AdditiveGaussianNoise: require('./augmenters/additive-gaussian-noise'),
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
	AbstractGenerator: require('./generators/abstract')
};
