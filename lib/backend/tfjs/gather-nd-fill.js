
/**
* This function is getting values from images when indices
* are inside the input image
* or from fillValue when indices are outside the input image
* @ignore
* @param {Tensorflow} tf tensorflow lib
* @param {Tensor4D} images tensorflow 4d image tensor
* @param {Tensor4D} indicesNHWI indices in `[batch, height, width, indices]` shape
* @param {Array.<Number>} outputSize [newHeight, newWidth]
* @param {String} [mode='constant'] 'constant' | 'replicate'
* @param {Array.<number>} [fillValue=[0, 0, 0, 255]] used when mode is 'constant'
* @returns {Tensor4D} tensor tensor with shape `[batch, height, width, channels]`
*/
const gatherNdFill = (tf, images, indicesNHWI, outputSize, mode = 'constant', fillValue = [0, 0, 0, 255]) => {
	return tf.tidy(() => {
		const inputShape = images.shape;
		const outputShape = [inputShape[0], outputSize[0], outputSize[1], inputShape[3]];

		// NHWI means [ batch, height, width, indice]
		const maxTensorNHWI = tf.tensor1d(inputShape.slice(0, -1).map(a => a - 1), 'int32')
			.expandDims(0).expandDims(0).expandDims(0)
			.tile(outputShape.slice(0, -1).concat([1]));

		const zeroTensorNHWI = tf.zeros(outputShape.slice(0, -1).concat([3]), 'int32');

		const greaterMaskNHWI = indicesNHWI.greater(maxTensorNHWI);
		const lessMaskNHWI = indicesNHWI.less(zeroTensorNHWI);

		if (mode === 'replicate') {
			// When indices are outside of input's shape, we replace them
			// by max or min
			const indiceOrReplicateNHWI = zeroTensorNHWI.where(
				lessMaskNHWI,
				maxTensorNHWI.where(greaterMaskNHWI, indicesNHWI)
			);

			return tf.gatherND(images, indiceOrReplicateNHWI.toInt());
		}

		if (mode === 'constant') {
			const maskNHWI = greaterMaskNHWI.logicalOr(lessMaskNHWI);
			// When indices are outside of input's shape, we replace them by 0
			// this is arbitrary choice but is not impacting final result
			// since we eventually replace the channel values by fill Values
			const indiceOrZeroNHWI = zeroTensorNHWI.where(maskNHWI, indicesNHWI);

			const resBeforeFillNHWC = tf.gatherND(images, indiceOrZeroNHWI.toInt());

			const fillValueTensor = Array.isArray(fillValue) ? tf.tensor1d(fillValue) : fillValue;

			const fillTensorNHWC = fillValueTensor.toInt()
				.reshape([1, 1, 1, outputShape[outputShape.length - 1]])
				.tile(outputShape.slice(0, -1).concat([1]));

			const maskNHWC = maskNHWI
				.any(3)
				.expandDims(3)
				.tile([1, 1, 1, inputShape[3]]);

			return fillTensorNHWC.where(maskNHWC, resBeforeFillNHWC);
		}

		throw (new Error(`mode "${mode}" is not valid`));
	});
};

module.exports = gatherNdFill;
