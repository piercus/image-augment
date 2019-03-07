const path = require('path');
const test = require('ava');
const Add = require('../../lib/augmenters/add');
const macroAugmenter = require('../macros/augmenter');

test('blur kernel 3', macroAugmenter, Add, {
	input: path.join(__dirname, '..', 'data/lenna.png'),
	output: path.join(__dirname, '..', 'data/lenna-red.png'),	
	//debugOutput: path.join(__dirname, '..', 'data/lenna-red.png'),
	options: {
		value: [100,-10,-10]
	}
});

