## Benchmark

benchmark of augmenters by backend on a 25 lenna images

See the [benchmark code](../test/benchmark/benchmark.js)

See the [benchmark result image grid](../test/benchmark/output)

| | opencv4nodejs | tfjs |
| AddWeightedAugmenter | 1268 ms | 783 ms |
| AddAugmenter | 1242 ms | 291 ms |
| AdditiveNoiseAugmenter | 210206 ms | 86 ms |
| AffineTransformAugmenter | 25 ms | 1379 ms |
| BlurAugmenter | 22 ms | 448 ms |
| CropAugmenter | 5 ms | 125 ms |
| PadAugmenter | 7 ms | 347 ms |
| ResizeAugmenter | 80 ms | 81 ms |