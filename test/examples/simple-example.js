// Tfjs does not provide any read/write manipulation
// function on nodejs, so we nee to to this with pngjs
const fs = require('fs');
const {PNG} = require('pngjs');

const fileToTensor = function (filename) {
	return new Promise((resolve, reject) => {
		const inputPng = new PNG();
		fs.createReadStream(filename)
			.pipe(inputPng)
			.on('parsed', () => {
				const images = tf.tensor4d(inputPng.data, [1, inputPng.height, inputPng.width, 4]);
				resolve({images});
			})
			.on('error', reject);
	});
};

const tensorToFile = function (filename, {images}) {
	return new Promise((resolve, reject) => {
		const png = new PNG({
			width: images.shape[2],
			height: images.shape[1]
		});
		png.data = images.dataSync();
		png
			.pack()
			.pipe(fs.createWriteStream(filename))
			.on('error', reject)
			.on('close', resolve);
	});
};

// First you need a backend for image processing
// this can be one of the following :
// * @tensorflow/tfjs
// * @tensorflow/tfjs-node
// * @tensorflow/tfjs-node-gpu
// * opencv4nodejs

const tf = require('@tensorflow/tfjs-node');

// Then initialize with the backend

const ia = require('../..')(tf);

// Create an augmentation pipeline
const basicAugmentation = ia.sequential([
	// Add a noise with a standard deviation of 15
	ia.additiveNoise(15),
	// Rotate 30°
	ia.affine({rotate: 30}),
	// Add a blur kernel of 3 pixel
	ia.blur(3)
]);

fileToTensor('test/data/tfjs/lenna.png')
	.then(({images}) => {
		return basicAugmentation.read({images});
	})
	.then(({images}) => {
		return tensorToFile('test/data/tfjs/lenna-example.png', {images});
	})
	.then(() => {
		console.log('done');
	});
