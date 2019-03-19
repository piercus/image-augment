const path = require('path');
const test = require('ava');
const AddWeighted = require('../../lib/augmenters/add-weighted');
const macroAugmenter = require('../macros/augmenter');

test('add weighted', macroAugmenter, AddWeighted, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-light.png',	
	//debugOutput: path.join(__dirname, '..', 'data/lenna-light.png'),
	options: {
		value: [255,255,255],
		alpha: 0.3
	}
});

