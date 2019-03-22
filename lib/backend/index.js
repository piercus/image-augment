const OpenCVBackend = require('./opencv-backend');
const TensorflowBackend = require('./tensorflow-backend');

let defaultBackend;

module.exports = {
	getDefault() {
		if (defaultBackend) {
			return defaultBackend;
		}

		return new OpenCVBackend();
	},
	setDefault(def) {
		defaultBackend = def;
	},
	get(k) {
		if (k.version && typeof (k.version.tfjs) === 'string') {
			return new TensorflowBackend(k);
		}

		if (k.version && typeof (k.CV_8U) === 'number') {
			return new OpenCVBackend(k);
		}

		throw (new Error(`invalid backend ${k}`));
	}
};
