const gatherNdFill = require('./gather-nd-fill');

module.exports = function (tf, img, paddings, mode, fillValue) {
	return tf.tidy(() => {
		const inputShape = img.shape;
		const nImages = inputShape[0];
		const [inputHeight, inputWidth] = inputShape.slice(1, 3);
		const [outputHeight, outputWidth] = [
			inputHeight + paddings[1][0] + paddings[1][1],
			inputWidth + paddings[2][0] + paddings[2][1]
		];

		// NHW means  [ batch, height, width]
		const xOutputNHW = tf.range(0, outputWidth)
			.transpose()
			.expandDims(0).expandDims(0)
			.tile([nImages, outputHeight, 1]);

		// NHW means  [ batch, height, width]
		const yOutputNHW = tf.range(0, outputHeight)
			.expandDims(0).expandDims(2)
			.tile([nImages, 1, outputWidth]);

		const batchOutputNHW = tf.range(0, nImages)
			.expandDims(1).expandDims(2)
			.tile([1, outputHeight, outputWidth]);

		const xFloatInputNHW = xOutputNHW.sub(paddings[2][0]);
		const yFloatInputNHW = yOutputNHW.sub(paddings[1][0]);

		const getValueFromIndices = (
			yIntInputNHW,
			xIntInputNHW
		) => {
			// NHWI means [ batch, height, width, indice]
			const indicesNHWI = batchOutputNHW
				.expandDims(3)
				.concat([
					yIntInputNHW.expandDims(3),
					xIntInputNHW.expandDims(3)
				], 3);

			return gatherNdFill(tf, img, indicesNHWI.toInt(), [outputHeight, outputWidth], mode, fillValue);
		};

		return getValueFromIndices(
			yFloatInputNHW.round(),
			xFloatInputNHW.round()
		);
	});
};
