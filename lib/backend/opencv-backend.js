const debug = require('debug')('image-augment:backend:opencv4nodejs');

class OpenCVBackend {
	constructor() {
		this._cv = require('opencv4nodejs');
	}

	point(x, y) {
		return new this._cv.Point(x, y);
	}

	point3(x, y, z) {
		return new this._cv.Point(x, y, z);
	}

	floatMatrix(data) {
		return new this._cv.Mat(data, this._cv.CV_32F);
	}

	signedMatrix(data, channels) {
		const key = 'CV_16SC' + channels;
		return new this._cv.Mat(data, this._cv[key]);
	}
	
	signedMatrixFromSize(width, height, channels, value) {
		const key = 'CV_16SC' + channels;
		const bgra = [value[2], value[1], value[0]];
		if(value.length === 4){
			bgra.push(value[3])
		}
		return new this._cv.Mat(height, width, this._cv[key], bgra);
	}
	imageToArray(mat){
		return mat.getDataAsArray();
	}
	isImage(img){
		if(typeof(img) === 'object' && typeof(img.cols) === 'number' && typeof(img.rows) === 'number'){
			return true
		}
		return false
	}
	isEmptyImage(img){
		if(img.cols === 0 || img.rows === 0){
			return true
		}
		return false
	}
	resize(image, width, height){
		return image.resize(height, width);
	}
	drawBoxes(image, boxes, color, thickness = 1){
		console.log({boxes})
		boxes.forEach(box => {
			image.drawRectangle(
				this.point(box[0], box[1]), 
				this.point(box[2]+box[0], box[3]+box[1]),
				this._toVec(color, {channels: 3}),
				thickness
			)
		})
		return image;
	}
	_toVec(values, img) {
		// Opencv is BGR
		if (values.length === 3 && img.channels === 3) {
			return new this._cv.Vec(values[2], values[1], values[0]);
		}

		if (values.length === 3 && img.channels === 4) {
			return new this._cv.Vec(values[2], values[1], values[0], 0);
		}

		if (values.length === 4) {
			return new this._cv.Vec(values[2], values[1], values[0], values[3]);
		}

		throw (new Error(`Cannot change ${values} to opencv Vec`));
	}

	_toBorderType(str) {
		if (str === 'transparent') {
			return this._cv.BORDER_TRANSPARENT;
		}

		if (str === 'replicate') {
			return this._cv.BORDER_REPLICATE;
		}

		if (str === 'constant') {
			return this._cv.BORDER_CONSTANT;
		}

		throw (new Error(`${str} is not a valid borderType`));
	}

	addNoise(img, noiseImg) {
		const typeSigned = img.channels === 4 ? this._cv.CV_16SC4 : this._cv.CV_16SC3;
		const typeFinal = img.channels === 4 ? this._cv.CV_8UC4 : this._cv.CV_8UC3;

		const img16 = img.convertTo(typeSigned);
		
		const added = noiseImg.convertTo(typeSigned).add(img16);

		const resImg = added.convertTo(typeFinal);
		return resImg;
	}
	
	addWeighted(img, img2, alpha) {
		const typeSigned = img.channels === 4 ? this._cv.CV_16SC4 : this._cv.CV_16SC3;
		const typeFinal = img.channels === 4 ? this._cv.CV_8UC4 : this._cv.CV_8UC3;

		const img16 = img.convertTo(typeSigned);
		const added = img2.convertTo(typeSigned).addWeighted(alpha, img16, 1-alpha, 0);

		const resImg = added.convertTo(typeFinal);
		return resImg;
	}

	blur(img, size) {
		return img.blur(new this._cv.Size(size[0], size[1]));
	}

	crop(img, rect) {
		const cvRect = new this._cv.Rect(rect.x, rect.y, rect.w, rect.h);
		const newImage = new this._cv.Mat(rect.h, rect.w, img.type);
		img.getRegion(cvRect).copyTo(newImage);
		return newImage;
	}

	affine(img, opts) {
		const vec = this._toVec(opts.borderValue, {channels: 3});
		let borderType;
		if(img.channels === 4 && opts.borderType === 'transparent'){
			borderType = this._cv.BORDER_CONSTANT;
		} else {
			borderType = this._toBorderType(opts.borderType);
		}		
		return img.warpAffine(opts.affineMatrix, new this._cv.Size(opts.size[0], opts.size[1]), this._cv.INTER_LINEAR, borderType, vec);
	}

	perspective(img, opts) {
		const vec = this._toVec(opts.borderValue, {channels: 3});
		
		let borderType;
		if(img.channels === 4 && opts.borderType === 'transparent'){
			borderType = this._cv.BORDER_CONSTANT;
		} else {
			borderType = this._toBorderType(opts.borderType);
		}
		
		const res = img.warpPerspective(opts.transformationMatrix, new this._cv.Size(opts.size[0], opts.size[1]), this._cv.INTER_LINEAR, borderType, vec);
		
		return res;
	}

	getPerspectiveTransform(src, dest) {
		return this._cv.getPerspectiveTransform(src, dest);
	}

	matMul(mat1, mat2, type = this._cv.CV_32F) {
		const toMat = m => {
			if (typeof (m.cols) === 'number') {
				return m;
			}

			if (typeof (m.x) === 'number') {
				return new this._cv.Mat([[m.x], [m.y], [1]], type);
			}

			throw (new TypeError(`${m} is not a matMul compatible object`));
		};

		const m1 = toMat(mat1);
		const m2 = toMat(mat2);
		// Console.log(m1.type, m2.type, this._cv.CV_32F, this._cv.CV_64F)
		// console.log(m1, m2)

		// console.log(m1.div)
		return m1.matMul(m2);
	}

	pad(img, opts) {
		const {borders} = opts;
		if(borders.length !== 4){
			throw(new Error('should have 4 borders'))
		}
		let borderCopyMode;
		let borderCopyValue;
		let img2;
		if (opts.borderType === 'transparent') {
			if (img.channels === 3) {
				img2 = img.cvtColor(this._cv.COLOR_RGB2RGBA);
			} else {
				img2 = img;
			}

			borderCopyMode = this._cv.BORDER_CONSTANT;
			borderCopyValue = this._toVec([0, 0, 0], img2);
		} else {
			borderCopyMode = this._toBorderType(opts.borderType);
			borderCopyValue = this._toVec(opts.borderValue, img);
			img2 = img;
		}
		const res = img2.copyMakeBorder(borders[1], borders[3], borders[0], borders[2], borderCopyMode, borderCopyValue);
		return res;
	}
	
	readImage(filename) {
		return this._cv.imreadAsync(filename, this._cv.IMREAD_UNCHANGED);
	}

	overlay({foreground, background, width, height, channels}) {
		
		if (channels === 3) {
			return foreground;
		}

		if (channels === 4) {
			debug('overlay with transparency foreground')
			const channels = foreground.splitChannels();
			const a = channels[3].cvtColor(this._cv.COLOR_GRAY2BGR).convertTo(this._cv.CV_32FC3, 1 / 255);
			const white = new this._cv.Mat(height, width, this._cv.CV_8UC3, [1,1,1]).convertTo(this._cv.CV_32FC3);
			const inverseA = white.sub(a);
			const b = foreground.cvtColor(this._cv.COLOR_BGRA2BGR).convertTo(this._cv.CV_32FC3);
			const foreW = b.hMul(a);
			debug('overlay, prepare background')
			const formattedBack = (background.channels === 4 ? background.convertTo(this._cv.CV_8UC3).cvtColor(this._cv.COLOR_BGRA2BGR) : background);
			debug('overlay, prepare background')
			const backW = formattedBack.convertTo(this._cv.CV_32FC3).hMul(inverseA);
			// console.log("overlay a", a.getDataAsArray()[100].slice(50, 60))
			// console.log("overlay inverseA", inverseA.getDataAsArray()[100].slice(50, 60))
			// console.log("overlay back", backW.getDataAsArray()[100].slice(50, 60))
			debug('overlay, add')
			const res = foreW.add(backW).convertTo(this._cv.CV_8UC3);
			debug('overlay, done')
			return res;
		}

		throw (new Error(`invalid channels (${channels})`));
	}

	writeImage(filename, img) {
		return this._cv.imwriteAsync(filename, img);
	}

	imageToBuffer(img) {
		return img.getData();
	}

	getMetadata(img) {
		return {
			width: img.cols,
			height: img.rows,
			channels: img.channels
		};
	}

	absdiff(m1, m2) {
		return m1.absdiff(m2);
	}

	diff(m1, m2) {
		return m1.convertTo(this._cv.CV_16SC3).sub(m2.convertTo(this._cv.CV_16SC3));
	}

	norm(m) {
		return m.norm();
	}

	normL1(m) {
		return m.norm(this._cv.NORM_L1);
	}

	forEachPixel(m, fn) {
		return m.getDataAsArray().forEach((row, rIndex) => {
			row.forEach((v, cIndex) => {
				fn(v, rIndex, cIndex);
			});
		});
	}
}

module.exports = OpenCVBackend;
