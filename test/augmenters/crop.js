const test = require('ava');
const h = require('hasard');
const Crop = require('../../lib/augmenters/crop');
const macroAugmenter = require('../macros/augmenter');

test('crop kernel 10%', macroAugmenter, Crop, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-crop-10.png',
	options: {
		percent: 0.1
	}
});

test('crop kernel 10%x30%', macroAugmenter, Crop, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-crop-10x30.png',
	// DebugOutput: {
	// 	tfjs: [
	// 		path.join(__dirname, '..', 'data/tfjs/lenna-crop-10x30.png')
	// 	]
	// },
	options: {
		percent: [0.1, 0.3]
	}
});

test('crop kernel 10%x30%x0%x5%', macroAugmenter, Crop, {
	inputFilename: 'lenna.png',
	outputFilename: 'lenna-crop-10x30x0x5.png',
	options: {
		percent: [0.1, 0.3, 0, 0.05]
	}
});
test('crop on 3 images with hasard', macroAugmenter, Crop, {
	inputFilenames: ['lenna.png', 'lenna.png', 'lenna.png'],
	options: {
		size: h.number(0,10)
	},
	expectImg(t, mats1, mats2, backend) {
		const metadata = backend.getMetadata(mats2);
		t.is(metadata.length, 3);
		const first = metadata[0];
		t.not(metadata.filter(m => m.width !== first.width || m.height !== first.height).length, 0);
	}
});
