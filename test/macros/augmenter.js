const allBackends = require('../../lib/backend');

module.exports = function (t, Cstr, {
	input,
	output,
	options,
	debugOutput,
	inputPoints,
	outputPoints,
	expectImg,
	backends = ['opencv4nodejs']//, 'tfjs-node-gpu']
}) {
	const bckds = backends.map(b => allBackends.get(b));
	return Promise.all(bckds.map(backend => {
		const inst = new Cstr(options);
		return backend.readImage(input)
			.then(image => {
				return inst.runAugmenter({image}).then(res => {
					if (!output) {
						t.pass();
						return Promise.resolve(res);
					}

					// Backend.writeImage(output, res.image);
					return backend.readImage(output).then(expected => {
						return Promise.all([
							backend.imageToBuffer(expected),
							backend.imageToBuffer(res.image)
						])
					})
					.then(([actual2, expected2]) => {
						t.true(actual2.equals(expected2));
					}).then(() => {
						return res
					})
				})
				.then(res => {
					if (!debugOutput) {
						return Promise.resolve(res);
					}

					console.log(`Save file for debugging in ${debugOutput}`);
					return backend.writeImage(debugOutput, res.image).then(() => {
						return res;
					})
				})
				.then(res => {
					if (!expectImg) {
						t.pass();
						return Promise.resolve();
					}

					expectImg(t, image, res.image, backend);
					return Promise.resolve(res)
				})
				.then(res => {
					if (!inputPoints && !outputPoints) {
						t.pass();
						return Promise.resolve();
					}

					const width = image.cols;
					const height = image.rows;
					const toSize = ([x, y]) => ([x * width, y * height]);
					return inst.runAugmenter({image, points: inputPoints.map(toSize)}).then(res => {
						const expected = outputPoints.map(toSize).map(a => backend.point(...a));
						const tolerance = 1e-6 * (width + height) / 2;
						res.points.forEach((p, index) => {
							// Console.log({actual: p.x, expected: expected[index].x, res: Math.abs(p.x - expected[index].x) < tolerance})
							t.true(Math.abs(p.x - expected[index].x) < tolerance);
							t.true(Math.abs(p.y - expected[index].y) < tolerance);
						});
					})
				});
			})
			
	}))
	
};
