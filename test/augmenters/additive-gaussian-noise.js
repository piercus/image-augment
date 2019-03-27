const test = require('ava');
const AdditiveGaussianNoise = require('../../lib/augmenters/additive-gaussian-noise');
const macroAugmenter = require('../macros/augmenter');

const mean = 2;

test('additiveGaussianNoise not perChannel', macroAugmenter, AdditiveGaussianNoise, {
	inputFilename: 'lenna.png',
	expectImg(t, mats1, mats2, backend) {
		const metadatas = backend.getMetadata(mats1)
		const metadata = metadatas[0];
		const diff = backend.diff(mats1, mats2);
		const size = (metadatas.length * metadata.width * metadata.height * metadata.channels);
		const norm = backend.normL1(diff) / size;
		t.true(Math.abs(norm - mean) < 1000 / Math.sqrt(size));

		// Console.log(diff.getDataAsArray().slice(0,30).map(v => v.slice(440, 450)))

		let count = 0;
		const m2 = backend.imageToArray(mats2);

		backend.forEachPixel(diff, ([b, g, r], batchIndex, rowIndex, colIndex) => {
			// Console.log({rowIndex, colIndex})
			if (m2[batchIndex][rowIndex][colIndex].slice(0, 3).indexOf(255) === -1 && m2[batchIndex][rowIndex][colIndex].slice(0, 3).indexOf(0) === -1 && (r !== g || g !== b)) {
				count++;
			}
		});
		backend.dispose(diff);
		backend.dispose(norm);
		t.is(count, 0);
	},
	options: {
		mean,
		sigma: 2,
		perChannel: false
	}
});

test('additiveGaussianNoise per Channel', macroAugmenter, AdditiveGaussianNoise, {
	inputFilename: 'lenna.png',
	expectImg(t, mats1, mats2, backend) {
		const diff = backend.diff(mats1, mats2);
		let count = 0;
		const m2 = backend.imageToArray(mats2);
		backend.forEachPixel(diff, ([b, g, r], rowIndex, colIndex) => {
			if (m2[rowIndex][colIndex].indexOf(255) === -1 && m2[rowIndex][colIndex].indexOf(0) === -1 && (r !== g || g !== b)) {
				count++;
			}
		});
		backend.dispose(diff);
		t.not(count, 0);
	},
	options: {
		mean,
		sigma: 2,
		perChannel: true
	}
});
