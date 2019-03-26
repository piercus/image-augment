const path = require('path');
const debug = require('debug')('image-augment:test:augmenter');
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
	backendLibs = [
		// Require('opencv4nodejs'),
		require('@tensorflow/tfjs-node-gpu')
	]
}) {
	return PromiseBlue.map(backendLibs, backendLib => {
		const backend = allBackends.get(backendLib);

		let startNumTensors;

		if (backend.key === 'tfjs') {
			startNumTensors = backend.backendLib.memory().numTensors;
		}

		const inst = new Cstr(Object.assign({}, options, {backendLib}));
		debug(`${Cstr.name}/${backend.key} initialized`);
		let inputs;
		if (inputFilename) {
			inputs = [path.join(__dirname, '../data', backend.key, inputFilename)];
		} else { // If(inputFilenames)
			inputs = inputFilenames.map(inF => path.join(__dirname, '../data', backend.key, inF));
		}

		let output;
		if (outputFilename) {
			output = path.join(__dirname, '../data', backend.key, outputFilename);
		}

		// If (backend.key === 'tfjs') {
		// 	console.log(backend.backendLib.memory().numTensors, startNumTensors);
		// }

		return backend.readImages(inputs)
			.then(images => {
				// Console.log(backend.backendLib.memory().numTensors, startNumTensors);

				debug(`${Cstr.name}/${backend.key} start `);
				return inst.read({images})
					.then(res => {
						if (backend.key === 'tfjs') {
							t.true(backend.backendLib.memory().numTensors <= startNumTensors + 2);
						}

						debug(`${Cstr.name}/${backend.key} end (${backend._tf && backend._tf.memory().numTensors})`);
						let dbgOutput;
						if (typeof (debugOutput) === 'object') {
							dbgOutput = debugOutput[backend.key];
						} else {
							dbgOutput = debugOutput;
						}

						if (!dbgOutput) {
							return Promise.resolve(res);
						}
						// Console.log(backend.backendLib.memory().numTensors)

						debug(`Save file for debugging in ${dbgOutput} (${backend._tf && backend._tf.memory().numTensors})`);

						return backend.writeImages(
							Array.isArray(dbgOutput) ? dbgOutput : [dbgOutput],
							res.images
						).then(() => {
							return res;
						});
					})
					.then(res => {
						// Console.log(backend.backendLib.memory().numTensors)

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
							if (!expected) {
								throw (new Error(`Cannot open ${output}`));
							}

							return Promise.all([
								backend.imagesToBuffer([expected]),
								backend.imagesToBuffer(res.images)
							]).then(([actual2, expected2]) => {
								t.true(actual2.equals(expected2), `Failed on "${backend.key}" backend while comparing to "${output}"`);
							}).then(() => {
								backend.dispose(expected);
								debug(`${Cstr.name}/${backend.key} After debug images (${backend._tf && backend._tf.memory().numTensors})`);

								return res;
							});
						});
					})
					.then(res => {
						if (!expectImg) {
							t.pass();
							return Promise.resolve(res);
						}

						debug(`${Cstr.name}/${backend.key} bf expectImg (${backend._tf && backend._tf.memory().numTensors})`);
						expectImg(t, images, res.images, backend);
						debug(`${Cstr.name}/${backend.key} af expectImg (${backend._tf && backend._tf.memory().numTensors})`);
						return Promise.resolve(res);
					})
					.then(res => {
						if (!inputPoints && !outputPoints) {
							t.pass();
							return Promise.resolve(res);
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
							backend.dispose(res.images);
						}).then(() => {
							return res;
						});
					}).then(res => {
						debug(`Before disposed (${backend._tf && backend._tf.memory().numTensors})`);
						backend.dispose(res.images);
						backend.dispose(images);
						if (backend.key === 'tfjs') {
							debug(`Are tensors disposed ? (${backend._tf.memory().numTensors})`);
							t.true(backend.backendLib.memory().numTensors <= startNumTensors);
						}
					});
			});
	}, {concurrency: 1});
};
