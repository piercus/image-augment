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
## Simple example with tensorflowjs

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
const basicAugmentation = new ia.Sequential([
	// add a noise with a standard deviation of 15
	new ia.AdditiveNoise(15),
	// rotate 30°
	new ia.AffineTransform({ rotate: 30 }),
	// add a blur kernel of 3 pixel
	new ia.Blur(3)
]);

// 2x2 image in tfjs tensor4d format
const inputImages = tf.tensor4d([
	0,22,3,255,
	20,12,3,255,
	30,22,3,255,
	40,32,3,255
], [1,2,2,4])

const {images} = basicAugmentation.run({images : inputImages})
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
const basicAugmentation = new ia.Sequential([
	// add a noise
	new ia.AdditiveNoise(15),
	// add a random affine transform
	new ia.AffineTransform({
		// shear from -15 to 15°
		shear: h.number(-15, 15), 
		// rotate from -30 to 30°
		rotate: h.number(0, 30), 
		 // translate between -10% to + 10% along x and y axis
		translatePercent: h.array({size: 2, value: h.number(-0.1, 0.1)}),
	}),
	// add a blur kernel between 0 and 5
	new ia.Blur(h.integer(0, 5))
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
const basicAugmentation = new ia.Sequential([
	// add a noise with a standard deviation of 15
	new ia.AdditiveNoise(15),
	// rotate 30°
	new ia.AffineTransform({ rotate: 30 }),
	// add a blur kernel of 3 pixel
	new ia.Blur(3)
]);

const img = cv.imread('lenna.png');

const {images} = basicAugmentation.run({images : [img]})
```

## Todo list

[] Add benchmark test to measure the speed
[x] Faster random generator using [tensorflow js truncated normal](https://js.tensorflow.org/api/1.0.0/#truncatedNormal)
[x] Get affine and perspective transform to work with tensorflow backend
[] Add unit test and examples for cropToBox
[] Generate documentation on github
[] add examples/explanations/benchmark in the README.md
[] create a demo app running in the browser with tfjs + webgl
[] Implement perspective Transform using tensorflowjs backend
[] Draw boxes for tensorflowjs
[] Run all unit tests on Travis