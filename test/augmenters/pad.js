const path = require('path');
const test = require('ava');
const Pad = require('../../lib/augmenters/pad');
const macroAugmenter = require('../macros/augmenter');

test('pad kernel 10% with replicate border', macroAugmenter, Pad, {
	input: path.join(__dirname, '..', 'data/lenna.png'),
	output: path.join(__dirname, '..', 'data/lenna-pad-10.png'),
	options: {
		percent: 0.1,
		borderType: 'replicate',
		borderValue: [255, 0, 0]
	}
});

test('pad kernel 10%x30% with constant red border', macroAugmenter, Pad, {
	input: path.join(__dirname, '..', 'data/lenna.png'),
	output: path.join(__dirname, '..', 'data/lenna-pad-10x30.png'),
	options: {
		percent: [0.1, 0.3],
		borderType: 'constant',
		borderValue: [255, 0, 0]
	}
});

test('pad kernel 10%x30%x0%x5% with transparent border', macroAugmenter, Pad, {
	input: path.join(__dirname, '..', 'data/lenna.png'),
	output: path.join(__dirname, '..', 'data/lenna-pad-10x30x0x5.png'),
	options: {
		percent: [0.1, 0.3, 0, 0.05],
		borderType: 'transparent',
		borderValue: [255, 0, 0]
	}
});
