const h = require('hasard');
const tf = require('@tensorflow/tfjs-node');
const ia = require('../..')(tf);
const filesToImages = require('../helpers/files-to-images');

// Random example images
const sometimes = (aug => h.value([aug, ia.identity()]));

const seq = ia.sequential({
	steps: [
		ia.fliplr(0.5),
		ia.flipud(0.5),
		ia.pad({
			percent: h.array({size: 2, value: h.number(0, 0.1)}),
			borderType: ia.RD_BORDER_TYPE,
			borderValue: h.integer(0, 255)
		}),
		sometimes(ia.crop({
			percent: h.array({size: 2, value: h.number(0, 0.1)})
		})),
		sometimes(ia.affine({
			// Scale images to 80-120% of their size, individually per axis
			scale: h.array([h.number(0.6, 1.2), h.number(0.6, 1.2)]),
			// Translate by -20 to +20 percent (per axis)
			translatePercent: h.array([h.number(-0.2, 0.2), h.number(-0.2, 0.2)]),
			// Rotate by -45 to +45 degrees
			rotate: h.number(-45, 45),
			// Shear by -16 to +16 degrees
			shear: h.number(-16, 16),
			// If borderType is constant, use a random rgba value between 0 and 255
			borderValue: h.array({value: h.integer(0, 255), size: 4}),
			borderType: ia.RD_BORDER_TYPE
		}))
	],
	randomOrder: true
});

filesToImages(new Array(8).fill('test/data/opencv4nodejs/lenna.png'), seq.backend).then(images => {
	seq.toGrid({images}, {
		filename: 'test/data/tfjs/lenna-grid.png',
		imageShape: [300, 300],
		gridShape: [4, 2]
	});
});

