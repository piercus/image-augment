const path = require('path');
const test = require('ava');
const Background = require('../../lib/augmenters/background');
const macroAugmenter = require('../macros/augmenter');
const GaussianNoise = require('../../lib/generators/gaussian-noise');

test('background lenna over GaussianNoise', macroAugmenter, Background, {
	input: path.join(__dirname, '..', 'data/lenna-pad-transparent-10x30x0x5.png'),
	debugOutput: path.join(__dirname, '../..', 'tmp/lenna-noise-background-10x30x0x5.png'),
	options: {
		generator: new GaussianNoise({sigma: 30, scale: 0.2})
	}
});

