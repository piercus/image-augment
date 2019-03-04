const backends = require('../../lib/backend');

module.exports = function (t, Cstr, {input, output, options, backend = backends.getDefault()}) {
	const inst = new Cstr(options);
	const img = backend.readImage(input);
	const res = inst.runOnce({img});

	const expected = backend.readImage(output);

	const data2 = backend.imageToBuffer(expected);
	t.true(backend.imageToBuffer(res.img).equals(data2));
	return Promise.resolve();
};
