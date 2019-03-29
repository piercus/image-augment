const test = require('ava');
const Add = require('../../lib/augmenters/add');
const macroAugmenter = require('../macros/augmenter');

test('blur kernel 3', macroAugmenter, Add, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-red.png',
	// DebugOutput: path.join(__dirname, '..', 'data/lenna-red.png'),
	options: {
		value: [100, -10, -10]
	}
});

