[![Build Status](https://travis-ci.com/piercus/image-augment.svg?branch=master)](https://travis-ci.com/piercus/image-augment)

[![codecov](https://codecov.io/gh/piercus/image-augment/branch/master/graph/badge.svg)](https://codecov.io/gh/piercus/image-augment)

## Installation

```
npm install image-augment
```

## Description

Image augmentation library for machinie learning in javascript.

This library has been freely inspired from [imgaug](https://github.com/aleju/imgaug)

It is using [hasard](https://www.npmjs.com/package/hasard) for random variable manipulation.
Currently the only backend available is [opencv4nodejs](https://github.com/justadudewhohacks/opencv4nodejs).

Future work : 
* add more augmenters
* make it work in the browser with tensorflowjs (without opencv4nodejs)

Please open issues if you want a specific augmenter/backend compatibilty

## Simple Usage

```javascript
const ia = require('image-augment');
const cv = require('opencv4nodejs');

const image = cv.readImage('lena.png');

const blurred = ia.blur({ kernel: 3 }).runOnce({image: img})

cv.writeImage('lena-blurred-3x3.png');
```
| Input | Output |
|---|---|
| <img src="./test/data/lena.png"/> | <img src="./test/data/lena-blurred-3x3.png"/> |

## Simple Usage with a random variable

All parameters can be set as random variables using [hasard](https://www.npmjs.com/package/hasard) library

```javascript
const ia = require('image-augment');
const hasard = require('hasard');
const cv = require('opencv4nodejs');

const image = cv.readImage('filename.png');

const blurred = ia.blur({ kernel: h.integer([0,10]) }).run({image: img, number : 5})

cv.writeImage('output.png');
```

| Input | Output |
|---|---|
| <img src="./test/data/lena.png"/> | <img src="./test/data/lena-blurred-3x3.png"/> |


This library has been freely inspired from [imgaug](https://github.com/aleju/imgaug)

It is made to work with [hasard](https://www.npmjs.com/package/hasard) and [opencv4nodejs](https://github.com/justadudewhohacks/opencv4nodejs)

# image-augment


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