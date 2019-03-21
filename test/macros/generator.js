const PromiseBlue = require('bluebird');
const debug = require('debug')('image-augment:test:generator');
const allBackends = require('../../lib/backend');

module.exports = function (t, Cstr, {
	debugOutput,
	expectImg,
	width,
	nImages = 1,
	height,
	channels,
	options,
	backends = [
		require('@tensorflow/tfjs-node-gpu'),
		require('opencv4nodejs')
	]
}) {
	return PromiseBlue.map(backends, bKey => {
		const backend = allBackends.get(bKey);
		const inst = new Cstr(Object.assign({}, options, {backend: bKey}));
		const hasardInst = inst.build({nImages, width, height, channels});
		debug(`${Cstr.name}/${backend.key} start`);
		const res = hasardInst.runOnce();
		debug(`${Cstr.name}/${backend.key} end`);

		return Promise.resolve()
			.then(() => {
				if (!debugOutput) {
					return Promise.resolve();
				}

				backend.writeImages(debugOutput, res.images);
			})
			.then(() => {
				if (!expectImg) {
					t.pass();
					return Promise.resolve();
				}

				expectImg(t, res, backend);
			});
	}, {concurrency: 1});
};
