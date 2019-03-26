const test = require('ava');
const h = require('hasard')
const Pad = require('../../lib/augmenters/pad');
const macroAugmenter = require('../macros/augmenter');

test('pad 10% with replicate border', macroAugmenter, Pad, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-pad-10.png',
	options: {
		percent: 0.1,
		borderType: 'replicate',
		borderValue: [255, 0, 0]
	}
});

test('pad 10%x30% with constant red border', macroAugmenter, Pad, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-pad-10x30.png',
	options: {
		percent: [0.1, 0.3],
		borderType: 'constant',
		borderValue: [255, 0, 0]
	}
});

test('pad 10%x30%x0%x5% with transparent border', macroAugmenter, Pad, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-pad-transparent-10x30x0x5.png',
	options: {
		percent: [0.1, 0.3, 0, 0.05],
		borderType: 'transparent',
		borderValue: [255, 0, 0]
	}
});
test('pad transparent image to transparent border', macroAugmenter, Pad, {
	inputFilename: 'lenna-with-alpha.png',
	outputFilename: 'lenna-pad-transparent-10x30x0x5.png',
	options: {
		percent: [0.1, 0.3, 0, 0.05],
		borderType: 'transparent',
		borderValue: [255, 0, 0]
	}
});

test('pad on 3 images', macroAugmenter, Pad, {
	inputFilenames: ['lenna.png', 'lenna.png', 'lenna.png'],
	options: 10
});
test('pad on 3 images with hasard', macroAugmenter, Pad, {
	inputFilenames: ['lenna.png', 'lenna.png', 'lenna.png'],
	options: {
		size: h.number(0,10)
	}
});