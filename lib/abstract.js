const hasard = require('hasard');
const backends = require('./backend');
const debug = require('debug')('image-augment');

class AbstractImageAugment {
	constructor(opts) {
		this.backend = opts.backend ? backends.get(opts.backend) : backends.getDefault();
		this._name = this.constructor.name;
	}
	
	static setDefaultBackend(backend){
		backends.setDefault(backend);
	}
	
	static isGenerator(o) {
		return (typeof (o) === 'object' && o._generator);
	}

	static isAugmenter(o) {
		return (typeof (o) === 'object' && o._augmenter);
	}

	toSize2(opt) {
		const fn = function (size) {
			if (typeof (size) === 'number') {
				return [size, size];
			}

			if (Array.isArray(size)) {
				if (size.length === 2) {
					return size;
				}

				throw new Error(`${size} whould be a length-2 array or a number`);
			}
		};

		if (hasard.isHasard(opt)) {
			return hasard.fn(fn)(opt);
		}

		return fn(opt);
	}

	toSize4(opt) {
		const fn = function (size) {
			if (typeof (size) === 'number') {
				return [size, size, size, size];
			}

			if (Array.isArray(size)) {
				if (size.length === 2) {
					return [size[0], size[1], size[0], size[1]];
				}

				if (size.length === 4) {
					return size;
				}

				throw new Error(`${size} should be a number, a length-2 or a lenght-4 array`);
			}
		};

		if (hasard.isHasard(opt)) {
			return hasard.fn(fn)(opt);
		}

		return fn(opt);
	}
	toColor(opt) {
		const fn = function (size) {
			if (typeof (size) === 'number') {
				return [size, size, size];
			}

			if (Array.isArray(size)) {
				if (size.length === 3) {
					return size;
				}
				if (size.length === 4) {
					return size;
				}
			}
			throw new Error(`${size} should be a number or a length-3 or 4 array`);			
		};

		if (hasard.isHasard(opt)) {
			return hasard.fn(fn)(opt);
		}

		return fn(opt);
	}	
}

module.exports = AbstractImageAugment;
