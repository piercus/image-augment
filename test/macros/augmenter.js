const debug = require('debug')('image-augment:test:augmenter');

const path = require('path');
const PromiseBlue = require('bluebird');
const allBackends = require('../../lib/backend');

module.exports = function (t, Cstr, {
	inputFilename,
	outputFilename,
	options,
	debugOutput,
	inputPoints,
	outputPoints,
	expectImg,
	backends = ['opencv4nodejs', 'tfjs']
}) {
	return PromiseBlue.map(backends, bKey => {
		const backend = allBackends.get(bKey);
		const inst = new Cstr(Object.assign({}, options, {backend: bKey}));
		const input = path.join(__dirname, '../data', bKey, inputFilename);
		let output;
		if (outputFilename) {
			output = path.join(__dirname, '../data', bKey, outputFilename);
		}

		return backend.readImages([input])
			.then(images => {
				debug(`${Cstr.name}/${bKey} start `);
				return inst.runAugmenter({images})
					.then(res => {
						debug(`${Cstr.name}/${bKey} end`);
						if (!debugOutput) {
							return Promise.resolve(res);
						}

						debug(`Save file for debugging in ${debugOutput}`);
						return backend.writeImages([debugOutput], res.images).then(() => {
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
							const expected = outputPoints.map(toSize).map(a => backend.point(...a));
							const tolerance = 1e-6 * (width + height) / 2;
							res.points[0].forEach((p, index) => {
								t.true(Math.abs(p.x - expected[index].x) < tolerance);
								t.true(Math.abs(p.y - expected[index].y) < tolerance);
							});
						});
					});
			});
	}, {concurrency: 1});
};
