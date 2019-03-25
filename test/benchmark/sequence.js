const path = require('path');
const debug = require('debug')('image-augment:benchmark');
const h = require('hasard');
const PromiseBlue = require('bluebird');

const backendLibs = [
	// Require('@tensorflow/tfjs-node'),
	// require('opencv4nodejs'),
	require('@tensorflow/tfjs-node-gpu')
];
const allBackends = require('../../lib/backend');
const imageAugment = require('../..');

const filenames = new Array(2).fill(path.join(__dirname, '../data', 'opencv4nodejs', 'lenna.png'));

PromiseBlue.map(backendLibs, backendLib => {
	const startTime = new Date();
	const ia = imageAugment(backendLib);
	const augmenter = ia.sequential({
		steps: [
			ia.addWeighted({
				value: h.array({size: 3, value: h.integer(0, 255)}),
				alpha: h.number(0, 0.5)
			}),
			ia.add({
				value: h.array({size: 3, value: h.integer(0, 10)})
			}),
			ia.additiveNoise(h.number(0, 2)),
			ia.affineTransform({scale: h.number(1, 1.2)}),
			ia.blur(h.integer(1, 6)),
			ia.crop(h.integer(10, 20)),
			ia.pad(h.integer(10, 20)),
			ia.resize(h.integer(150, 300))
		]
	});

	return augmenter.fromFilenames({
		filenames
	}).then(result => {
		console.log(result.images.shape);
		return {
			result,
			timeSpent: (new Date()) - startTime,
			backendKey: augmenter.backend.key
		};
	});
}, {concurrency: 1}).then(res => {
	console.log('done', res);
}).catch(error => {
	console.log('error', error);
});
