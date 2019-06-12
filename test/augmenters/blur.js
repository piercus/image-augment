const test = require('ava');
const Blur = require('../../lib/augmenters/blur');
const macroAugmenter = require('../macros/augmenter');

test('blur kernel 3', macroAugmenter, Blur, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-blured-3x3.png',
	options: {
		kernel: 3
	}
});

test('blur kernel 3x3', macroAugmenter, Blur, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-blured-3x3.png',
	options: {
		kernel: [3, 3]
	}
});

test('blur kernel 6x1', macroAugmenter, Blur, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-blured-6x1.png',
	options: {
		kernel: [6, 1]
	}
});

test('blur kernel 0', macroAugmenter, Blur, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna.png',
	options: {
		kernel: 0
	}
});
