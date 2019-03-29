const test = require('ava');
const Resize = require('../../lib/augmenters/resize');
const macroAugmenter = require('../macros/augmenter');

test('resize to 20x30', macroAugmenter, Resize, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-resized-20x30.png',
	options: {
		size: [20, 30]
	}
});
