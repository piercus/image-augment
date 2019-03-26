# image-augment

WORK IN PROGRESS ...

Augment images (geometric, noise, ...) for visual machine learning data augmentation.

This library has been freely inspired from [imgaug](https://github.com/aleju/imgaug)

It is made to work 
* with [hasard](https://www.npmjs.com/package/hasard) for randomness fine customization
* with 2 different backends :
  * [opencv4nodejs](https://github.com/justadudewhohacks/opencv4nodejs)
  * [tensorflowjs](https://github.com/tensorflow/tfjs)

## Installation

```
npm install image-augment
```
## Simple example

```javascript
// First you need a backend for image processing
// this can be one of the following : 
// * @tensorflow/tfjs 
// * @tensorflow/tfjs-node
// * @tensorflow/tfjs-node-gpu
// * opencv4nodejs

const tf = require('@tensorflow/tfjs-node');

// Then initialize with the backend

const ia = require('image-augment')(tf);

// create an augmentation pipeline
const basicAugmentation = ia.sequential([
	// add a noise with a standard deviation of 15
	ia.additiveNoise(15),
	// rotate 30°
	ia.affineTransform({ rotate: 30 }),
	// add a blur kernel of 3 pixel
	ia.blur(3)
]);

const {images} = basicAugmentation.read({images : inputImages})
```

## Real-life example

```javascript
// First you need a backend for image processing
// this can be one of the following : 
// * @tensorflow/tfjs, 
// * @tensorflow/tfjs-node
// * @tensorflow/tfjs-node-gpu
// * opencv4nodejs

const tf = require('@tensorflow/tfjs-node');

// Then initialize with the backend

const ia = require('image-augment')(tf);

// if you want to customize randomness 
// in your augmentation pipeline
// you need to use 'hasard' library also

const h = require('hasard');

// create an augmentation pipeline
const basicAugmentation = ia.sequential([
	// add a noise
	ia.additiveNoise(15),
	// add a random affine transform
	ia.affineTransform({
		// shear from -15 to 15°
		shear: h.number(-15, 15), 
		// rotate from -30 to 30°
		rotate: h.number(0, 30), 
		 // translate between -10% to + 10% along x and y axis
		translatePercent: h.array({size: 2, value: h.number(-0.1, 0.1)}),
	}),
	// add a blur kernel between 0 and 5
	ia.blur(h.integer(0, 5))
]);

// load images in tensorflow using Jimp and fs 
// (this can be done with any other lib)
const Jimp = require('jimp');
const buffer = fs.readFileSync('lenna.png');
return Jimp.read(buffer).then(imageJimp => {
	
	const images = this._tf.tensor4d(
		new Uint8Array(imageJimp.bitmap.data), 
		[1, imageJimp.bitmap.height, imageJimp.bitmap.width, 4], 
		'int32');
	
	// Now use the augmentation pipeline
	const {images} = basicAugmentation.run({images})
});
```

## Simple example with opencv4nodejs

```javascript

const cv = require('opencv4nodejs');

// Then initialize with the backend

const ia = require('image-augment')(cv);

// create an augmentation pipeline
const basicAugmentation = ia.sequential([
	// add a noise with a standard deviation of 15
	ia.additiveNoise(15),
	// rotate 30°
	ia.affineTransform({ rotate: 30 }),
	// add a blur kernel of 3 pixel
	ia.blur(3)
]);

const img = cv.imread('lenna.png');

const {images} = basicAugmentation.run({images : [img]})
```

## Random Sequence example

```
const ia = require('image-augment');
const h = require('hasard');

// random example images
const sometimes = ((aug) => ia.sometimes({p : 0.5, augmenter: aug}))

const seq = new ia.Sequential({
	steps : [
		ia.fliplr(0.5),
		ia.flipud(0.5),
		sometimes(ia.pad(
				percent: h.array({size: 2, value: h.number(0, 0.1)}),
				borderType: ia.RD_BORDER_TYPE,
				borderValue: h.integer(0, 255)
		)),
		sometimes(ia.crop(h.array({size: 2, value: h.number(-0.05, 0)}))),
		sometimes(new ia.affine({
				// scale images to 80-120% of their size, individually per axis
				scale: h.array([h.number(0.6, 1.2), h.number(0.6, 1.2)]),
				// translate by -20 to +20 percent (per axis)
				translatePercent: h.array([h.number(-0.2, 0.2),h.number(-0.2, 0.2)]), 
				// rotate by -45 to +45 degrees
				rotate: h.number(-45, 45), 
				// shear by -16 to +16 degrees
				shear: h.number(-16, 16), 
				// if borderType is constant, use a random rgba value between 0 and 255
				borderValue: h.array({value: h.integer(0, 255), size: 4}), 
				borderType: ia.RD_BORDER_TYPE
		))
	],
	randomOrder : true
})

const {images} = seq.read(inputImages)
```


## Todo list

[ ] Add benchmark test to measure the speed
[x] Faster random generator using [tensorflow js truncated normal](https://js.tensorflow.org/api/1.0.0/#truncatedNormal)
[x] Get affine transform to work with tensorflow backend
[ ] Faster noise generator
[ ] Add unit test and examples for cropToBox and DrawBoxes
[ ] Generate documentation on github
[ ] Stream API
[ ] add examples/explanations/benchmark in the README.md
[ ] create a demo app running in the browser with tfjs + webgl
[ ] Implement perspective Transform using tensorflowjs backend
[ ] Run all unit tests on Travis