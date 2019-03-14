const fs = require('fs')
const Jimp = require('jimp')
const notImplemented = function(str){
	throw new Error(`${str} is not implemented yet for tensorflow backend, please test with opencv4nodejs backend`);
}


class TensorflowBackend {
	constructor() {
		this._tf = require('@tensorflow/tfjs-node');
	}

	point(x, y) {
		return [x,y];
	}

	point3(x, y, z) {
		return [x, y, z];
	}

	floatMatrix(data) {
		return this._tf.tensor4d([data]);
	}

	signedMatrix(data, channels) {
		return this._tf.tensor4d([data]);
	}
	
	signedMatrixFromSize(width, height, channels, value) {
		return this._tf.tidy(() => {
			const one = this._tf.tensor4d(value, [1,1,1,channels])
			return one.tile([1, width, height, 1])
		});
	}
	
	isImage(img){
		if(Array.isArray(img.shape) && img.shape.length === 4){
			return true
		}
		return false
	}
	isEmptyImage(img){
		if(img.size === 0){
			return true
		}
		return false
	}
	resize(image, width, height){
		return this._tf.image.resizeBilinear(image, [height, width]);
	}
	drawBoxes(image, boxes, color, thickness = 1){
		notImplemented('drawBoxes')
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
		return img.mul(alpha).add(imag2.mul((1-alpha)));
	}

	blur(img, size) {
		return this._tf.tidy(() => {
			const r2 = img.div(255);
			const res = this._tf.avgPool(r2, size, 1, 'same');
			return res.mul(255).round().toInt()
		})
	}

	crop(img, rect) {
		const width = img.shape[2];
		const height = img.shape[1];
		const box = [
			rect.y/height,
			rect.x/width,
			(rect.h+rect.y)/height,
			(rect.w+rect.x)/width
		];
		return this._tf.tidy(() => {
			const r2 = img.div(255);
			const res = this._tf.image.cropAndResize(r2, [box], [0], [rect.h, rect.w]);
			return res.mul(255).round().toInt()
		})
	}

	affine(img, {borderValue, borderType, affineMatrix}) {
		notImplemented('affine')
	}

	perspective(img, opts) {
		notImplemented('perspective')
	}

	getPerspectiveTransform(src, dest) {
		notImplemented('getPerspectiveTransform')
	}

	matMul(mat1, mat2, type = this._cv.CV_32F) {
		notImplemented('matMul')
	}

	pad(img, opts) {
		const {borders} = opts;
		let borderCopyMode;
		let borderCopyValue;
		if (opts.borderType === 'transparent') {
			if(img.shape[img.shape.length -1] !== 4){
				throw(new Error('no alpha channel'));
			}
			return img.pad([[0, 0],[borders[1], borders[3]],[borders[0], borders[2]],[0, 0]])
		} else if (opts.borderType === 'constant'){
			if(opts.borderValue && (opts.borderValue[0] !== opts.borderValue[1] || opts.borderValue[0] !== opts.borderValue[2])){
				notImplemented('pad (with non grey constant border)')
			}
			return img.pad([[0, 0],[borders[1], borders[3]],[borders[0], borders[2]],[0, 0]], opts.borderValue[0] || 0)
		} else {
			notImplemented('pad with borderType other than "constant" or "transparent"')
		}
	}

	readImage(filename) {
		const buffer = fs.readFileSync(filename)
		return Jimp.read(buffer).then(imageJimp => {
			return this._tf.tensor4d(new Uint8Array(imageJimp.bitmap.data), [1, imageJimp.bitmap.height, imageJimp.bitmap.width, 4], 'int32');
		});		
	}

	overlay({foreground, background, width, height, channels}) {
		if (channels === 3) {
			return foreground;
		}

		if (channels === 4) {
			const channels = foreground.splitChannels();
			const a = channels[3].cvtColor(this._cv.COLOR_GRAY2BGR).convertTo(this._cv.CV_32FC3, 1 / 255);
			const white = new this._cv.Mat(height, width, this._cv.CV_8UC3, [1,1,1]).convertTo(this._cv.CV_32FC3);
			const inverseA = white.sub(a);
			const b = foreground.cvtColor(this._cv.COLOR_BGRA2BGR).convertTo(this._cv.CV_32FC3);
			const foreW = b.hMul(a);
			
			const backW = background.cvtColor(this._cv.COLOR_BGRA2BGR).convertTo(this._cv.CV_8UC3).convertTo(this._cv.CV_32FC3).hMul(inverseA);
			// console.log("overlay a", a.getDataAsArray()[100].slice(50, 60))
			// console.log("overlay inverseA", inverseA.getDataAsArray()[100].slice(50, 60))
			// console.log("overlay back", backW.getDataAsArray()[100].slice(50, 60))

			const res = foreW.add(backW).convertTo(this._cv.CV_8UC3);
			return res;
		}

		throw (new Error(`invalid channels (${channels})`));
	}

	writeImage(filename, img) {
		const shape = img.shape;
		return this.imageToBuffer(img).then(buffer => {
			const width = shape[2]
			const height = shape[1]
			return new Promise((resolve, reject) => {
				new Jimp(width, height, (err, image) => {
					if(err){
						return reject(err)
					}
					image.bitmap.data = buffer;	
					resolve(image)
				});
			})
		}).then(image => {
			return image.getBufferAsync(Jimp.MIME_PNG)
		}).then(buf => {
			return new Promise((resolve, reject) => {
				fs.writeFile(filename, buf, (err) => {
					if(err){
						return reject(err)
					}
					resolve()
				})
			})
		})
	}

	imageToBuffer(img) {
		return img.data().then(d => {
			return new Buffer(new Uint8Array(d).buffer);
		})
	}

	getMetadata(img) {
		const shape = img.shape;

		return {
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
	imageToArray(mat){
		return mat.arraySync();
	}
	forEachPixel(m, fn) {
		return m.arraySync()[0].forEach((row, rIndex) => {
			row.forEach((v, cIndex) => {
				fn(v, rIndex, cIndex);
			});
		});
	}
}

module.exports = TensorflowBackend;
