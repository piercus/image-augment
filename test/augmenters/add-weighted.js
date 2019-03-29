const test = require('ava');
const AddWeighted = require('../../lib/augmenters/add-weighted');
const macroAugmenter = require('../macros/augmenter');

test('add weighted', macroAugmenter, AddWeighted, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-light.png',
	//	DebugOutput: path.join(__dirname, '../..', 'tmp/lenna-light.png'),
	options: {
		value: [255, 255, 255],
		alpha: 0.3
	}
});

test('add weighted on empty input', macroAugmenter, AddWeighted, {
	inputFilenames: [],
	//	DebugOutput: path.join(__dirname, '../..', 'tmp/lenna-light.png'),
	options: {
		value: [255, 255, 255],
		alpha: 0.3
	}
});
