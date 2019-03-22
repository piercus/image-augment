const path = require('path');
const test = require('ava');
const h = require('hasard');
const TruncatedNormalNoise = require('../../lib/generators/truncated-normal-noise');
const macroGenerator = require('../macros/generator');

const wdth = 50;
const hght = 730;
const imageNumber = 5;
const channels = 3;
const mean = 30;
const sigma = 10;

test('truncated-normal noise', macroGenerator, TruncatedNormalNoise, {
	// DebugOutput: [
	// 	path.join(__dirname, '../..', 'tmp/truncated-normal-noise.png'),
	// 	path.join(__dirname, '../..', 'tmp/truncated-normal-noise2.png'),
	// 	path.join(__dirname, '../..', 'tmp/truncated-normal-noise3.png')
	// ],
	expectImg: (t, {images}, backend) => {
		const {width, height, nImages} = backend.getMetadata(images);
		t.is(width, wdth);
		t.is(height, hght);
		t.is(nImages, imageNumber);
		const flatten = a => {
	    return a.reduce((flat, i) => {
	      if (Array.isArray(i)) {
	        return flat.concat(flatten(i));
	      }

	      return flat.concat(i);
	    }, []);
	  };

		const flat = flatten(backend.imageToArray(images));

		const sum = flat.reduce((a, b) => a + b, 0);
		const l2 = (width * height * channels * nImages);
		const average = (sum / l2);
		const tolerance = 1000 / Math.sqrt(width * height * channels * nImages);
		t.true(
		 	Math.abs(average - mean) < tolerance
		);
	},
	width: wdth,
	height: hght,
	nImages: imageNumber,
	channels,
	options: {
		mean,
		scale: 1,
		sigma
	}
});

test('truncated-normal noise with hasard', macroGenerator, TruncatedNormalNoise, {
	// DebugOutput: [
	// 	path.join(__dirname, '../..', 'tmp/truncated-normal-noise0.png'),
	// 	path.join(__dirname, '../..', 'tmp/truncated-normal-noise1.png'),
	// 	path.join(__dirname, '../..', 'tmp/truncated-normal-noise2.png'),
	// 	path.join(__dirname, '../..', 'tmp/truncated-normal-noise3.png'),
	// 	path.join(__dirname, '../..', 'tmp/truncated-normal-noise4.png'),
	// 	path.join(__dirname, '../..', 'tmp/truncated-normal-noise5.png'),
	// 	path.join(__dirname, '../..', 'tmp/truncated-normal-noise6.png'),
	// 	path.join(__dirname, '../..', 'tmp/truncated-normal-noise7.png'),
	// 	path.join(__dirname, '../..', 'tmp/truncated-normal-noise8.png'),
	// 	path.join(__dirname, '../..', 'tmp/truncated-normal-noise9.png')
	// ],
	expectImg: (t, {images}, backend) => {
		const {width, height, nImages} = backend.getMetadata(images);
		t.is(width, wdth);
		t.is(height, hght);
		t.is(nImages, imageNumber);
	},
	width: wdth,
	height: hght,
	nImages: imageNumber,
	channels,
	options: {
		mean: h.integer(100, 200),
		scale: h.number(0.5, 1),
		sigma: h.integer(5, 20),
		perChannel: h.boolean()
	}
});

