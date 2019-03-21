const imageAugment = require('../../index')
const debug = require('debug')('image-augment:benchmark');
const h = require('hasard');
const PromiseBlue = require('bluebird')
const allBackends = require('../../lib/backend');

const backends = [
	require('@tensorflow/tfjs-node'), 
	require('opencv4nodejs'), 
	require('@tensorflow/tfjs-node-gpu')
];

const filenames = new Array(100).fill('lenna.jpg');

PromiseBlue.map(backends, b => {
	const startTime = new Date();
	const backend = allBackends.get(b);
	const augmenter = new imageAugment.Sequential({
		backend: b,
		steps: [
			new imageAugment.AddWeighted({
				value: h.array({size: 3, value: h.integer(0,255)}),
				alpha: h.number(0, 0.5)
			}),
			new imageAugment.Add({
				value: h.array({size: 3, value: h.integer(0,10)})
			}),
			new imageAugment.AdditivePoissonNoise(h.integer(0, 3)),
			new imageAugment.AdditiveGaussianNoise(h.number(0, 2)),
			new imageAugment.AffineTransform({scale: h.number(1, 1.2)}),
			new imageAugment.Background({scale: h.number(1, 1.2)}),
			new imageAugment.Blur(h.integer(1, 6)),
			new imageAugment.Crop(h.integer(10, 20)),
			new imageAugment.Pad(h.integer(10, 20)),
			new imageAugment.PerspectiveTransform(0.2),
			new imageAugment.Resize(h.integer(150, 300))
		]
	})
	
	return augmenter.fromFilenames({
		filenames
	}).then(result => {
		return {
			result,
			timeSpent: (new Date()) - startTime,
			backendKey: b
		}
	});
}, {concurrency: 1}).then(res => {
	console.log('done', res)
}).catch(err => {
	console.log('error', err)
})