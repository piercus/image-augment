const path = require('path');
const test = require('ava');
const Background = require('../../lib/augmenters/background');
const macroAugmenter = require('../macros/augmenter');
const GaussianNoise = require('../../lib/generators/gaussian-noise');

test('background lenna over GaussianNoise', macroAugmenter, Background, {
	inputFilename: 'lenna-pad-transparent-10x30x0x5.png',
	debugOutput: {
		tfjs: [path.join(__dirname, '../..', 'tmp/tfjs-lenna-noise-background-10x30x0x5.png')],
		opencv4nodejs: [path.join(__dirname, '../..', 'tmp/opencv4nodejs-lenna-noise-background-10x30x0x5.png')]
	},
	//	Backends: ['opencv4nodejs'],
	options: {
		generator: new GaussianNoise({sigma: 30, scale: 0.2, mean: 128})
	}
});

