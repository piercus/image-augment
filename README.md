# image-augment

This library has been freely inspired from [imgaug](https://github.com/aleju/imgaug)

It is made to work with [hasard](https://www.npmjs.com/package/hasard)

## Simple Example

```javascript
const ia = require('image-augment');

// random example images
const images = new Array(50).fill(1).map( () => {
	return new ia.RandomImage({
		width: 128
		height: 128
	});
};

const sometimes = ((aug) => ia.sometimes({p : 0.5, augmenter: aug}))

const seq = new ia.Sequential({
	sequence : [
		new ia.Fliplr({p: 0.5}),
		new ia.Flipud({p: 0.5}),
		sometimes(new ia.CropAndPad(
				p:[-0.05, 0.1],
				padMode:ia.ALL,
				padCval: [0, 255]
		)),
		sometimes(new ia.Affine({
				scale:{"x": [0.8, 1.2], "y": [0.8, 1.2]},// scale images to 80-120% of their size, individually per axis
				translate_percent:{"x": [-0.2, 0.2], "y": [-0.2, 0.2]}, // translate by -20 to +20 percent (per axis)
				rotate:[-45, 45], // rotate by -45 to +45 degrees
				shear:[-16, 16], // shear by -16 to +16 degrees
				order:[0, 1], // use nearest neighbour or bilinear interpolation (fast)
				cval:[0, 255], // if mode is constant, use a cval between 0 and 255
				mode:ia.ALL // use any of scikit-image's warping modes (see 2nd image from the top for examples)
		))
	],
	randomOrder : true
})

augmented = seq.augmentImagesAsync(images)
```