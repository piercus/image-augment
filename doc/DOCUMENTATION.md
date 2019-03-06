# [image-augment](https://github.com/piercus/image-augment#readme) *0.0.1*

> Image augmentation library for machine learning in javascript.


### lib/augmenters/abstract.js


#### runOnce() 







##### Properties

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |



##### Returns


- `Void`



#### run(o) 

Run the augmenter




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| o | `OneRunOption` `Number` `Array.<OneRunOption>` `MultipleRunOptions`  | options | &nbsp; |




##### Returns


- `Void`




### lib/augmenters/additive-gaussian-noise.js


#### new AdditiveGaussianNoiseAugmenter(sigma) 

Adds noise sampled from a gaussian distribution




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| sigma | `Object` `Number` `Hasard`  | options, if number, this is sigma | &nbsp; |
| sigma.mean&#x3D;0 | `Number`  | `mean` of the gaussian distribution | *Optional* |
| sigma.sigma | `Number`  | `sigma` of the gaussian distribution | &nbsp; |
| sigma.scale&#x3D;1 | `Number`  | if `scale` is defined (0 < scale < 1), then the noise can apply at a less granular scale | *Optional* |
| sigma.perChannel&#x3D;false | `Number`  | If perChannel is true, then the sampled values may be different per channel (and pixel). | *Optional* |




##### Examples

```javascript
// Simple usage
new ia.AdditiveGaussianNoise(3);
```
```javascript
//Simple usage with random variable
new ia.AdditiveGaussianNoise(h.integer(0, 3));
```
```javascript
// Explicit usage with random variable
new ia.AdditiveGaussianNoise({ 
	sigma: 3,
	scale: 0.5,
	perChannel: true,
	mean: 5
});
```
```javascript
// Explicit usage with random variable
new ia.AdditiveGaussianNoise({ 
	sigma: h.integer(0, 3),
	scale: h.number(0.2, 1),
	perChannel: h.boolean(),
	mean: h.number(-5, 5)
});
```


##### Returns


- `Void`




### lib/augmenters/additive-poisson-noise.js


#### new AdditivePoissonNoiseAugmenter(opts) 

Adds noise sampled from a poisson distribution




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| opts | `Object`  | options | &nbsp; |
| opts.lambda | `Number`  | `lambda` is the exponent of the poisson distribution | &nbsp; |
| opts.scale&#x3D;1 | `Number`  | if `scale` is defined (0 < scale < 1), then the noise can apply at a less granular scale | *Optional* |
| opts.perChannel&#x3D;false | `Number`  | If perChannel is true, then the sampled values may be different per channel (and pixel). | *Optional* |




##### Returns


- `Void`




### lib/augmenters/affine-transform.js


#### new AffineTransformAugmenter(opts[, keepSize&#x3D;false]) 

Applies affine transformations to images.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| opts | `Object`  | options | &nbsp; |
| opts.scale&#x3D; | `ArrayXY`  | [0,0]] Scales (>1=zoom in, <1=zoom out), | *Optional* |
| opts.translatePercent | `ArrayXY`  | = [0,0]] translates | *Optional* |
| opts.scale | `ArrayXY`  | = [1,1]] scale percent | *Optional* |
| opts.rotate&#x3D;0 | `NumberArgument`  | degrees of rotation | *Optional* |
| opts.shear&#x3D;0 | `NumberArgument`  | degrees of shear | *Optional* |
| keepSize&#x3D;false | `BooleanArgument`  | If true, the output image plane size will be fitted to the distorted image size, i.e. images rotated by 45deg will not be partially outside of the image plane. | *Optional* |
| opts.borderValue&#x3D;0,0,0 | `ColorArgument`  | if borderType is "constant" this is used as border pixel values | *Optional* |
| opts.borderType&#x3D;&quot;constant&quot; | `BorderTypeArgument`  | "constant", "replicate", "transparent" | *Optional* |




##### Returns


- `Void`




### lib/augmenters/blur.js


#### new BlurAugmenter(opts) 

Add blur to the image




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| opts | `Object` `Number` `Hasard`  | kernel size or explict options | &nbsp; |
| opts.kernel | `ArrayXY`  | kernel size, ([x,y]) or n (for square kernel) | &nbsp; |




##### Examples

```javascript
new ia.Blur(3);
```
```javascript
new ia.Blur(h.integer(0, 3));
```
```javascript
new ia.Blur({ kernel: h.integer(0, 3) });
```
```javascript
new ia.Blur({ kernel: 3 });
```


##### Returns


- `Void`




### lib/augmenters/crop.js


#### new CropAugmenter(opts) 

Add blur to the image




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| opts | `Object`  | options | &nbsp; |
| opts.percent | `ArraylRTB`  | percent of cropping to do | &nbsp; |




##### Returns


- `Void`




### lib/augmenters/custom.js


#### new CustomAugmenter() 

Extend this class to add custom augmenters






##### Returns


- `Void`




### lib/augmenters/pad.js


#### new PadAugmenter(opts) 

Add padding to the image




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| opts | `Object`  | options | &nbsp; |
| opts.percent | `ArraylRTB`  | size of padding in percent | &nbsp; |
| opts.borderValue&#x3D;0,0,0 | `ColorArgument`  | if borderType is "constant" this is used as border pixel values | *Optional* |
| opts.borderType&#x3D;&quot;constant&quot; | `BorderTypeArgument`  | "constant", "replicate", "transparent" | *Optional* |




##### Returns


- `Void`




### lib/augmenters/perspective-transform.js


#### new PerspectiveTransformAugmenter(opts) 

Applies a random four-point perspective transform to the image (kinda like an advanced form of cropping).
Each point has a random distance from the image corner, derived from a normal distribution with sigma `sigma`.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| opts | `Object`  | options | &nbsp; |
| opts.sigma | `NumberArgument`  | the sigma of the normal distribution | &nbsp; |
| opts.keepSize | `BooleanArgument`  | If `keepSize` is set to True (default), each image will be resized back to its original size. | &nbsp; |
| opts.borderValue&#x3D;0,0,0 | `ColorArgument`  | if borderType is "constant" this is used as border pixel values | *Optional* |
| opts.borderType&#x3D;&quot;constant&quot; | `BorderTypeArgument`  | can be "constant", "replicate", "transparent" | *Optional* |
| opts.cornersVariation&#x3D;null | `Array.<Array.<Number>>`  | if set, sigma is not used. For more deterministic behavior, use this to set manually the percent (x,y) variation of each corner | *Optional* |




##### Returns


- `Void`




### lib/augmenters/resize.js


#### new ResizeAugmenter(opts) 

Resize the image




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| opts | `Object`  | options | &nbsp; |
| opts.size | `ArrayXY`  | size of the result image | &nbsp; |




##### Returns


- `Void`




### lib/augmenters/sequential.js


#### new Sequential(opts) 

Build a sequence of actions




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| opts | `Object`  | options | &nbsp; |
| opts.steps | `Array.<ImageAugment>` `Hasard.<Array.<ImageAugment>>`  | steps to be run in sequence | &nbsp; |




##### Returns


- `Void`




*Documentation generated with [doxdox](https://github.com/neogeek/doxdox).*
