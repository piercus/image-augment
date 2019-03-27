const path = require('path');
const test = require('ava');
const GaussianNoise = require('../../lib/generators/gaussian-noise');
const macroGenerator = require('../macros/generator');

const wdth = 59;
const hght = 47;
const channels = 3;
const mean = 128;
const sigma = 50;

test('gaussian-noise', macroGenerator, GaussianNoise, {
	debugOutput: [path.join(__dirname, '../..', 'tmp/gaussian-noise.png')],
	expectImg: (t, {images}, backend) => {
		const metadatas = backend.getMetadata(images);
		const [{width, height}] = metadatas;
		t.is(width, wdth);
		t.is(height, hght);
		const sum = backend.imageToArray(images)
			.reduce((a, b) => a.concat(b))
			.reduce((a, b) => a.concat(b))
			.reduce((a, b) => a.concat(b))
			.reduce((a, b) => a + b);

		t.true(
			Math.abs((sum / (width * height * channels)) - mean) < 100 / Math.sqrt(width * height * channels)
		);
	},
	width: wdth,
	height: hght,
	channels,
	options: {
		mean,
		scale: 1,
		sigma
	}
});
