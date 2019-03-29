const fs = require('fs');

const {PNG} = require('pngjs');

const fileToTensor = function (filename, tf) {
	return new Promise((resolve, reject) => {
		const inputPng = new PNG();
		fs.createReadStream(filename)
			.pipe(inputPng)
			.on('parsed', () => {
				const images = tf.tensor4d(inputPng.data, [1, inputPng.height, inputPng.width, 4]);
				resolve(images);
			})
			.on('error', reject);
	});
};

const fileToCv = function (filename, cv) {
	return cv.imreadAsync(filename, cv.IMREAD_UNCHANGED);
};

module.exports = function (filenames, backend) {
	if (!Array.isArray(filenames)) {
		filenames = [filenames];
	}

	return Promise.all(filenames.map(f => {
		if (backend.key === 'tfjs') {
			return fileToTensor(f, backend.backendLib);
		}

		if (backend.key === 'opencv4nodejs') {
			return fileToCv(f, backend.backendLib);
		}

		throw (new Error('unkowned backend'));
	})).then(tensors => {
		return backend.mergeImages(tensors, true);
	});
};
