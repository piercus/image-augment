const fs = require('fs');
const Jimp = require('jimp');
const padGeneric = require('./tfjs/pad-generic')
const transform = require('./tfjs/transform')

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

class TensorflowBackend {
	constructor(tf) {
		this._tf = tf;
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
	
	point2FromMat(mat){
		const res = mat.dataSync()
		if(mat.shape[0] === 3){
			return {
				x: res[0],
				y: res[1],
				z: res[2]
			}
		} else {
			return {
				x: res[0],
				y: res[1]
			}
		}
	}
	pointToArray(pt){
		if(typeof(pt.x) === 'number' && 
			typeof(pt.y) === 'number' && 
			typeof(pt.z) === 'number'){
				
			return [pt.x, pt.y, pt.z];
		} else {
			return [pt.x, pt.y];
		}
	}
	signedMatrix(data, channels) {
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

	drawBoxes(image, boxes, color, thickness = 1) {
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
		const black = this._tf.zerosLike(img);
		const white = this._tf.onesLike(img).mul(255);
		return img.add(noiseImg).maximum(black).minimum(white);
	}

	addWeighted(img, img2, alpha) {
		return img.mul(alpha).add(img2.mul((1 - alpha)));
	}

	blur(img, size) {
		return this._tf.tidy(() => {
			const r2 = img.div(255);
			const res = this._tf.avgPool(r2, size, 1, 'same');
			return res.mul(255).round().toInt();
		});
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
		// we need to inverse affineMatrix
		// based on https://stackoverflow.com/questions/2624422/efficient-4x4-matrix-inverse-affine-transform
		// we do 
		// affineMatrix = [[m (2x2), b (2x1)], [0 (2x1), 1 (1x1)]]
		// inv(affineMatrix) = [[inv(m) (2x2), -inv(m).b (2x1) ], [0 (2x1), 1 (1x1)]]
		
		const m = affineMatrix.slice([0,0],[2,2]);
		const b = affineMatrix.slice([0,2],[2,1]);
		const [m1, m2, m3, m4] = m.dataSync();
		const det = (m1*m4 - m2*m3);
		if(det === 0){
			throw(new Error('cannot inverse this affine matrix'));
		}
		const invM = this._tf.tensor2d([m4/det, -1*m2/det, -1*m3/det, m1/det], [2,2]);
		const b2 = invM.dot(b).mul(-1)
		
		const formated = invM.concat(b2, 1).reshape([1,6]).concat(this._tf.zeros([1,2]), 1);
		let copyBorderType;
		let copyBorderValue;
		if(borderType === 'transparent'){
			copyBorderType = 'constant';
			copyBorderValue = [0, 0, 0, 0];
		} else {
			copyBorderType = borderType;
			copyBorderValue = borderValue.concat();
		}
		
		if(Array.isArray(copyBorderValue) && copyBorderValue.length === 3){
			copyBorderValue.push(255);
		}
		
		return transform(this._tf, img, formated, 'bilinear', copyBorderType, null, copyBorderValue);
	}

	perspective(img, opts) {
		notImplemented('perspective');
	}

	getPerspectiveTransform(src, dest) {
		notImplemented('getPerspectiveTransform');
	}

	matMul(mat1, mat2) {
		if(typeof(mat2.x) === 'number' && 
			typeof(mat2.y) === 'number' && 
			typeof(mat2.z) === 'number'){
			
			return mat1.dot(this._tf.tensor([mat2.x, mat2.y, mat2.z], [3]));
		} else {
			return mat1.dot(mat2);
		}
		
	}

	pad(img, opts) {
		const {borders} = opts;
		let borderCopyMode;
		let borderCopyValue;
		
		const bordersPadding = [[0, 0], [borders[1], borders[3]], [borders[0], borders[2]], [0, 0]];
		if (opts.borderType === 'transparent') {
			if (img.shape[img.shape.length - 1] !== 4) {
				throw (new Error('no alpha channel'));
			}

			return img.pad(bordersPadding);
		}
		let fillValue = (Array.isArray(opts.borderValue) ? 
			opts.borderValue : 
			(typeof(opts.borderValue) === 'number' ? [opts.borderValue] : [0])
		).concat();
		
		if(fillValue.length === 1){
			fillValue = [fillValue, fillValue, fillValue];
		}
		if(fillValue.length === 3){
			fillValue.push(255)
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
			return this._tf.concat(tensors, 0);
		});
	}

	overlay({foreground, background, width, height, channels}) {
		if (channels === 3) {
			return foreground;
		}

		if (channels === 4) {
			const channels = this._tf.split(foreground, 4, 3);

			const a = channels[3].div(this._tf.scalar(255)).tile([1, 1, 1, 4]);
			const white = this._tf.onesLike(foreground);
			const inverseA = white.sub(a);
			// Const b = foreground.cvtColor(this._cv.COLOR_BGRA2BGR).convertTo(this._cv.CV_32FC3);
			const foreW = foreground.mul(a);
			const backW = background.mul(inverseA);
			// Console.log("overlay a", a.getDataAsArray()[100].slice(50, 60))
			// console.log("overlay inverseA", inverseA.getDataAsArray()[100].slice(50, 60))
			// console.log("overlay back", backW.getDataAsArray()[100].slice(50, 60))

			const res = foreW.add(backW);
			return res;
		}

		throw (new Error(`invalid channels (${channels})`));
	}

	writeImage(filename, img) {
		let {shape} = img;
		if (shape[3] === 3) {
			const alpha = this._tf.ones(img.shape.slice(0, -1)).expandDims(3).mul(255);
			img = img.concat(alpha, 3);
			shape = img.shape;
		}

		if (shape[3] === 1) {
			const alpha = this._tf.ones(img.shape.slice(0, -1)).expandDims(3).mul(255);
			img = img.tile([1, 1, 3]).concat(alpha, 3);
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

	splitImages(imgs) {
		return Array.isArray(imgs) ? imgs : imgs.split(imgs.shape[0]);
	}

	writeImages(filenames, imgs) {
		const array = this.splitImages(imgs);
		if (array.length !== filenames.length) {
			throw (new Error('array length and filenames lenght should match'));
		}

		return Promise.all(array.map((img, i) => this.writeImage(filenames[i], img)));
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
	
	// slice(img, begin, size) {
	// 	return img.slice(begin, size);
	// }
	
	getMetadata(imgs) {
		if (Array.isArray(imgs)) {
			return imgs.map(this.getMetadataOne).reduce((a, b) => {
				return Object.assign({}, a, {
					nImages: a.nImages + b.nImages
				});
			});
		}

		return this.getMetadata([imgs]);
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
		return m1.sub(m2).abs();
	}

	diff(m1, m2) {
		return m1.sub(m2);
	}

	norm(m) {
		return m.norm().dataSync()[0];
	}

	normL1(m) {
		return m.norm(1).dataSync()[0];
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
		})

	}

	truncatedNormal(shape, mean, std) {
		return this._tf.truncatedNormal(shape, mean, std);
	}
	
	reshape(image, shape){
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
