const h = require('hasard');
const GaussianNoiseGenerator = require('./gaussian-noise');
/**
* Truncated normal noise
* When used with tfjs, this noise generator is much faster than
* other (poisson, gaussian) generators
* It is because it is using the `tf.truncatedNormal` function
* from tensorflowjs whereas other function uses CPU
*
* @param {Object | Number | Hasard} sigma options, if number, this is sigma
* @param {Number} [sigma.mean=0] `mean` of the gaussian distribution
* @param {Number} sigma.sigma `sigma` of the gaussian distribution
* @param {Number} [sigma.scale=1] if `scale` is defined (0 < scale < 1), then the noise can apply at a less granular scale
* @param {Number} [sigma.perChannel=false] If perChannel is true, then the sampled values may be different per channel (and pixel).
* @example
// Simple usage
new ia.TruncatedNormalNoiseGenerator(3);
* @example
//Simple usage with random variable
*new ia.TruncatedNormalNoiseGenerator(h.number(0, 3));
* @example
// Explicit usage with random variable
new ia.TruncatedNormalNoiseGenerator({
	sigma: 3,
	scale: 0.5,
	perChannel: true,
	mean: 5
});
* @example
// Explicit usage with random variable
new ia.TruncatedNormalNoiseGenerator({
	sigma: h.integer(0, 3),
	scale: h.number(0.2, 1),
	perChannel: h.boolean(),
	mean: h.number(-5, 5)
});
*/
class TruncatedNormalNoiseGenerator extends GaussianNoiseGenerator {

	buildHasard(o) {
		if(typeof(this.backend.truncatedNormal) === 'function'){
				
			const imagesProps = h.array({
				size: o.nImages,
				value : h.object({
					perChannel: this.perChannel, 
					mean: this.mean, 
					scale: this.scale, 
					sigma: this.sigma
				})
			});
			
			const isHasardScale = h.isHasard(this.scale);
			const isHasardPerChannel = h.isHasard(this.scale);
			
			const getMatrixesPerChannelFixed = ({perChannel, means, stds, scales, nImages}) => {
				
				if(nImages === 0){
					return this.backend.zeros([nImages, o.height, o.width, o.channels])
				}
				
				const shape = isHasardScale ? 
					[nImages, o.height, o.width] : 
					[1, Math.round(o.height*scales[0]), Math.round(o.width*scales[0])];

				if(perChannel){
					shape.push(o.channels)
				}
				
				const shape1 = [nImages].concat(new Array(shape.length - 1).fill(1));
				const meanMatrix = this.backend.tile(
					this.backend.reshape(means, shape1),
					[1].concat(shape.slice(1))
				);
				
				const stdMatrix = this.backend.tile(
					this.backend.reshape(stds, shape1),
					[1].concat(shape.slice(1))
				);
				
				let mat = this.backend.truncatedNormal(shape);
				mat = mat.mul(stdMatrix).add(meanMatrix)
				if(!perChannel){
					mat = mat.expandDims(3).tile([1,1,1,o.channels])
				}
				
				if(isHasardScale){
					const boxes = scales.map(s => [0,0,s,s]);
					const boxInd = scales.map((_, index) => index);
					return this.backend.cropAndResize(mat, boxes, boxInd, [o.height, o.width])
				} else {
					return this.backend.resize(mat, o.width, o.height)
				}
			}

			return h.fn(imageProps => {
				const perChannels = imageProps.map(({perChannel}) => perChannel);
				if(!isHasardPerChannel){
					const images = getMatrixesPerChannelFixed({
						perChannel: perChannels[0],
						means: imageProps.map(({mean}) => mean),
						stds: imageProps.map(({sigma}) => sigma),
						scales: imageProps.map(({scale}) => scale),
						nImages: imageProps.length
					})
					return {images}
				} else {
					const indexesPerChannels = perChannels
						.map((value, index) => ({value, index}))
						.filter(({value}) => value)
						.map(({index}) => index);
					
					const perChannelProps = imageProps.filter((_, index) => indexesPerChannels.indexOf(index) !== -1);
					
					const perChannelsMatrixes = getMatrixesPerChannelFixed({
						perChannel: true,
						means: perChannelProps.map(({mean}) => mean),
						stds: perChannelProps.map(({sigma}) => sigma),
						scales: perChannelProps.map(({scale}) => scale),
						nImages: perChannelProps.length
					}).unstack();
					
					const notPerChannelProps = imageProps.filter((_, index) => indexesPerChannels.indexOf(index) === -1);
					
					const notPerChannelsMatrixes = getMatrixesPerChannelFixed({
						perChannel: false,
						means: notPerChannelProps.map(({mean}) => mean),
						stds: notPerChannelProps.map(({sigma}) => sigma),
						scales: notPerChannelProps.map(({scale}) => scale),
						nImages: notPerChannelProps.length
					}).unstack();
					const tensorsReordered = imageProps.map(im => {
						let index = perChannelProps.indexOf(im);
						if(index === -1){
							index = notPerChannelProps.indexOf(im);
							return notPerChannelsMatrixes[index];
						} else {
							return perChannelsMatrixes[index];
						}
					});
					const images = this.backend.stack(tensorsReordered)
					return { images };
				}
			})(imagesProps)
		} else {
			return super.buildHasard(o);
		}
	}
	
	getHasardPixelValue() {
		return h.round(h.number({
			type: 'truncated-normal',
			mean: this.mean,
			std: this.sigma
		}));
	}
}
module.exports = TruncatedNormalNoiseGenerator;
