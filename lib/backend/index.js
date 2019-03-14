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
		} else if('tfjs'){
			return new TensorflowBackend()
		}
	}
};
