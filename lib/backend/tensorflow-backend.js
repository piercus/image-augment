const debug = require('debug')('image-augment:backend:tensorflow-backend');
const linear = require('linear-solve');
const padGeneric = require('./tfjs/pad-generic');
const transform = require('./tfjs/transform');
const getPerspectiveTransform = require('./tfjs/get-perspective-transform');

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
	return function (...args) {
		if (args.filter(a => Array.isArray(a)).length !== args.length) {
			throw (new TypeError('operands should be same type'));
		}

		if (args.length < 2) {
			throw (new TypeError('minimum 2 operands required'));
		}

		if (args.filter(a => a.length === args[0].length).length !== args.length) {
			throw (new Error('operands should be same length'));
		}

		const inputs = args[0].map((_, index) => {
			return args.map(a => a[index]);
		});

		return pluralArray(input => {
			return fn(...input);
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

	pointFromMat(mat) {
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

	clone(mat) {
		return mat.clone();
	}

	signedMatrix(data) {
		return this._tf.tensor4d([data]);
	}

	getPerspectiveTransform(src, dest) {
		return getPerspectiveTransform({src, dest});
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
		if (Array.isArray(img)) {
			return pluralOperator(this.addNoiseOne.bind(this))(img, noiseImg);
		}

		return this.addNoiseOne(img, noiseImg);
	}

	addNoiseOne(img, noiseImg) {
		return this._tf.tidy(() => {
			const black = this._tf.zerosLike(img, 'int32');
			const white = this._tf.onesLike(img, 'int32').mul(255);
			const res = img.add(noiseImg.toInt()).maximum(black).minimum(white).toInt();
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

		// Tf.concat is not cloning when only one element
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

	perspective(img, {borderValue, borderType, transformationMatrix}) {
		let copyBorderType;
		let copyBorderValue;
		if (borderType === 'transparent') {
			copyBorderType = 'constant';
			copyBorderValue = [0, 0, 0, 0];
		} else {
			copyBorderType = borderType;
			copyBorderValue = borderValue.concat();
		}

		debug(`perspective (${this._tf.memory().numTensors})`);

		if (Array.isArray(copyBorderValue) && copyBorderValue.length === 3) {
			copyBorderValue.push(255);
		}

		return this._tf.tidy(() => {
			const invert = linear.invert(transformationMatrix);

			const flatMatrix = this._tf.tensor2d(invert, [3, 3])
				.mul(1 / invert[2][2])
				.reshape([1, 9])
				.slice([0, 0], [1, 8]);
			// Console.log(flatMatrix.dataSync(), invert, invert[2][2])
			return transform(this._tf, img, flatMatrix, 'bilinear', copyBorderType, null, copyBorderValue);
		});
	}

	_toMat(m) {
		if (Array.isArray(m.shape)) {
			return m;
		}

		if (typeof (m.x) === 'number' &&
			typeof (m.y) === 'number' &&
			typeof (m.z) === 'number') {
			return this._tf.tensor([m.x, m.y, m.z], [3]);
		}

		if (Array.isArray(m)) {
			return this._tf.tensor(m);
		}

		throw (new Error(`Cannot transform ${m} to a tf tensor`));
	}

	matMul(mat1, mat2) {
		return this._tf.tidy(() => {
			return this._toMat(mat1).dot(this._toMat(mat2));
		});
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

	emptyImage() {
		return this._tf.zeros([0, 1, 1, 1]);
	}

	overlay({foregrounds, backgrounds, metadatas}) {
		if (Array.isArray(foregrounds)) {
			return pluralOperator((f, b, m) => {
				return this.overlayOne({foregrounds: f, backgrounds: b, channels: m.channels});
			})(foregrounds, backgrounds, metadatas);
		}

		return this.overlayOne({foregrounds, backgrounds, channels: metadatas[0].channels});
	}

	overlayOne({foregrounds, backgrounds, channels}) {
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

	splitImages(imgs, dispose = false) {
		if (Array.isArray(imgs)) {
			if (imgs.filter(({isDisposedInternal}) => isDisposedInternal).length > 0) {
				throw (new Error('disposed tensors'));
			}

			return imgs;
		}

		if (imgs.shape[0] === 0) {
			return [];
		}

		const res = imgs.split(imgs.shape[0]);
		if (dispose) {
			console.log('split dispose');
			imgs.dispose();
		}

		return res;
	}

	toGrid({gridShape, imageShape, images}) {
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

		return this._tf.tidy(() => {
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
