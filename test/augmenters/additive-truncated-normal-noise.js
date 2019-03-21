const path = require('path');
const test = require('ava');
const AdditiveTruncatedNormalNoise = require('../../lib/augmenters/additive-truncated-normal-noise');
const macroAugmenter = require('../macros/augmenter');

const mean = 10;
const nImages = 2;

test.only('additiveTruncatedNormalNoise not perChannel', macroAugmenter, AdditiveTruncatedNormalNoise, {
	inputFilenames: new Array(nImages).fill('lenna.png'),
	backends:[
		require('@tensorflow/tfjs-node-gpu')
	],
	// Backends: ['tfjs'],
	// backends: ['opencv4nodejs'],
	expectImg(t, mats1, mats2, backend) {
		const mat1 = backend.splitImages(mats1)[0];
		const mat2 = backend.splitImages(mats2)[0];
		const metadata = backend.getMetadata(mats1);
		const diff = backend.diff(mat1, mat2);
		const norm = backend.normL1(diff) / (metadata.width * metadata.height * 3);
		const tolerance = 100 / Math.sqrt((metadata.width * metadata.height * 3));
		t.true(Math.abs(norm - mean) < tolerance);

		// Console.log(diff.getDataAsArray().slice(0,30).map(v => v.slice(440, 450)))

		let count = 0;
		const m2 = backend.imageToArray(mat2);

		backend.forEachPixel(diff, ([b, g, r], rowIndex, colIndex) => {
			// Console.log({rowIndex, colIndex})
			if (m2[rowIndex][colIndex].indexOf(255) === -1 && m2[rowIndex][colIndex].indexOf(0) === -1 && (r !== g || g !== b)) {
				count++;
			}
		});
		t.is(count, 0);
	},
	options: {
		mean,
		std: 2,
		perChannel: false
	}
});

test('additiveTruncatedNormalNoise per Channel', macroAugmenter, AdditiveTruncatedNormalNoise, {
	inputFilename: 'lenna.png',
	expectImg(t, mats1, mats2, backend) {
		const mat1 = backend.splitImages(mats1)[0];
		const mat2 = backend.splitImages(mats2)[0];
		const diff = backend.diff(mat1, mat2);
		let count = 0;
		const m2 = backend.imageToArray(mat2);
		backend.forEachPixel(diff, ([b, g, r], rowIndex, colIndex) => {
			if (m2[rowIndex][colIndex].indexOf(255) === -1 && m2[rowIndex][colIndex].indexOf(0) === -1 && (r !== g || g !== b)) {
				count++;
			}
		});
		t.not(count, 0);
	},
	options: {
		mean,
		sigma: 2,
		perChannel: true
	}
});
