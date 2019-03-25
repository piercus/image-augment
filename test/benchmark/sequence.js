const path = require('path');
const debug = require('debug')('image-augment:benchmark');
const h = require('hasard');
const PromiseBlue = require('bluebird');

const backendLibs = [
	require('@tensorflow/tfjs-node'),
	require('opencv4nodejs'),
	require('@tensorflow/tfjs-node-gpu')
];
const allBackends = require('../../lib/backend');
const imageAugment = require('../..');

const filenames = new Array(2).fill(path.join(__dirname, '../data', 'opencv4nodejs', 'lenna.png'));

PromiseBlue.map(backendLibs, backendLib => {
	const startTime = new Date();
	const backend = allBackends.get(b);
	const ia = imageAugment(b);
	const augmenter = new ia.Sequential({
		steps: [
			new ia.AddWeighted({
				value: h.array({size: 3, value: h.integer(0, 255)}),
				alpha: h.number(0, 0.5)
			}),
			new ia.Add({
				value: h.array({size: 3, value: h.integer(0, 10)})
			}),
			new ia.AdditivePoissonNoise(h.integer(0, 3)),
			new ia.AdditiveGaussianNoise(h.number(0, 2)),
			new ia.AffineTransform({scale: h.number(1, 1.2)}),
			new ia.Background({scale: h.number(1, 1.2)}),
			new ia.Blur(h.integer(1, 6)),
			new ia.Crop(h.integer(10, 20)),
			new ia.Pad(h.integer(10, 20)),
			new ia.PerspectiveTransform(0.2),
			new ia.Resize(h.integer(150, 300))
		]
	});

	return augmenter.fromFilenames({
		filenames
	}).then(result => {
		return {
			result,
			timeSpent: (new Date()) - startTime,
			backendKey: b
		};
	});
}, {concurrency: 1}).then(res => {
	console.log('done', res);
}).catch(error => {
	console.log('error', err);
});
