const test = require('ava');
const AffineTransform = require('../../lib/augmenters/affine-transform');
const macroAugmenter = require('../macros/augmenter');

test('affine scale 0.5 replicate', macroAugmenter, AffineTransform, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-affine-scale-0.5.png',
	// InputPoints: [[0, 0], [1, 0], [0, 1], [1, 1]],
	// outputPoints: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
	options: {
		scale: 0.5,
		borderValue: [255, 0, 0],
		borderType: 'replicate'
	}
});

test('affine scale 2 replicate', macroAugmenter, AffineTransform, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-affine-scale-2.png',
	inputPoints: [[0, 0], [1, 0], [0, 1], [1, 1]],
	outputPoints: [[-0.5, -0.5], [1.5, -0.5], [-0.5, 1.5], [1.5, 1.5]],
	options: {
		scale: 2,
		borderValue: [255, 0, 0],
		borderType: 'replicate'
	}
});

test('affine translatePercent 0.1', macroAugmenter, AffineTransform, {
	inputFilename: 'lenna.png',
	// OutputFilename: 'lenna-affine-translate-10.png',
	// debugOutput: {
	// 	opencv4nodejs : [
	// 		path.join(__dirname, '../..', 'tmp/opencv4nodejs-lenna-affine-translate-10.png')
	// 	],
	// 	tfjs: [
	// 		path.join(__dirname, '../..', 'tmp/tfjs-lenna-affine-translate-10.png')
	// 	],
	// },
	options: {
		translatePercent: 0.1,
		borderValue: [255, 0, 0],
		borderType: 'transparent'
	}
});

test('affine translatePercent 0.1, -0.2', macroAugmenter, AffineTransform, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-affine-translate-10-20.png',
	inputPoints: [[0, 0], [0, 1]],
	outputPoints: [[0.1 + 0.25, -0.2 + 0.25], [0.1 + 0.25, 0.75 - 0.2]],
	options: {
		scale: 0.5,
		translatePercent: [0.1, -0.2],
		borderValue: [255, 0, 0],
		borderType: 'constant'
	}
});

test('affine rotate 10', macroAugmenter, AffineTransform, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-rotate-10.png',
	options: {
		rotate: 10,
		borderValue: [255, 0, 0],
		borderType: 'constant'
	}
});

test('affine shear -25', macroAugmenter, AffineTransform, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-shear-25.png',
	options: {
		shear: -25,
		borderValue: [255, 0, 0],
		borderType: 'constant'
	}
});
test('affine all', macroAugmenter, AffineTransform, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-affine-all.png',
	options: {
		scale: 0.5,
		translatePercent: [0.1, 0.2],
		rotate: 30,
		shear: -25,
		borderValue: [255, 0, 0],
		borderType: 'constant'
	}
});

test('affine transparent image to transparent border', macroAugmenter, AffineTransform, {
	inputFilename: 'lenna-with-alpha.png',
	options: {
		rotate: 10,
		borderType: 'transparent',
		borderValue: [255, 0, 0]
	}
});
