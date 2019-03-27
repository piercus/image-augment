# image-augment

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

const {images} = basicAugmentation.read('lenna.jpg')

// images is a tensor4d image 
// or a [tensor4d] when output images have different shapes

```

Output is :

<img src='https://raw.githubusercontent.com/piercus/image-augment/master/test/data/tfjs/lenna-example.png'/>

## Grid example with opencv4nodejs

```javascript
const h = require('hasard');
const cv = require('opencv4nodejs');
const ia = require('image-augment')(cv);

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

const image = cv.imread('test/data/opencv4nodejs/lenna.png');

seq.toGrid({images: [image, image, image, image, image, image, image, image]}, {
	filename: 'test/data/opencv4nodejs/lenna-grid.png',
	imageShape: [300, 300],
	gridShape: [4, 2]
});
```

Output :

<img src='https://raw.githubusercontent.com/piercus/image-augment/master/test/data/opencv4nodejs/lenna-grid.png'/>

## Grid Example with tensorflowjs

```javascript
const h = require('hasard');
const tf = require('@tensorflow/tfjs-node');
const ia = require('image-augment')(tf);

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

seq.toGrid(new Array(8).fill('test/data/opencv4nodejs/lenna.png'), {
	filename: 'test/data/tfjs/lenna-grid.png',
	imageShape: [300, 300],
	gridShape: [4, 2]
});
```
Output :

<img src='https://raw.githubusercontent.com/piercus/image-augment/master/test/data/tfjs/lenna-grid.png'/>

## API documentation

See [here](./docs)

## Discussion

### Opencv4nodejs vs Tensorflowjs

Both librairies have advantages, this is what you need to know

Why opencv4nodejs : 
* easier to manipulate files in node.js (cv.imread ...)
* perspective transform function
* Using different image sizes with no impact

Why tensorflowjs : 
* Browser support
* integrate with DL training
* Fast Noise image generation (truncatedNormal)

See [benchmark](./doc/BENCHMARK.md) for more info about performance

## Todo list

Help appreciated, please [open an issue][] if you have any question.

[x] Add benchmark test to measure the speed
[x] Faster random generator using [tensorflow js truncated normal](https://js.tensorflow.org/api/1.0.0/#truncatedNormal)
[x] Get affine transform to work with tensorflow backend
[x] add examples/explanations/benchmark in the README.md
[ ] Run all unit tests on Travis
[ ] Speed up all non-batch implemented tensorflow augmenters
[ ] Generate documentation on github
[ ] Add more augmenters
[ ] Add unit test and examples for cropToBox and DrawBoxes
[ ] Stream API
[ ] create a demo app running in the browser with tfjs + webgl
[ ] Implement perspective Transform using tensorflowjs backend
[ ] Faster noise generator
