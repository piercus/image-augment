const debug = require('debug')('image-augment:backend:opencv4nodejs');

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

class OpenCVBackend {
	constructor(cv) {
		if (!cv) {
			throw (new Error('opencv4nodejs must be provided as input'));
		}

		this._cv = cv;
		this.backendLib = this._cv;
		this.key = 'opencv4nodejs';
	}

	point(x, y) {
		return new this._cv.Point(x, y);
	}

	point2FromMat(mat) {
		return new this._cv.Point(mat.at(0, 0), mat.at(1, 0));
	}

	pointToArray(point) {
		return [point.at(0), point.at(1)];
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
		if (value.length === 4) {
			bgra.push(value[3]);
		}

		return new this._cv.Mat(height, width, this._cv[key], bgra);
	}

	imageToArrayOne(mat) {
		return mat.getDataAsArray();
	}

	// Slice(img, begin, size) {
	// 	const cvRect = new this._cv.Rect(begin[1] || 0, begin[0], size[1] || 0, size[0]);
	// 	const newImage = new this._cv.Mat(cvRect.h, cvRect.w, img.type);
	// 	img.getRegion(cvRect).copyTo(newImage);
	// 	return newImage;
	// }

	imageToArray(mat) {
		return pluralArray(this.imageToArrayOne)(mat);
	}

	isImage(img) {
		if (typeof (img) === 'object' && typeof (img.cols) === 'number' && typeof (img.rows) === 'number') {
			return true;
		}

		return false;
	}

	isImages(imgs) {
		return pluralAny(this.isImage)(imgs);
	}

	isEmptyImage(img) {
		if (img.cols === 0 || img.rows === 0) {
			return true;
		}

		return false;
	}

	isEmptyImages(imgs) {
		return pluralAny(this.isEmptyImage)(imgs);
	}

	resize(image, width, height) {
		return image.resize(height, width);
	}

	drawBoxes(image, boxes, color, thickness = 1) {
		boxes.forEach(box => {
			image.drawRectangle(
				this.point(box[0], box[1]),
				this.point(box[2] + box[0], box[3] + box[1]),
				this._toVec(color, {channels: 3}),
				thickness
			);
		});
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

		if (values.length === 4 && img.channels === 4) {
			return new this._cv.Vec(values[2], values[1], values[0], values[3]);
		}

		if (values.length === 4 && img.channels === 3) {
			return new this._cv.Vec(values[2], values[1], values[0]);
		}

		if (typeof (values) === 'number' && img.channels === 3) {
			return new this._cv.Vec(values, values, values);
		}

		if (typeof (values) === 'number' && img.channels === 4) {
			return new this._cv.Vec(values, values, values, 0);
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

	addNoiseOne(img, noiseImg) {
		const typeSigned = img.channels === 4 ? this._cv.CV_16SC4 : this._cv.CV_16SC3;
		const typeFinal = img.channels === 4 ? this._cv.CV_8UC4 : this._cv.CV_8UC3;

		const img16 = img.convertTo(typeSigned);
		const added = noiseImg.convertTo(typeSigned).add(img16);

		const resImg = added.convertTo(typeFinal);
		return resImg;
	}

	addNoise(imgs, noiseImgs) {
		return pluralOperator(this.addNoiseOne.bind(this))(imgs, noiseImgs);
	}

	addWeighteds(imgs, imgs2, alphas) {
		if (imgs.length !== imgs2.length || imgs.length !== alphas.length) {
			throw (new Error('lenght does not match'));
		}

		return imgs.map((img, i) => {
			return this.addWeighted(imgs[i], imgs2[i], alphas[i]);
		});
	}

	addWeighted(img, img2, alpha) {
		const typeSigned = img.channels === 4 ? this._cv.CV_16SC4 : this._cv.CV_16SC3;
		const typeFinal = img.channels === 4 ? this._cv.CV_8UC4 : this._cv.CV_8UC3;

		const img16 = img.convertTo(typeSigned);
		const added = img2.convertTo(typeSigned).addWeighted(alpha, img16, 1 - alpha, 0);

		const resImg = added.convertTo(typeFinal);
		return resImg;
	}

	blur(img, size) {
		return img.blur(new this._cv.Size(size[0], size[1]));
	}

	dispose() {
		// Do nothing
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
		if (opts.borderType === 'transparent') {
			if (img.channels === 3) {
				img = img.cvtColor(this._cv.COLOR_BGR2BGRA);
			}

			if (img.channels === 4) {
				borderType = this._toBorderType(opts.borderType);
			}
		} else {
			borderType = this._toBorderType(opts.borderType);
		}

		const res = img.warpAffine(opts.affineMatrix, new this._cv.Size(opts.size[0], opts.size[1]), this._cv.INTER_LINEAR, borderType, vec);
		return res;
	}

	perspective(img, opts) {
		const vec = this._toVec(opts.borderValue, {channels: 3});

		let borderType;
		if (img.channels === 4 && opts.borderType === 'transparent') {
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
		if (borders.length !== 4) {
			throw (new Error('should have 4 borders'));
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

	identity(img) {
		return img;
	}

	readImages(filenames) {
		return Promise.all(filenames.map(filename => this.readImage(filename)));
	}

	overlayOne({foreground, background, width, height, channels}) {
		if (channels === 3) {
			return foreground;
		}

		if (channels === 4) {
			debug('overlay with transparency foreground');
			const channels = foreground.splitChannels();
			const a = channels[3].cvtColor(this._cv.COLOR_GRAY2BGR).convertTo(this._cv.CV_32FC3, 1 / 255);
			const white = new this._cv.Mat(height, width, this._cv.CV_8UC3, [1, 1, 1]).convertTo(this._cv.CV_32FC3);
			const inverseA = white.sub(a);
			const b = foreground.cvtColor(this._cv.COLOR_BGRA2BGR).convertTo(this._cv.CV_32FC3);
			const foreW = b.hMul(a);
			debug('overlay, prepare background');
			const formattedBack = (background.channels === 4 ? background.convertTo(this._cv.CV_8UC3).cvtColor(this._cv.COLOR_BGRA2BGR) : background);
			debug('overlay, prepare background');
			const backW = formattedBack.convertTo(this._cv.CV_32FC3).hMul(inverseA);
			// Console.log("overlay a", a.getDataAsArray()[100].slice(50, 60))
			// console.log("overlay inverseA", inverseA.getDataAsArray()[100].slice(50, 60))
			// console.log("overlay back", backW.getDataAsArray()[100].slice(50, 60))
			debug('overlay, add');
			const res = foreW.add(backW).convertTo(this._cv.CV_8UC3);
			debug('overlay, done');
			return res;
		}

		throw (new Error(`invalid channels (${channels})`));
	}

	overlay({foregrounds, backgrounds, metadatas}) {
		return pluralOperator((foreground, background, metadata) => {
			return this.overlayOne({foreground, background, width: metadata.width, height: metadata.height, channels: metadata.channels});
		})(foregrounds, backgrounds, metadatas);
	}

	mergeImages(images) {
		const flatten = function (arr) {
			return arr.reduce((a, b) => {
				return (Array.isArray(a) ? a : [a]).concat((Array.isArray(b) ? b : [b]));
			}, []);
		};

		const res = flatten(images);
		return res;
	}

	writeImage(filename, img) {
		return this._cv.imwriteAsync(filename, img);
	}

	writeImages(filenames, imgs) {
		if (imgs.length !== filenames.length) {
			throw (new Error('array length and filenames lenght should match'));
		}

		return Promise.all(imgs.map((img, i) => this.writeImage(filenames[i], img)));
	}

	writeImagesGrid({filename, gridShape, imageShape, images}) {
		const [w, h] = gridShape;

		const imWidth = imageShape[0];
		const imHeight = imageShape[1];

		const mat = new this._cv.Mat(h * imHeight, w * imWidth, images[0].type);

		images.forEach((img, index) => {
			const colIndex = index % w;
			const rowIndex = Math.floor(index / w);
			const rect = new this._cv.Rect(imWidth * colIndex, imHeight * rowIndex, imWidth, imHeight, 0);
			img.resize(imHeight, imWidth).copyTo(mat.getRegion(rect));
		});
		return this.writeImage(filename, mat);
	}

	imageToBuffer(img) {
		return Promise.resolve(img.getData());
	}

	fliplr(img) {
		return img.flip(1);
	}

	flipud(img) {
		return img.flip(0);
	}

	imagesToBuffer(imgs) {
		return Promise.all(imgs.map(this.imageToBuffer)).then(buffers => {
			return Buffer.concat(buffers);
		});
	}

	splitImages(imgs) {
		return imgs;
	}

	getMetadata(imgs) {
		return imgs.map(img => {
			return {
				width: img.cols,
				height: img.rows,
				channels: img.channels
			};
		});
	}

	absdiffOne(m1, m2) {
		return m1.absdiff(m2);
	}

	absdiff(m1s, m2s) {
		return pluralOperator(this.absdiffOne.bind(this))(m1s, m2s);
	}

	diffOne(m1, m2) {
		return m1.convertTo(this._cv.CV_16SC3).sub(m2.convertTo(this._cv.CV_16SC3));
	}

	diff(m1s, m2s) {
		return pluralOperator(this.diffOne.bind(this))(m1s, m2s);
	}

	norm(m) {
		return pluralArray(this.normOne.bind(this))(m).reduce((a, b) => a + b);
	}

	normOne(m) {
		return m.norm();
	}

	normL1One(m) {
		return m.norm(this._cv.NORM_L1);
	}

	normL1(m) {
		return pluralArray(this.normL1One.bind(this))(m).reduce((a, b) => a + b);
	}

	forEachPixel(m, fn) {
		return m.forEach((mat, bIndex) => {
			mat.getDataAsArray().forEach((row, rIndex) => {
				row.forEach((v, cIndex) => {
					fn(v, bIndex, rIndex, cIndex);
				});
			});
		});
	}
}

module.exports = OpenCVBackend;
