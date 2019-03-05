const backends = require('../../lib/backend');

module.exports = function (t, Cstr, {
	input, 
	output, 
	options, 
	inputPoints,
	outputPoints,
	expectImg,
	backend = backends.getDefault()
}) {
	const inst = new Cstr(options);
	const img = backend.readImage(input);
	const res = inst.runOnce({img});
	
	return Promise.resolve()
		.then(() => {
			if(!output){
				t.pass()
				return Promise.resolve()
			}
			const expected = backend.readImage(output);
			
			const data2 = backend.imageToBuffer(expected);
			t.true(backend.imageToBuffer(res.img).equals(data2));
			return Promise.resolve()
		})
		.then(() => {
			if(!expectImg){
				t.pass()
				return Promise.resolve()
			}
			expectImg(t, img, res.img, backend)
		})
		.then(() =>{
			if(!inputPoints && !outputPoints){
				t.pass()
				return Promise.resolve()
			} 
			const width = img.cols;
			const height = img.rows;
			const toSize = ([x,y]) => ([x*width, y*height])
			const res = inst.runOnce({img, points: inputPoints.map(toSize)});
			
			const expected = outputPoints.map(toSize).map(a => backend.point(...a));
			const tolerance = 1e-6*(width+height)/2;
			res.points.forEach((p, index) => {
				//console.log({actual: p.x, expected: expected[index].x, res: Math.abs(p.x - expected[index].x) < tolerance})
				t.true(Math.abs(p.x - expected[index].x) < tolerance)
				t.true(Math.abs(p.y - expected[index].y) < tolerance)
			});
			
		})
	

};
