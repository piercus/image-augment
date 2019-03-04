module.exports = {
	Pipeline: require('./augmenters/sequential'),
	AffineTransform: require('./augmenters/affine-transform'),
	PerspectiveTransform: require('./augmenters/perspective-transform'),
	Blur: require('./augmenters/blur'),
	AdditivePoissonNoise: require('./augmenters/additive-poisson-noise'),
	Resize: require('./augmenters/resize'),
	Pad: require('./augmenters/pad'),
	Crop: require('./augmenters/crop'),
	Custom: require('./augmenters/custom')
};
