const path = require('path');
const test = require('ava');
const Resize = require('../../lib/augmenters/resize');
const macroAugmenter = require('../macros/augmenter');

test('resize to 20x30', macroAugmenter, Resize, {
	input: path.join(__dirname, '..', 'data/lenna.png'),
	output: path.join(__dirname, '..', 'data/lenna-resized-20x30.png'),
	options: {
		size: [20, 30]
	}
});
