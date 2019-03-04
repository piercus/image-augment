
class OpenCVBackend {
	constructor() {
		this._cv = require('opencv4nodejs');
	}

	point(x, y) {
		return new this._cv.Point(x, y);
	}

	floatMatrix(data) {
		return new this._cv.Mat(data, this._cv.CV_32F);
	}

	_toVec(values) {
		// Opencv is BGR
		if (values.length === 3) {
			return new this._cv.Vec(values[2], values[1], values[0]);
		}

		return new this._cv.Vec(values[2], values[1], values[0], values[3]);
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

	addNoise(img, {noise, scale}) {
		let noiseImg = new this._cv.Mat(noise, this._cv.CV_16SC4);
		if (scale !== 1) {
			noiseImg = noiseImg.resize(img.rows, img.cols);
		}

		const img16 = img.convertTo(this._cv.CV_16SC4);
		const added = noiseImg.add(img16);
		const resImg = added.convertTo(this._cv.CV_8UC4);
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
		return img.warpAffine(opts.affineMatrix, new this._cv.Size(opts.size[0], opts.size[1]), this._cv.INTER_LINEAR, this._toBorderType(opts.borderType), this._toVec(opts.borderValue));
	}

	perspective(img, opts) {
		return img.warpPerspective(opts.transformationMatrix, new this._cv.Size(opts.size[0], opts.size[1]), this._cv.INTER_LINEAR, this._toBorderType(opts.borderType), this._toVec(opts.borderValue));
	}

	getPerspectiveTransform(src, dest) {
		return this._cv.getPerspectiveTransform(src, dest);
	}

	matMul(mat1, mat2) {
		let m1;
		let m2;
		if (mat1 instanceof this._cv.Mat) {
			m1 = mat1;
		} else if (mat1 instanceof this._cv.Point) {
			m1 = new this._cv.Mat([[mat1.x], [mat1.y], [1]], this._cv.CV_32F);
		} else {
			throw (new TypeError(`${m1} is not a matMul compatible object`));
		}

		if (mat2 instanceof this._cv.Mat) {
			m2 = mat2;
		} else if (mat2 instanceof this._cv.Point) {
			m2 = new this._cv.Mat([[mat2.x], [mat2.y], [1]], this._cv.CV_32F);
		} else {
			throw (new TypeError(`${m2} is not a matMul compatible object`));
		}

		const res = m1.matMul(m2);
		return this.point(
			res.at(0, 0),
			res.at(1, 0)
		);
	}

	pad(img, opts) {
		const {borders} = opts;
		let borderCopyMode;
		let borderCopyValue;
		let img2;
		if (opts.borderType === 'transparent') {
			borderCopyMode = this._cv.BORDER_CONSTANT;
			borderCopyValue = new this._cv.Vec(0, 0, 0, 0);
			if (img.channels === 3) {
				img2 = img.cvtColor(this._cv.COLOR_RGB2RGBA);
			} else {
				img2 = img;
			}
		} else {
			borderCopyMode = this._toBorderType(opts.borderType);
			borderCopyValue = (img.channels === 4 ? new this._cv.Vec(opts.borderValue[0], opts.borderValue[1], opts.borderValue[2], 1) : new this._cv.Vec(opts.borderValue[0], opts.borderValue[1], opts.borderValue[2]));
			img2 = img;
		}

		return img2.copyMakeBorder(borders[2], borders[3], borders[0], borders[1], borderCopyMode, borderCopyValue);
	}

	readImage(filename) {
		const img = this._cv.imread(filename, this._cv.IMREAD_UNCHANGED);
		return img;
	}

	writeImage(filename, img) {
		return this._cv.imwrite(filename, img);
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
}

module.exports = OpenCVBackend;
