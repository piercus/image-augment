const test = require('ava');
const AdditiveTruncatedNormalNoise = require('../../lib/augmenters/additive-truncated-normal-noise');
const macroAugmenter = require('../macros/augmenter');

const mean = 2;
const nImages = 5;

test('additiveTruncatedNormalNoise not perChannel', macroAugmenter, AdditiveTruncatedNormalNoise, {
	inputFilenames: new Array(nImages).fill('lenna.png'),
	backendLibs: [require('@tensorflow/tfjs-node')],
	expectImg(t, mats1, mats2, backend) {
		const metadatas = backend.getMetadata(mats1);
		const metadata = metadatas[0];
		const diff = backend.diff(mats1, mats2);
		const size = (metadatas.length * metadata.width * metadata.height * 3);
		const norm = backend.normL1(diff) / size;
		const tolerance = 1000 / Math.sqrt(size);
		t.true(Math.abs(norm - mean) < tolerance);

		// Console.log(diff.getDataAsArray().slice(0,30).map(v => v.slice(440, 450)))

		let count = 0;
		const m2 = backend.imageToArray(mats2);

		backend.forEachPixel(diff, ([b, g, r], batchIndex, rowIndex, colIndex) => {
			if (m2[batchIndex][rowIndex][colIndex].slice(0, 3).indexOf(255) === -1 && m2[batchIndex][rowIndex][colIndex].slice(0, 3).indexOf(0) === -1 && (r !== g || g !== b)) {
				console.log(m2[batchIndex] && m2[batchIndex][rowIndex][colIndex], [r, g, b]);
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

test('additiveTruncatedNormalNoise per Channel', macroAugmenter, AdditiveTruncatedNormalNoise, {
	inputFilenames: new Array(nImages).fill('lenna.png'),
	expectImg(t, mats1, mats2, backend) {
		const diff = backend.diff(mats1, mats2);
		let count = 0;
		const m2 = backend.imageToArray(mats2);
		backend.forEachPixel(diff, ([b, g, r], batchIndex, rowIndex, colIndex) => {
			if (m2[batchIndex][rowIndex][colIndex].slice(0, 3).indexOf(255) === -1 && m2[batchIndex][rowIndex][colIndex].slice(0, 3).indexOf(0) === -1 && (r !== g || g !== b)) {
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
