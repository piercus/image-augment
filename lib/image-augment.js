module.exports = {
	Pipeline: require('./augmenters/sequential'),
	AffineTransform: require('./augmenters/affine-transform'),
	PerspectiveTransform: require('./augmenters/perspective-transform'),
	Blur: require('./augmenters/blur'),
	AdditivePoissonNoise: require('./augmenters/additive-poisson-noise'),
	AdditiveGaussianNoise: require('./augmenters/additive-gaussian-noise'),
	Resize: require('./augmenters/resize'),
	Pad: require('./augmenters/pad'),
	Crop: require('./augmenters/crop'),
	PoissonNoise: require('./generators/poisson-noise'),
	GaussianNoise: require('./generators/gaussian-noise')

};
