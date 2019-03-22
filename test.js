const tf = require('@tensorflow/tfjs-node-gpu');
const m = tf.tensor2d([2,0,0,2], [2,2]);
const b = tf.tensor2d([128 , 128], [2,1]);
m.dot(b)