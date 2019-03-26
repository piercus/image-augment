const fs = require('fs');
const Jimp = require('jimp');
const debug = require('debug')('image-augment:backend:tensorflow-backend');
const padGeneric = require('./tfjs/pad-generic');
const transform = require('./tfjs/transform');

const notImplemented = function (str) {
	throw new Error(`${str} is not implemented yet for tensorflow backend, please test with opencv4nodejs backend`);
};

const pluralAny = function (fn) {
	return function (imgs) {
		if (Array.isArray(imgs)) {
			return imgs.map(fn).filter(a => !a).length === 0;
		}

		return fn(imgs);
	};
};

const pluralArray = function (fn) {
	return function (imgs) {
		if (Array.isArray(imgs)) {
			return imgs.map(fn);
		}

		return fn(imgs);
	};
};
const pluralOperator = function (fn) {
	return function (a, b) {
		if (Array.isArray(a) !== Array.isArray(b)) {
			throw (new TypeError('operands should be same type'));
		}

		if (Array.isArray(a) && (a.length !== b.length)) {
			throw (new Error('operands should be same length'));
		}

		const inputs = Array.isArray(a) ? a.map((_, index) => {
			return ([a[index], b[index]]);
		}) : [[a, b]];

		return pluralArray(([m1, m2]) => {
			return fn(m1, m2);
		})(inputs);
	};
};
class TensorflowBackend {
	constructor(tf) {
		this._tf = tf;
		this.backendLib = this._tf;
		this.key = 'tfjs';
	}

	point(x, y) {
		return {x, y};
	}

	point3(x, y, z) {
		return {x, y, z};
	}

	floatMatrix(data) {
		return this._tf.tensor(data);
	}

	point2FromMat(mat) {
		const res = mat.dataSync();
		if (mat.shape[0] === 3) {
			return {
				x: res[0],
				y: res[1],
				z: res[2]
			};
		}

		return {
			x: res[0],
			y: res[1]
		};
	}

	pointToArray(pt) {
		if (typeof (pt.x) === 'number' &&
			typeof (pt.y) === 'number' &&
			typeof (pt.z) === 'number') {
			return [pt.x, pt.y, pt.z];
		}

		return [pt.x, pt.y];
	}

	signedMatrix(data) {
		return this._tf.tensor4d([data]);
	}

	signedMatrixFromSize(width, height, channels, value) {
		return this._tf.tidy(() => {
			const one = this._tf.tensor4d(value, [1, 1, 1, channels]);
			return one.tile([1, width, height, 1]);
		});
	}

	isImage(img) {
		if (Array.isArray(img.shape) && img.shape.length === 4) {
			return true;
		}

		return false;
	}

	isImages(imgs) {
		return pluralAny(this.isImage)(imgs);
	}

	isEmptyImage(img) {
		if (img.size === 0) {
			return true;
		}

		return false;
	}

	isEmptyImages(imgs) {
		return pluralAny(this.isEmptyImage)(imgs);
	}

	resize(image, width, height) {
		return this._tf.image.resizeBilinear(image, [height, width]);
	}

	drawBoxes() {
		notImplemented('drawBoxes');
	}
	// _toVec(values, img) {
	// 	// Opencv is BGR
	// 	if (values.length === 3 && img.channels === 3) {
	// 		return new this._cv.Vec(values[2], values[1], values[0]);
	// 	}
	//
	// 	if (values.length === 3 && img.channels === 4) {
	// 		return new this._cv.Vec(values[2], values[1], values[0], 0);
	// 	}
	//
	// 	if (values.length === 4) {
	// 		return new this._cv.Vec(values[2], values[1], values[0], values[3]);
	// 	}
	//
	// 	throw (new Error(`Cannot change ${values} to opencv Vec`));
	// }

	// _toBorderType(str) {
	// 	if (str === 'transparent') {
	// 		return this._cv.BORDER_TRANSPARENT;
	// 	}
	//
	// 	if (str === 'replicate') {
	// 		return this._cv.BORDER_REPLICATE;
	// 	}
	//
	// 	if (str === 'constant') {
	// 		return this._cv.BORDER_CONSTANT;
	// 	}
	//
	// 	throw (new Error(`${str} is not a valid borderType`));
	// }

	addNoise(img, noiseImg) {
		if(Array.isArray(img)){
			return pluralOperator(this.addNoiseOne.bind(this))(img, noiseImg)
		} else {
			return this.addNoiseOne(img, noiseImg)
		}
		
	}

	addNoiseOne(img, noiseImg) {
		return this._tf.tidy(() => {
			const black = this._tf.zerosLike(img);
			const white = this._tf.onesLike(img).mul(255);
			const res = img.add(noiseImg).maximum(black).minimum(white).toInt();
			return res;
		});		
	}

	identity(img) {
		return this._tf.clone(img);
	}

	mergeImages(images, dispose = false) {
		if (Array.isArray(images)) {
			if (images.filter(({isDisposedInternal}) => isDisposedInternal).length > 0) {
				throw (new Error('disposed tensors'));
			}

			if (images.length === 0) {
				return this.emptyImage();
			}
			if (images.length === 1) {
				return images[0];
			}
			const shape0 = images[0].shape.slice(1).join('-');
			if (images.filter(im => im.shape.slice(1).join('-') !== shape0).length > 0) {
				debug(`Cannot merge ${images.length} images due to different shapes`);
				return images;
			}
		}

		const res1 = this._tf.concat(images);
		
		// tf.concat is not cloning when only one element
		if (dispose && Array.isArray(images) && images.length > 1) {
			images.forEach(im => {
				this._tf.dispose(im);
			});
		}

		const res2 = res1.toInt();
		res1.dispose();
		return res2;
	}

	addWeighted(img, img2, alpha) {
		return this._tf.tidy(() => {
			return img.mul((1 - alpha)).add(img2.mul(alpha));
		});
	}

	fliplr(img) {
		return img.reverse(2);
	}

	flipud(img) {
		return img.reverse(1);
	}

	blur(img, size) {
		return this._tf.tidy(() => {
			const r2 = img.div(255);
			const res = this._tf.avgPool(r2, size, 1, 'same');
			return res.mul(255).round().toInt();
		});
	}

	dispose(img) {
		if (Array.isArray(img)) {
			return img.forEach(im => {
				this._tf.dispose(im);
			});
		}

		this._tf.dispose(img);
	}

	crop(img, rect) {
		const width = img.shape[2];
		const height = img.shape[1];
		const box = [
			rect.y / height,
			rect.x / width,
			(rect.h + rect.y) / height,
			(rect.w + rect.x) / width
		];

		return this._tf.tidy(() => {
			const r2 = img.div(255);
			const res = this._tf.image.cropAndResize(r2, [box], [0], [rect.h, rect.w]);
			return res.mul(255).round().toInt();
		});
	}

	affine(img, {borderValue, borderType, affineMatrix}) {
		// We need to inverse affineMatrix
		// based on https://stackoverflow.com/questions/2624422/efficient-4x4-matrix-inverse-affine-transform
		// we do
		// affineMatrix = [[m (2x2), b (2x1)], [0 (2x1), 1 (1x1)]]
		// inv(affineMatrix) = [[inv(m) (2x2), -inv(m).b (2x1) ], [0 (2x1), 1 (1x1)]]

		return this._tf.tidy(() => {
			const m = affineMatrix.slice([0, 0], [2, 2]);
			const b = affineMatrix.slice([0, 2], [2, 1]);
			const [m1, m2, m3, m4] = m.dataSync();
			const det = ((m1 * m4) - (m2 * m3));
			if (det === 0) {
				throw (new Error('cannot inverse this affine matrix'));
			}

			const invM = this._tf.tensor2d([m4 / det, -1 * m2 / det, -1 * m3 / det, m1 / det], [2, 2]);
			const b2 = invM.dot(b).mul(-1);

			const formated = invM.concat(b2, 1).reshape([1, 6]).concat(this._tf.zeros([1, 2]), 1);
			let copyBorderType;
			let copyBorderValue;
			if (borderType === 'transparent') {
				copyBorderType = 'constant';
				copyBorderValue = [0, 0, 0, 0];
			} else {
				copyBorderType = borderType;
				copyBorderValue = borderValue.concat();
			}

			if (Array.isArray(copyBorderValue) && copyBorderValue.length === 3) {
				copyBorderValue.push(255);
			}

			return transform(this._tf, img, formated, 'bilinear', copyBorderType, null, copyBorderValue);
		});
	}

	perspective() {
		notImplemented('perspective');
	}

	getPerspectiveTransform() {
		notImplemented('getPerspectiveTransform');
	}

	matMul(mat1, mat2) {
		if (typeof (mat2.x) === 'number' &&
			typeof (mat2.y) === 'number' &&
			typeof (mat2.z) === 'number') {
			return this._tf.tidy(() => mat1.dot(this._tf.tensor([mat2.x, mat2.y, mat2.z], [3])));
		}

		return mat1.dot(mat2);
	}

	pad(img, opts) {
		const {borders} = opts;

		const bordersPadding = [[0, 0], [borders[1], borders[3]], [borders[0], borders[2]], [0, 0]];
		if (opts.borderType === 'transparent') {
			if (img.shape[img.shape.length - 1] !== 4) {
				throw (new Error('no alpha channel'));
			}

			return img.pad(bordersPadding);
		}

		let fillValue = (Array.isArray(opts.borderValue) ?
			opts.borderValue :
			(typeof (opts.borderValue) === 'number' ? [opts.borderValue] : [0])
		).concat();

		if (fillValue.length === 1) {
			fillValue = [fillValue, fillValue, fillValue];
		}

		if (fillValue.length === 3) {
			fillValue.push(255);
		}

		return padGeneric(this._tf, img, bordersPadding, opts.borderType, fillValue);
	}

	readImage(filename) {
		const buffer = fs.readFileSync(filename);
		return Jimp.read(buffer).then(imageJimp => {
			return this._tf.tensor4d(new Uint8Array(imageJimp.bitmap.data), [1, imageJimp.bitmap.height, imageJimp.bitmap.width, 4], 'int32');
		});
	}

	readImages(filenames) {
		return Promise.all(filenames.map(filename => {
			return this.readImage(filename);
		})).then(tensors => {
			const res = this._tf.concat(tensors, 0);
			if (tensors.length > 1) {
				tensors.forEach(t => {
					t.dispose();
				});
			}

			return res;
		});
	}

	overlay({foregrounds, backgrounds, channels}) {
		return this._tf.tidy(() => {
			if (channels === 3) {
				return foregrounds;
			}

			if (channels === 4) {
				const channels = this._tf.split(foregrounds, 4, 3);

				const a = channels[3].div(this._tf.scalar(255)).tile([1, 1, 1, 4]);
				const white = this._tf.onesLike(foregrounds);
				const inverseA = white.sub(a);
				// Const b = foreground.cvtColor(this._cv.COLOR_BGRA2BGR).convertTo(this._cv.CV_32FC3);
				const foreW = foregrounds.mul(a);
				const backW = backgrounds.mul(inverseA);
				// Console.log("overlay a", a.getDataAsArray()[100].slice(50, 60))
				// console.log("overlay inverseA", inverseA.getDataAsArray()[100].slice(50, 60))
				// console.log("overlay back", backW.getDataAsArray()[100].slice(50, 60))

				const res = foreW.add(backW);
				return res;
			}

			throw (new Error(`invalid channels (${channels})`));
		});
	}

	writeImage(filename, img) {
		debug(`writeImage (${this._tf.memory().numTensors})`);
		let {shape} = img;
		if (shape[3] === 3) {
			const alpha = this._tf.ones(img.shape.slice(0, -1)).expandDims(3).mul(255);
			img = img.concat(alpha, 3);
			this._tf.dispose(alpha);
			shape = img.shape;
		}

		if (shape[3] === 1) {
			const alpha = this._tf.ones(img.shape.slice(0, -1)).expandDims(3).mul(255);
			img = img.tile([1, 1, 3]).concat(alpha, 3);
			this._tf.dispose(alpha);
			shape = img.shape;
		}

		return this.imageToBuffer(img).then(buffer => {
			const width = shape[2];
			const height = shape[1];
			return new Promise((resolve, reject) => {
				new Jimp(width, height, (err, image) => {
					if (err) {
						return reject(err);
					}

					image.bitmap.data = buffer;
					resolve(image);
				});
			});
		}).then(image => {
			return image.getBufferAsync(Jimp.MIME_PNG);
		}).then(buf => {
			return new Promise((resolve, reject) => {
				fs.writeFile(filename, buf, err => {
					if (err) {
						return reject(err);
					}

					resolve();
				});
			});
		});
	}

	splitImages(imgs, dispose = false) {
		if (Array.isArray(imgs)) {
			if (imgs.filter(({isDisposedInternal}) => isDisposedInternal).length > 0) {
				throw (new Error('disposed tensors'));
			}

			return imgs;
		}

		const res = imgs.split(imgs.shape[0]);
		if (dispose) {
			console.log('split dispose');
			imgs.dispose();
		}

		return res;
	}

	writeImages(filenames, imgs) {
		const array = this.splitImages(imgs);
		if (array.length !== filenames.length) {
			throw (new Error('array length and filenames lenght should match'));
		}

		return Promise.all(array.map((img, i) => this.writeImage(filenames[i], img))).then(() => {
			array.forEach(a => {
				a.dispose();
			});
		});
	}

	writeImagesGrid({filename, gridShape, imageShape, images}) {
		const w = gridShape[0];
		const h = gridShape[1];

		let imTensor;
		if (Array.isArray(images)) {
			imTensor = this._tf.concat(images.map(image => {
				return this._tf.image.resizeBilinear(image, [imageShape[1], imageShape[0]]);
			}));
		} else {
			imTensor = this._tf.image.resizeBilinear(images, [imageShape[1], imageShape[0]]);
		}

		const grid = this._tf.tidy(() => {
			const {shape} = imTensor;
			const nImages = imTensor.shape[0];
			const toAdd = (w * h) - nImages;
			const zeros = this._tf.zeros([toAdd].concat(imTensor.shape.slice(1)), 'int32');
			const [height, width] = [h * shape[1], w * shape[2]];
			let input = imTensor.concat(zeros);
			input = input.reshape([h, w, shape[1], shape[2], shape[3]]);
			input = input.transpose([0, 1, 3, 2, 4]);
			input = input.reshape([h, width, shape[1], shape[3]]);
			input = input.transpose([0, 2, 1, 3]);
			input = input.reshape([1, height, width, shape[3]]);
			return input;
		});
		return this.writeImage(filename, grid).then(() => {
			grid.dispose();
		});
	}

	imageToBuffer(img) {
		return img.data().then(d => {
			return Buffer.from(new Uint8Array(d).buffer);
		});
	}

	imagesToBuffer(imgs) {
		if (Array.isArray(imgs)) {
			return Promise.all(imgs.map(this.imageToBuffer)).then(buffers => {
				return Buffer.concat(buffers);
			});
		}

		return this.imageToBuffer(imgs);
	}

	// Slice(img, begin, size) {
	// 	return img.slice(begin, size);
	// }

	getMetadata(imgs) {
		if (Array.isArray(imgs)) {
			return imgs.map(this.getMetadataOne);
		}

		const meta = this.getMetadataOne(imgs);
		return new Array(imgs.shape[0]).fill(meta);
	}

	getMetadataOne(img) {
		const {shape} = img;

		return {
			nImages: shape[0],
			width: shape[2],
			height: shape[1],
			channels: shape[3]
		};
	}

	absdiff(m1, m2) {
		return this._tf.tidy(() => m1.sub(m2).abs());
	}

	diff(m1, m2) {
		return m1.sub(m2);
	}

	norm(m) {
		return m.norm().dataSync()[0];
	}

	normL1(m) {
		const n = m.norm(1);
		const res = n.dataSync()[0];
		n.dispose();
		return res;
	}

	imageToArrayOne(mat) {
		return mat.arraySync();
	}

	imageToArray(mat) {
		return pluralArray(this.imageToArrayOne)(mat);
	}

	forEachPixel(m, fn) {
		return m.arraySync().forEach((batch, bIndex) => {
			batch.forEach((row, rIndex) => {
				row.forEach((v, cIndex) => {
					fn(v, bIndex, rIndex, cIndex);
				});
			});
		});
	}

	truncatedNormal(shape, mean, std) {
		return this._tf.truncatedNormal(shape, mean, std);
	}

	reshape(image, shape) {
		return this._tf.reshape(image, shape);
	}

	tileChannels(image, channels) {
		const res = image.expandDims(3).tile([1, 1, 1, channels]);
		return res;
	}

	tile(image, shape) {
		return this._tf.tile(image, shape);
	}

	cropAndResize(image, boxes, boxInd, cropSize) {
		return this._tf.image.cropAndResize(image, boxes, boxInd, cropSize);
	}

	stack(arr) {
		return this._tf.stack(arr);
	}

	unstack(tensor) {
		return this._tf.unstack(tensor);
	}
}

module.exports = TensorflowBackend;
