const backends = require('../../lib/backend');

module.exports = function (t, Cstr, {
	input,
	output,
	options,
	debugOutput,
	inputPoints,
	outputPoints,
	expectImg,
	backend = backends.getDefault()
}) {
	const inst = new Cstr(options);
	const image = backend.readImage(input);
	const res = inst.runOnce({image});

	return Promise.resolve()
		.then(() => {
			if (!output) {
				t.pass();
				return Promise.resolve();
			}

			// Backend.writeImage(output, res.image);
			const expected = backend.readImage(output);

			const data2 = backend.imageToBuffer(expected);
			t.true(backend.imageToBuffer(res.image).equals(data2));
			return Promise.resolve();
		})
		.then(() => {
			if (!debugOutput) {
				return Promise.resolve();
			}

			console.log(`Save file for debugging in ${debugOutput}`);
			backend.writeImage(debugOutput, res.image);
		})
		.then(() => {
			if (!expectImg) {
				t.pass();
				return Promise.resolve();
			}

			expectImg(t, image, res.image, backend);
		})
		.then(() => {
			if (!inputPoints && !outputPoints) {
				t.pass();
				return Promise.resolve();
			}

			const width = image.cols;
			const height = image.rows;
			const toSize = ([x, y]) => ([x * width, y * height]);
			const res = inst.runOnce({image, points: inputPoints.map(toSize)});

			const expected = outputPoints.map(toSize).map(a => backend.point(...a));
			const tolerance = 1e-6 * (width + height) / 2;
			res.points.forEach((p, index) => {
				// Console.log({actual: p.x, expected: expected[index].x, res: Math.abs(p.x - expected[index].x) < tolerance})
				t.true(Math.abs(p.x - expected[index].x) < tolerance);
				t.true(Math.abs(p.y - expected[index].y) < tolerance);
			});
		});
};
