const OpenCVBackend = require('./opencv-backend');

module.exports = {
	getDefault() {
		return new OpenCVBackend();
	}
};
