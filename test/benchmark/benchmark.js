const fs = require('fs');
const path = require('path');
const debug = require('debug');
const h = require('hasard');
const PromiseBlue = require('bluebird');

const logFilename = path.join(__dirname, 'benchmark.log');
const mdFilename = path.join(__dirname, '../../doc', 'BENCHMARK.md');
const imageGridPrefix = path.join(__dirname, 'output', 'benchmark-');

const logFile = fs.createWriteStream(logFilename);
debug.log = function (data) {
	logFile.write(data + '\n');
};

const backendLibs = [
	// Require('@tensorflow/tfjs-node'),
	require('opencv4nodejs'),
	require('@tensorflow/tfjs-node-gpu')
];
const imageAugment = require('../..');
const formatBenchmark = require('./format-benchmark');

const batchSize = 25;

const filenames = new Array(batchSize).fill(path.join(__dirname, '../data', 'opencv4nodejs', 'lenna.png'));

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
			ia.affineTransform({
				scale: h.number(0.2, 1)
			}),
			ia.blur(h.integer(1, 50)),
			ia.crop(10),
			ia.pad(10),
			ia.resize(200)
		]
	});

	return augmenter.fromFilenames({
		filenames
	}).then(result => {
		console.log(result);
		return augmenter.backend.writeImagesGrid(
			imageGridPrefix + augmenter.backend.key + '.png',
			result.images
		).then(() => {
			return result;
		});
	}).then(result => {
		return {
			result,
			timeSpent: (new Date()) - startTime,
			backendKey: augmenter.backend.key
		};
	});
}, {concurrency: 1}).then(_ => {
	const description = `benchmark of augmenters by backend on a ${batchSize} lenna images\n\n` +
	'See the [benchmark code](../test/benchmark/benchmark.js)\n\n' +
	'See the [benchmark result image grid](../test/benchmark/output)';
	return formatBenchmark({
		filename: logFilename,
		description
	});
}).then(res => {
	return fs.writeFileSync(mdFilename, res);
}).then(res => {
	console.log('done', res);
}).catch(error => {
	console.log('error', error);
});