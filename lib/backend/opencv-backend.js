
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

	addNoise(img, {noise, scale}) {
		const typeSigned = img.channels === 4 ? this._cv.CV_16SC4 : this._cv.CV_16SC3;
		const typeFinal = img.channels === 4 ? this._cv.CV_8UC4 : this._cv.CV_8UC3;

		let noiseImg = new this._cv.Mat(noise, typeSigned);
		if (scale !== 1) {
			noiseImg = noiseImg.resize(img.rows, img.cols);
		}

		const img16 = img.convertTo(typeSigned);

		const added = noiseImg.add(img16);

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
		return img.warpAffine(opts.affineMatrix, new this._cv.Size(opts.size[0], opts.size[1]), this._cv.INTER_LINEAR, this._toBorderType(opts.borderType), vec);
	}

	perspective(img, opts) {
		const vec = this._toVec(opts.borderValue, {channels: 3});

		return img.warpPerspective(opts.transformationMatrix, new this._cv.Size(opts.size[0], opts.size[1]), this._cv.INTER_LINEAR, this._toBorderType(opts.borderType), vec);
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
