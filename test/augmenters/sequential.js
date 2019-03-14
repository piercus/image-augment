const path = require('path');
const test = require('ava');
const Sequential = require('../../lib/augmenters/sequential');
const Blur = require('../../lib/augmenters/blur');
const Resize = require('../../lib/augmenters/resize');

const macroAugmenter = require('../macros/augmenter');

test('sequential blur then resize', macroAugmenter, Sequential, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-seq-blur-resize.png',
	options: {
		steps: [
			new Blur({
				kernel: 10
			}),
			new Resize({
				size: [100, 100]
			})
		]
	}
});
