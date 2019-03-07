const path = require('path');
const test = require('ava');
const GaussianNoise = require('../../lib/generators/gaussian-noise');
const macroGenerator = require('../macros/generator');

const width = 55;
const height = 32;
const channels = 3;
const mean = 2;

test('perspective-transform sigma 4 and transparent', macroGenerator, GaussianNoise, {
	debugOutput: path.join(__dirname, '../..', 'tmp/gaussian-noise.png'),
	expectImg: (t, img) => {
		t.is(img.cols, 55);
		t.is(img.rows, 32);
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
		scale: 0.2
	}
});
