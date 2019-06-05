const fs = require('fs');

const {PNG} = require('pngjs');

const tensorToFile = function (filename, image) {
	return new Promise((resolve, reject) => {
		const png = new PNG({
			width: image.shape[2],
			height: image.shape[1]
		});
		if (image.shape[3] === 4) {
			png.data = image.dataSync();
		} else {
			const channels = image.shape[3];
			const data = image.dataSync();
			for (let i = 0; i < data.length; i++) {
				const index4 = Math.floor(i / channels) * 4;
				if (channels === 1) {
					png.data[index4] = data[i];
					png.data[index4 + 1] = data[i];
					png.data[index4 + 2] = data[i];
					png.data[index4 + 3] = 255;
				} else if (channels === 3) {
					png.data[index4] = data[i];
					png.data[index4 + 3] = 255;
				}
			}
		}

		png
			.pack()
			.pipe(fs.createWriteStream(filename))
			.on('error', reject)
			.on('close', resolve);
	});
};

const cvToFile = function (filename, image, cv) {
	return cv.imwriteAsync(filename, image);
};

module.exports = function (filenames, ims, backend) {
	if (!Array.isArray(filenames)) {
		filenames = [filenames];
	}

	const images = backend.splitImages(ims);

	if (images.length !== filenames.length) {
		return Promise.reject(new Error('lenght should match'));
	}

	return Promise.all(filenames.map((f, i) => {
		if (backend.key === 'tfjs') {
			return tensorToFile(f, images[i], backend.backendLib).then(() => {
				backend.dispose(images[i]);
			});
		}

		if (backend.key === 'opencv4nodejs') {
			return cvToFile(f, images[i], backend.backendLib);
		}

		throw (new Error('unkowned backend'));
	}));
};
