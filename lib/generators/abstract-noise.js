const h = require('hasard');
const AbstractGenerator = require('./abstract');

class AbstractNoise extends AbstractGenerator {
	constructor(o) {
		super(o);
		const {scale = 1, perChannel = false} = o;
		this.scale = scale;
		this.perChannel = perChannel;
	}

	getHasardPixelValue() {
		throw (new Error('override me'));
	}

	buildHasard({width, height, channels}) {
		const scaleRef = h.reference(this.scale);

		const hasardPixelValue = this.getHasardPixelValue();

		const hasardPixelValueRef = h.reference({
			source: hasardPixelValue,
			context: 'colorPixel'
		});

		const matrix = h.matrix({
			shape: h.array([
				h.round(h.multiply(scaleRef, width)),
				h.round(h.multiply(scaleRef, height))
			]),
			contextName: 'image',
			value: h.if(this.perChannel,
				h.array({
					values: channels === 4 ? [hasardPixelValue, hasardPixelValue, hasardPixelValue, 255] : [hasardPixelValue, hasardPixelValue, hasardPixelValue]
				}),
				h.array({
					values: channels === 4 ? [hasardPixelValueRef, hasardPixelValueRef, hasardPixelValueRef, 255] : [hasardPixelValueRef, hasardPixelValueRef, hasardPixelValueRef],
					contextName: 'colorPixel'
				})
			)
		});

		return h.fn(values => {
			const mat = this.backend.resize(this.backend.signedMatrix(values, channels), width, height);
			return {image: mat};
		})(matrix);
	}
}

module.exports = AbstractNoise;
