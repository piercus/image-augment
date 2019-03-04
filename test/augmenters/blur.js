const path = require('path');
const test = require('ava');
const Blur = require('../../lib/augmenters/blur');
const macroAugmenter = require('../macros/augmenter');

test('blur kernel 3', macroAugmenter, Blur, {
	input: path.join(__dirname, '..', 'data/lenna.png'),
	output: path.join(__dirname, '..', 'data/lenna-blured-3x3.png'),
	options: {
		kernel: 3
	}
});

test('blur kernel 3x3', macroAugmenter, Blur, {
	input: path.join(__dirname, '..', 'data/lenna.png'),
	output: path.join(__dirname, '..', 'data/lenna-blured-3x3.png'),
	options: {
		kernel: [3, 3]
	}
});

test('blur kernel 6x1', macroAugmenter, Blur, {
	input: path.join(__dirname, '..', 'data/lenna.png'),
	output: path.join(__dirname, '..', 'data/lenna-blured-6x1.png'),
	options: {
		kernel: [6, 1]
	}
});
