const path = require('path');
const test = require('ava');
const AdditiveGaussianNoise = require('../../lib/augmenters/additive-gaussian-noise');
const macroAugmenter = require('../macros/augmenter');

const mean = 2;

test('additiveGaussianNoise not perChannel', macroAugmenter, AdditiveGaussianNoise, {
	input: path.join(__dirname, '..', 'data/lenna.png'),
	expectImg(t, mat1, mat2, backend) {
		const metadata = backend.getMetadata(mat1);
		const diff = backend.diff(mat1, mat2);
		const norm = backend.normL1(diff) / (metadata.width * metadata.height * metadata.channels);

		t.true(Math.abs(norm - mean) < 100/Math.sqrt((metadata.width * metadata.height * metadata.channels)));

		// Console.log(diff.getDataAsArray().slice(0,30).map(v => v.slice(440, 450)))

		let count = 0;
		const m2 = mat2.getDataAsArray();
		backend.forEachPixel(diff, ([b, g, r], rowIndex, colIndex) => {
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
	input: path.join(__dirname, '..', 'data/lenna.png'),
	expectImg(t, mat1, mat2, backend) {
		const diff = backend.diff(mat1, mat2);
		let count = 0;
		const m2 = mat2.getDataAsArray();
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
