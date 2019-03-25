const path = require('path');
const test = require('ava');
const PerspectiveTransform = require('../../lib/augmenters/perspective-transform');
const macroAugmenter = require('../macros/augmenter');

test('perspective-transform sigma 4 and transparent', macroAugmenter, PerspectiveTransform, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-perspective-transform-transparent.png',
	backendLibs: [
		require('opencv4nodejs')
	],
	inputPoints: [[0, 0], [1, 0], [0, 1], [1, 1]],
	outputPoints: [[0.1, 0.1], [1.2, -0.2], [-0.3, 1.3], [1, 1]],
	options: {
		cornersVariation: [[0.1, 0.1], [0.2, -0.2], [-0.3, 0.3], [0, 0]],
		borderType: 'transparent',
		borderValue: [255, 0, 0]
	}
});

test('perspective-transform sigma 6 with bordervalue and constant border', macroAugmenter, PerspectiveTransform, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-perspective-transform-constant.png',
	backendLibs: [
		require('opencv4nodejs')
	],
	options: {
		cornersVariation: [[-0.3, -0.3], [-0.2, -0.2], [-0.3, -0.3], [-0.1, -0.1]],
		borderType: 'constant',
		borderValue: [255, 0, 0]
	}
});

test('perspective-transform sigma 6 with bordervalue and replicate border', macroAugmenter, PerspectiveTransform, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-perspective-transform-replicate.png',
	backendLibs: [
		require('opencv4nodejs')
	],
	options: {
		cornersVariation: [[-0.3, -0.3], [-0.2, -0.2], [-0.3, -0.3], [-0.1, -0.1]],
		borderType: 'replicate'
	}
});

test('perspective transparent image to transparent border', macroAugmenter, PerspectiveTransform, {
	inputFilename: 'lenna-with-alpha.png',
	backendLibs: [
		require('opencv4nodejs')
	],
	options: {
		cornersVariation: [[-0.3, -0.3], [-0.2, -0.2], [-0.3, -0.3], [-0.1, -0.1]],
		borderType: 'transparent',
		borderValue: [255, 0, 0]
	}
});
