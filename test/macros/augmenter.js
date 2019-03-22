const debug = require('debug')('image-augment:test:augmenter');

const path = require('path');
const PromiseBlue = require('bluebird');
const allBackends = require('../../lib/backend');

module.exports = function (t, Cstr, {
	inputFilename,
	outputFilename,
	inputFilenames = [],
	options,
	debugOutput,
	inputPoints,
	outputPoints,
	expectImg,
	backends = [
		require('@tensorflow/tfjs-node-gpu'),		
		require('opencv4nodejs')
	]
}) {
	return PromiseBlue.map(backends, bKey => {
		const backend = allBackends.get(bKey);
		
		const inst = new Cstr(Object.assign({}, options, {backend: bKey}));
		debug(`${Cstr.name}/${backend.key} initialized`);
		let inputs
		if(inputFilename){
			inputs = [path.join(__dirname, '../data', backend.key, inputFilename)];
		} else { // if(inputFilenames)
			inputs = inputFilenames.map(inF => path.join(__dirname, '../data', backend.key, inF));
		}
		let output;
		if (outputFilename) {
			output = path.join(__dirname, '../data', backend.key, outputFilename);
		}

		return backend.readImages(inputs)
			.then(images => {
				debug(`${Cstr.name}/${backend.key} start `);
				return inst.runAugmenter({images})
					.then(res => {
						debug(`${Cstr.name}/${backend.key} end`);
						if (!debugOutput) {
							return Promise.resolve(res);
						}

						debug(`Save file for debugging in ${debugOutput}`);
						
						return backend.writeImages(
							Array.isArray(debugOutput) ? debugOutput : [debugOutput], 
							res.images
						).then(() => {
							return res;
						});
					})
					.then(res => {
						if (!output) {
							t.pass();
							return Promise.resolve(res);
						}

						const promise = Promise.resolve();
						// If(bKey === 'tfjs'){
						// 	promise = backend.writeImage(output, res.image);
						// }

						return promise.then(() => {
							return backend.readImage(output);
						}).then(expected => {
							return Promise.all([
								backend.imagesToBuffer([expected]),
								backend.imagesToBuffer(res.images)
							]);
						})
							.then(([actual2, expected2]) => {
								t.true(actual2.equals(expected2));
							}).then(() => {
								return res;
							});
					})
					.then(res => {
						if (!expectImg) {
							t.pass();
							return Promise.resolve();
						}

						expectImg(t, images, res.images, backend);
						return Promise.resolve(res);
					})
					.then(res => {
						if (!inputPoints && !outputPoints) {
							t.pass();
							return Promise.resolve();
						}

						const {width, height} = backend.getMetadata(images);
						const toSize = ([x, y]) => ([x * width, y * height]);
						return inst.runAugmenter({images, points: [inputPoints.map(toSize)]}).then(res => {
							const expected = outputPoints.map(toSize);
							const tolerance = 1e-6 * (width + height) / 2;
							res.points[0].forEach((p, index) => {
								t.true(Math.abs(p[0] - expected[index][0]) < tolerance);
								t.true(Math.abs(p[1] - expected[index][1]) < tolerance);
							});
						});
					});
			});
	}, {concurrency: 1});
};
