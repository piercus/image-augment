const test = require('ava');
const Sequential = require('../../lib/augmenters/sequential');
const Blur = require('../../lib/augmenters/blur');
const Resize = require('../../lib/augmenters/resize');
const AdditiveTruncatedNormalNoise = require('../../lib/augmenters/additive-truncated-normal-noise');
const AffineTransform = require('../../lib/augmenters/affine-transform');

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
test('sequential noise then affine', macroAugmenter, Sequential, {
	inputFilename: 'lenna.png',
	options: {
		steps: [
			new AdditiveTruncatedNormalNoise(2),
			new AffineTransform(1)
		]
	}
});

test('sequential noise then affine', macroAugmenter, Sequential, {
	inputFilename: 'lenna.png',
	options: {
		steps: [
			new AdditiveTruncatedNormalNoise(2),
			new AffineTransform(1)
		]
	}
});
