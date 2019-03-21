const path = require('path');
const test = require('ava');
const AdditiveGaussianNoise = require('../../lib/augmenters/additive-gaussian-noise');
const macroAugmenter = require('../macros/augmenter');

const mean = 2;

test('additiveGaussianNoise not perChannel', macroAugmenter, AdditiveGaussianNoise, {
	inputFilename: 'lenna.png',
	// Backends: ['tfjs'],
	// backends: ['opencv4nodejs'],
	expectImg(t, mats1, mats2, backend) {
		const mat1 = backend.splitImages(mats1)[0];
		const mat2 = backend.splitImages(mats2)[0];
		const metadata = backend.getMetadata(mats1);
		const diff = backend.diff(mat1, mat2);
		const norm = backend.normL1(diff) / (metadata.width * metadata.height * 3);

		t.true(Math.abs(norm - mean) < 100 / Math.sqrt((metadata.width * metadata.height * 3)));

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

test('additiveGaussianNoise per Channel', macroAugmenter, AdditiveGaussianNoise, {
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
