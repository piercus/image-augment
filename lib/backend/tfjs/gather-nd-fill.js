// This function is getting values from images when indices
// are inside the input image
// or from fillValue when indices are outside the input image
/**
*
*
* @params {Tensorflow} tf
* @params {Tensor4D} images
* @params {Tensor4D} indicesNHWI
* @params {Array.<Number>} outputSize [newHeight, newWidth]
* @params {String} [mode='constant'] 'constant' | 'replicate'
* @params {Array.<number>} [fillValue=[0, 0, 0, 255]] used when mode is 'constant'
*/
const gatherNdFill = (tf, images, indicesNHWI, outputSize, mode = 'constant', fillValue = [0, 0, 0, 255]) => {
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

		const l = outputSize[0] * outputSize[1] * 3;
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
};

module.exports = gatherNdFill;
