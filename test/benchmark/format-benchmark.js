const fs = require('fs');

module.exports = function ({filename, title = 'Benchmark', description = 'benchmark of augmenters by backend'}) {
	const file = fs.readFileSync(filename).toString();
	const data = file.split('\n').map(s => {
		// 2019-03-26T08:01:56.539Z image-augmenter:augmenters:sequential Step ResizeAugmenter/tfjs done
		const row = s.split(' ');
		const date = new Date(row[0]);
		const name = row[3];
		const status = row[4];
		const backendKey = name && name.split('/')[1];
		const cstrName = name && name.split('/')[0];
		const res = {
			date,
			backendKey,
			cstrName,
			status,
			name
		};
		return res;
	});

	const uniq = function (arr) {
		return arr.filter((a, index) => arr.indexOf(a) === index);
	};

	const names = uniq(data.filter(({date}) => !isNaN(date)).map(({name}) => name));
	const durations = {};
	// Console.log(names, data.map(({name}) => name))
	names.forEach(name => {
		const _name = name;
		const start = data.filter(({name, status}) => name === _name && status === 'started')[0].date;
		const end = data.filter(({name, status}) => name === _name && status === 'done')[0].date;
		durations[_name] = (end - start);
	});
	const cstrNames = uniq(data.filter(({cstrName}) => Boolean(cstrName)).map(({cstrName}) => cstrName));
	const backendKeys = uniq(data.filter(({backendKey}) => Boolean(backendKey)).map(({backendKey}) => backendKey));
	// Create a markdown table
	const strMd = '## ' + title + '\n\n' +
		description + '\n\n' +
		'| | ' + backendKeys.join(' | ') + ' |\n' +
		Number('|---|') + backendKeys.map(() => '---').join('|') + '|\n' +
		cstrNames.map(cstrName => {
			return '| ' + cstrName + ' | ' + backendKeys.map(key => {
				// Console.log(durations[cstrName+'/'+key], cstrName, key)
				return durations[cstrName + '/' + key] + ' ms';
			}).join(' | ') + ' |';
		}).join('\n');

	return strMd;
};
