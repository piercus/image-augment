const path = require('path');
const test = require('ava');
const AdditivePoissonNoise = require('../../lib/augmenters/additive-poisson-noise');
const macroAugmenter = require('../macros/augmenter');

const lambda = 4;

test('additivePoissonNoise not perChannel', macroAugmenter, AdditivePoissonNoise, {
	inputFilename: 'lenna.png',
	expectImg(t, mats1, mats2, backend) {
		const mat1 = backend.splitImages(mats1)[0];
		const mat2 = backend.splitImages(mats2)[0];
		const absdiff = backend.absdiff(mat1, mat2);
		const metadata = backend.getMetadata(mats1);
		const norm = backend.normL1(absdiff) / (metadata.width * metadata.height * metadata.channels);

		t.true(norm > lambda * 2 / 3);
		t.true(norm < lambda * 4 / 3);

		const norm2 = backend.normL1(backend.diff(mat1, mat2)) / (metadata.width * metadata.height * metadata.channels);

		t.true(norm2 > lambda * 1e-3);

		let count = 0;
		// Console.log(diff.getDataAsArray().slice(0,30).map(v => v.slice(440, 450)))
		const m2 = backend.imageToArray(mat2);
		backend.forEachPixel(absdiff, ([b, g, r], rowIndex, colIndex) => {
			if (m2[rowIndex][colIndex].slice(0, 3).indexOf(255) === -1 && m2[rowIndex][colIndex].slice(0, 3).indexOf(0) === -1 && (r !== g || g !== b)) {
				count++;
			}
		});
		t.is(count, 0);
	},
	options: {
		lambda,
		perChannel: false
	}
});

test('additivePoissonNoiseperChannel', macroAugmenter, AdditivePoissonNoise, {
	inputFilename: 'lenna.png',
	expectImg(t, mats1, mats2, backend) {
		const mat1 = backend.splitImages(mats1)[0];
		const mat2 = backend.splitImages(mats2)[0];
		const diff = backend.absdiff(mat1, mat2);
		const metadata = backend.getMetadata(mats1);
		const norm = backend.normL1(diff) / (metadata.width * metadata.height * metadata.channels);
		t.true(norm > lambda * 2 / 3);
		t.true(norm < lambda * 4 / 3);
		let count = 0;
		const m2 = backend.imageToArray(mat2);
		backend.forEachPixel(diff, ([b, g, r], rowIndex, colIndex) => {
			if (m2[rowIndex][colIndex].slice(0, 3).indexOf(255) === -1 && m2[rowIndex][colIndex].slice(0, 3).indexOf(0) === -1 && (r !== g || g !== b)) {
				count++;
			}
		});
		t.not(count, 0);
	},
	options: {
		lambda,
		perChannel: true
	}
});

test('additivePoissonNoiseperChannel with scale', macroAugmenter, AdditivePoissonNoise, {
	inputFilename: 'lenna-with-alpha.png',
	options: {
		lambda,
		scale: 0.2,
		perChannel: true
	}
});
