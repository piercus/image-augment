const path = require('path');
const test = require('ava');
const AdditivePoissonNoise = require('../../lib/augmenters/additive-poisson-noise');
const macroAugmenter = require('../macros/augmenter');

const lambda = 4;

test('additivePoissonNoise not perChannel', macroAugmenter, AdditivePoissonNoise, {
	input: path.join(__dirname, '..', 'data/lenna.png'),
	expectImg(t, mat1, mat2, backend) {
		const absdiff = backend.absdiff(mat1, mat2);
		const metadata = backend.getMetadata(mat1);
		const norm = backend.normL1(absdiff) / (metadata.width * metadata.height * metadata.channels);

		t.true(norm > lambda * 2 / 3);
		t.true(norm < lambda * 4 / 3);

		const norm2 = backend.normL1(backend.diff(mat1, mat2)) / (metadata.width * metadata.height * metadata.channels);

		t.true(norm2 > lambda * 1e-3);

		let count = 0;
		// Console.log(diff.getDataAsArray().slice(0,30).map(v => v.slice(440, 450)))
		const m2 = mat2.getDataAsArray();
		backend.forEachPixel(absdiff, ([b, g, r], rowIndex, colIndex) => {
			if (m2[rowIndex][colIndex].indexOf(255) === -1 && m2[rowIndex][colIndex].indexOf(0) === -1 && (r !== g || g !== b)) {
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
	input: path.join(__dirname, '..', 'data/lenna.png'),
	expectImg(t, mat1, mat2, backend) {
		const diff = backend.absdiff(mat1, mat2);
		const metadata = backend.getMetadata(mat1);
		const norm = backend.normL1(diff) / (metadata.width * metadata.height * metadata.channels);
		t.true(norm > lambda * 2 / 3);
		t.true(norm < lambda * 4 / 3);
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
		lambda,
		perChannel: true
	}
});

test('additivePoissonNoiseperChannel with scale', macroAugmenter, AdditivePoissonNoise, {
	input: path.join(__dirname, '..', 'data/lenna-with-alpha.png'),
	options: {
		lambda,
		scale: 0.2,
		perChannel: true
	}
});
