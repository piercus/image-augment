const path = require('path');
const test = require('ava');
const AddWeighted = require('../../lib/augmenters/add-weighted');
const macroAugmenter = require('../macros/augmenter');

test('blur kernel 3', macroAugmenter, AddWeighted, {
	input: path.join(__dirname, '..', 'data/lenna.png'),
	output: path.join(__dirname, '..', 'data/lenna-light.png'),	
	//debugOutput: path.join(__dirname, '..', 'data/lenna-light.png'),
	options: {
		value: [255,255,255],
		alpha: 0.3
	}
});

