const OpenCVBackend = require('./opencv-backend');

module.exports = {
	getDefault() {
		return new OpenCVBackend();
	},
	get(k){
		if(k === 'opencv4nodejs'){
			return new OpenCVBackend();
		} else if('tensorflow'){
			return new TensorflowBackend()
		}
	}
};
