const gatherNdFill = require('./gather-nd-fill');

const assert = function (cond, fn) {
	if (!cond) {
		throw (new Error(fn()));
	}
};

/**
 * Applies the given transform(s) to the image(s).
 *
 * @param tf tensorflow lib
 * @param img 4d tensor of shape `[batch,imageHeight,imageWidth,depth]`,
 *     where imageHeight and imageWidth must be positive, specifying the
 *     batch of images to transform
 * @param trnsfrms 2d float32 tensor of shape `[batch, 8]` or `[1, 8]`.
 *     Each entry is a projective transform matrix/matrices
 *     If one row of transforms is `[a0, a1, a2, b0, b1, b2, c0, c1]`,
 *     then it maps the output point (x, y) to a transformed input point
 *     `(x', y') = ((a0 x + a1 y + a2) / k, (b0 x + b1 y + b2) / k)`,
 *     where `k = c0 x + c1 y + 1`
 * @param method Optional, string from `'bilinear' | 'nearest'`,
 *     defaults to bilinear, the sampling method
 * @param mode Optional, the extrapolation mode 'constant' or 'replicate'
 *     defaults to `'constant'`
 * @param size Optional, The new size `[newHeight, newWidth]`
 *     defaults to `[imageHeight,imageWidth]`
 * @param fllVl Optional, the value to extrapolate pixel with
 *     in case of mode is 'constant'
 * @return A 4D tensor of the shape `[numBoxes,imageHeight,imageWidth,depth]`
 */
/** @doc {heading: 'Operations', subheading: 'Images', namespace: 'image'} */

module.exports = function (
	tf,
	img,
	trnsfrms,
	method = 'bilinear',
	mode = 'constant',
	size,
	fllVl = [0, 0, 0, 255]
) {
	return tf.tidy(() => {
		const toTensor = function (a) {
			if (a.shape) {
				return a;
			}

			return tf.tensor(a);
		};

		const image = toTensor(img, 'int32');
		const transforms = toTensor(trnsfrms, 'float32');
		const fillValue = toTensor(fllVl, 'int32');

		size = size || [image.shape[1], image.shape[2]];

		assert(
			image.rank === 4,
			() => 'Error in transform: image must be rank 4,' +
						`but got rank ${image.rank}.`);

		assert(
			transforms.rank === 2 &&
				transforms.shape[1] === 8 &&
				(
					transforms.shape[0] === 1 ||
					transforms.shape[0] === image.shape[0]
				),
			() => 'Error in transform: ' +
						`transforms must be have size [${image.shape[0]},8] or [1,8]` +
						`but had shape ${transforms.shape}.`);

		assert(
			size[0] >= 1 && size[1] >= 1,
			() => `size must be atleast [1,1], but was ${size}`);

		assert(
			method === 'bilinear' || method === 'nearest',
			() => `method must be bilinear or nearest, but was ${method}`);

		assert(
			fillValue.rank === 1 && (
				fillValue.shape[0] === 1 ||
				fillValue.shape[0] === image.shape[3] ||
				(fillValue.shape[0] === 3 && image.shape[3] === 4)// Alpha channel will be set to 255
			),
			() => 'Error in transform: fillValue shape must be rank 1, ' +
				`and shape must be 1 or ${image.shape[3]} ` +
				`but had shape ${fillValue.shape}.`);

		// Remark : ImageProjectiveTransformV2 exists in tensorflow's code
		// But is not inside the C API
		// In order to provide a all-environment function
		// current implementation is using linear algebra only
		// in the future it might be a more optimized code to
		// reimplement it when ImageProjectiveTransformV2 will be exposed in C API

		const inputShape = image.shape;
		const nImages = inputShape[0];
		const nChannels = inputShape[3];
		const [outputHeight, outputWidth] = size;

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

		const transformTensorsNHW = [];

		if (transforms.shape[0] === 1) {
			for (let i = 0; i < 8; i++) {
				const t = transforms
					.stridedSlice([0, i], [1, i + 1], [1, 1])
					.expandDims(2)
					.tile([nImages, outputHeight, outputWidth]);

				transformTensorsNHW.push(t);
			}
		} else {
			for (let i = 0; i < 8; i++) {
				const t = transforms
					.stridedSlice([0, i], [nImages, i + 1], [1, 1])
					.expandDims(2)
					.tile([1, outputHeight, outputWidth]);

				transformTensorsNHW.push(t);
			}
		}

		// Formula is
		// `(x', y') = ((a0 x + a1 y + a2) / k, (b0 x + b1 y + b2) / k)`,
		// where `k = c0 x + c1 y + 1`

		const projectionNHW = xOutputNHW
			.mul(transformTensorsNHW[6])
			.add(
				yOutputNHW.mul(transformTensorsNHW[7])
			)
			.add(tf.scalar(1));

		const xFloatInputNHW =
				xOutputNHW
					.mul(transformTensorsNHW[0])
					.add(
						yOutputNHW
							.mul(transformTensorsNHW[1])
					)
					.add(
						transformTensorsNHW[2]
					)
					.div(projectionNHW);

		const yFloatInputNHW =
				xOutputNHW
					.mul(transformTensorsNHW[3])
					.add(
						yOutputNHW
							.mul(transformTensorsNHW[4])
					)
					.add(
						transformTensorsNHW[5]
					)
					.div(projectionNHW);

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

		if (method === 'bilinear') {
			const leftIndicesNHW = xFloatInputNHW.floor();
			const rightIndicesNHW = leftIndicesNHW.add(tf.scalar(1));
			const topIndicesNHW = yFloatInputNHW.floor();
			const bottomIndicesNHW = topIndicesNHW.add(tf.scalar(1));

			// NHWC is output shape and it means [ batch, height, width, channel]
			const topLeftNHWC = getValueFromIndices(
				topIndicesNHW,
				leftIndicesNHW
			);

			const topRightNHWC = getValueFromIndices(
				topIndicesNHW,
				rightIndicesNHW
			);

			const bottomLeftNHWC = getValueFromIndices(
				bottomIndicesNHW,
				leftIndicesNHW
			);

			const bottomRightNHWC = getValueFromIndices(
				bottomIndicesNHW,
				rightIndicesNHW
			);

			const leftDistNHWC = xFloatInputNHW.sub(leftIndicesNHW)
				.expandDims(3).tile([1, 1, 1, nChannels]);

			const topDistNHWC = yFloatInputNHW.sub(topIndicesNHW)
				.expandDims(3).tile([1, 1, 1, nChannels]);

			const rightDistNHWC = tf.scalar(1).sub(leftDistNHWC);

			const valueYFloorNHWC = topLeftNHWC.mul(rightDistNHWC)
				.add(leftDistNHWC.mul(topRightNHWC));

			const valueYCeilNHWC = bottomLeftNHWC.mul(rightDistNHWC)
				.add(leftDistNHWC.mul(bottomRightNHWC));

			return valueYFloorNHWC.mul(tf.scalar(1).sub(topDistNHWC))
				.add(valueYCeilNHWC.mul(topDistNHWC));
		} // Method === 'nearest'

		return getValueFromIndices(
			yFloatInputNHW.round(),
			xFloatInputNHW.round()
		);
	});
};
