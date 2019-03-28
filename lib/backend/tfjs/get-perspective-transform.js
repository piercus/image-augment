const linear = require('linear-solve');
/*
 * Inpired from https://github.com/opencv/opencv/blob/master/modules/imgproc/src/imgwarp.cpp#L3019
 *
 * Calculates coefficients of perspective transformation
 * which maps (xi,yi) to (ui,vi), (i=1,2,3,4):
 *
 *      c00*xi + c01*yi + c02
 * ui = ---------------------
 *      c20*xi + c21*yi + c22
 *
 *      c10*xi + c11*yi + c12
 * vi = ---------------------
 *      c20*xi + c21*yi + c22
 *
 * Coefficients are calculated by solving linear system:
 * / x0 y0  1  0  0  0 -x0*u0 -y0*u0 \ /c00\ /u0\
 * | x1 y1  1  0  0  0 -x1*u1 -y1*u1 | |c01| |u1|
 * | x2 y2  1  0  0  0 -x2*u2 -y2*u2 | |c02| |u2|
 * | x3 y3  1  0  0  0 -x3*u3 -y3*u3 |.|c10|=|u3|,
 * |  0  0  0 x0 y0  1 -x0*v0 -y0*v0 | |c11| |v0|
 * |  0  0  0 x1 y1  1 -x1*v1 -y1*v1 | |c12| |v1|
 * |  0  0  0 x2 y2  1 -x2*v2 -y2*v2 | |c20| |v2|
 * \  0  0  0 x3 y3  1 -x3*v3 -y3*v3 / \c21/ \v3/
 *
 * where:
 *   cij - matrix coefficients, c22 = 1
 */

const check4Points = function(points){
	if(points.length !== 4){
		throw(new Error('getPerspectiveTransform should take 4 points as input'));
	}
	points.forEach((p, index) => {
		if(typeof(p) !== 'object' || typeof(p.x) !== 'number' || typeof(p.y) !== 'number'){
			console.log(p)
			throw(new Error(`Each point should be [x1, y1] (current points[${index}] is ${p})`));
		}
	})
};
/**
* @param {Array.<Point>} points 4-points length
* @returns {Array.<Array.<Number>>} matrix 3x3 transformation matrix
*/
module.exports = function({src, dest}){
	check4Points(src);
	check4Points(dest);
	const A = [
		[src[0].x, src[0].y, 1, 0, 0, 0, -src[0].x*dest[0].x, -src[0].y*dest[0].x],
		[src[1].x, src[1].y, 1, 0, 0, 0, -src[1].x*dest[1].x, -src[1].y*dest[1].x],
		[src[2].x, src[2].y, 1, 0, 0, 0, -src[2].x*dest[2].x, -src[2].y*dest[2].x],
		[src[3].x, src[3].y, 1, 0, 0, 0, -src[3].x*dest[3].x, -src[3].y*dest[3].x],
		[0, 0, 0, src[0].x, src[0].y, 1, -src[0].x*dest[0].y, -src[0].y*dest[0].y],
		[0, 0, 0, src[1].x, src[1].y, 1, -src[1].x*dest[1].y, -src[1].y*dest[1].y],
		[0, 0, 0, src[2].x, src[2].y, 1, -src[2].x*dest[2].y, -src[2].y*dest[2].y],
		[0, 0, 0, src[3].x, src[3].y, 1, -src[3].x*dest[3].y, -src[3].y*dest[3].y]
	];

	const B = [
		dest[0].x,
		dest[1].x,
		dest[2].x,
		dest[3].x,
		dest[0].y,
		dest[1].y,
		dest[2].y,
		dest[3].y
	];

	const X = linear.solve(A, B);

	const matrix = [
		[X[0], X[1], X[2]],
		[X[3], X[4], X[5]],
		[X[6], X[7], 1],
	];

	return matrix;
}
