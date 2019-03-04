const path = require('path');
const test = require('ava');
const PerspectiveTransform = require('../../lib/augmenters/perspective-transform');
const macroAugmenter = require('../macros/augmenter');

test('perspective-transform sigma 4 and transparent', macroAugmenter, PerspectiveTransform, {
	input: path.join(__dirname, '..', 'data/lenna.png'),
	output: path.join(__dirname, '..', 'data/lenna-perspective-transform-transparent.png'),
	options: {
		cornersVariation: [[0.1, 0.1], [0.2, -0.2], [-0.3, 0.3], [0, 0]],
		borderType: 'transparent',
		borderValue: [255, 0, 0]
	}
});

test('perspective-transform sigma 6 with bordervalue and constant border', macroAugmenter, PerspectiveTransform, {
	input: path.join(__dirname, '..', 'data/lenna.png'),
	output: path.join(__dirname, '..', 'data/lenna-perspective-transform-constant.png'),
	options: {
		cornersVariation: [[-0.3, -0.3], [-0.2, -0.2], [-0.3, -0.3], [-0.1, -0.1]],
		borderType: 'constant',
		borderValue: [255, 0, 0]
	}
});

test('perspective-transform sigma 6 with bordervalue and replicate border', macroAugmenter, PerspectiveTransform, {
	input: path.join(__dirname, '..', 'data/lenna.png'),
	output: path.join(__dirname, '..', 'data/lenna-perspective-transform-replicate.png'),
	options: {
		cornersVariation: [[-0.3, -0.3], [-0.2, -0.2], [-0.3, -0.3], [-0.1, -0.1]],
		borderType: 'replicate'
	}
});

test('perspective transparent image to transparent border', macroAugmenter, PerspectiveTransform, {
	input: path.join(__dirname, '..', 'data/lenna-with-alpha.png'),
	options: {
		cornersVariation: [[-0.3, -0.3], [-0.2, -0.2], [-0.3, -0.3], [-0.1, -0.1]],
		borderType: 'transparent',
		borderValue: [255, 0, 0]
	}
});