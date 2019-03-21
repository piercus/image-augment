const path = require('path');
const test = require('ava');
const GaussianNoise = require('../../lib/generators/gaussian-noise');
const macroGenerator = require('../macros/generator');

const width = 59;
const height = 47;
const channels = 3;
const mean = 128;
const sigma = 50;

test('gaussian-noise', macroGenerator, GaussianNoise, {
	debugOutput: path.join(__dirname, '../..', 'tmp/gaussian-noise.png'),
	expectImg: (t, img) => {
		t.is(img.cols, width);
		t.is(img.rows, height);
		const sum = img.getDataAsArray()
			.reduce((a, b) => a.concat(b))
			.reduce((a, b) => a.concat(b))
			.reduce((a, b) => a + b);

		t.true(
			Math.abs((sum / (width * height * channels)) - mean) < 100 / Math.sqrt(width * height * channels)
		);
	},
	width,
	height,
	channels,
	options: {
		mean,
		scale: 1,
		sigma
	}
});
