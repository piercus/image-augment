## Benchmark

benchmark of augmenters by backend on a 25 lenna images

See the [benchmark code](../test/benchmark/benchmark.js)

See the [benchmark result image grid](../test/benchmark/output)

| | opencv4nodejs | tfjs |
| AddWeightedAugmenter | 1251 ms | 828 ms |
| AddAugmenter | 1256 ms | 293 ms |
| AdditiveNoiseAugmenter | 206835 ms | 93 ms |
| AffineTransformAugmenter | 22 ms | 1377 ms |
| BlurAugmenter | 26 ms | 484 ms |
| CropAugmenter | 7 ms | 86 ms |
| PadAugmenter | 8 ms | 208 ms |
| ResizeAugmenter | 127 ms | 66 ms |