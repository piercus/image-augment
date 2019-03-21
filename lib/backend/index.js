const OpenCVBackend = require('./opencv-backend');
const TensorflowBackend = require('./tensorflow-backend');

let defaultBackend;

module.exports = {
	getDefault() {
		if(defaultBackend){
			return defaultBackend;
		}
		return new OpenCVBackend();
	},
	setDefault(def){
		defaultBackend = def;
	},
	get(k){
		if(k === 'opencv4nodejs'){
			return new OpenCVBackend();
		} else if(k === 'tfjs'){
			return new TensorflowBackend()
		} else if(k.version && typeof(k.version.tfjs) === 'string'){
			return new TensorflowBackend(k)
		} else {
			throw(new Error(`invalid backend ${k}`))
		}
	}
};
