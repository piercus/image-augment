const backends = require('../../lib/backend');

module.exports = function (t, Cstr, {
	debugOutput,
	expectImg,
	width, 
	height,
	channels,
	options,
	backend = backends.getDefault()
}) {
	const inst = new Cstr(options);
	const hasardInst = inst.build({width, height, channels})
	const res = hasardInst.runOnce();

	return Promise.resolve()
		.then(() => {
			if (!debugOutput) {
				return Promise.resolve();
			}

			backend.writeImage(debugOutput, res);
		})
		.then(() => {
			if (!expectImg) {
				t.pass();
				return Promise.resolve();
			}

			expectImg(t, res, backend);
		});
};
