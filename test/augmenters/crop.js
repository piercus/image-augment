const path = require('path');
const test = require('ava');
const Crop = require('../../lib/augmenters/crop');
const macroAugmenter = require('../macros/augmenter');

test('crop kernel 10%', macroAugmenter, Crop, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-crop-10.png',
	options: {
		percent: 0.1
	}
});

test('crop kernel 10%x30%', macroAugmenter, Crop, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-crop-10x30.png',
	// DebugOutput: {
	// 	tfjs: [
	// 		path.join(__dirname, '..', 'data/tfjs/lenna-crop-10x30.png')
	// 	]
	// },
	options: {
		percent: [0.1, 0.3]
	}
});

test('crop kernel 10%x30%x0%x5%', macroAugmenter, Crop, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-crop-10x30x0x5.png',
	options: {
		percent: [0.1, 0.3, 0, 0.05]
	}
});
