var config = {};

module.exports = function (conf) {
	if (!conf || (typeof conf !== 'object')) {
		throw new Error('config object is required');
	}
	config = conf;
};

module.exports.validateRequestParams = function (req, res, next) {

	// don't validate the pre-flight request
	if(req.method === 'OPTIONS') {
		return next();
	}

	var annotation = require('annotation');

	var dirArray = __dirname.split('/');
	dirArray.splice(dirArray.length - 3, 3);	// cd to project root

	// get the endpoint from the request
	var parts = req.originalUrl.split('/');
	var controller = parts[1] + 'Ctrl.js';
	var endpoint = parts[2].split('?')[0];

	annotation(dirArray.join('/') + '/controllers/' + controller, function(AnnotationReader) {

		try {
			var requiredParams = AnnotationReader.getMethodAnnotations(endpoint);
		}
		catch (e) {
			// there was no annotation
			return next();
		}

		var params = req.method === 'POST' ? req.body : req.query;
		var missingParams = [];

		requiredParams.forEach(function (requiredParam) {
			if (!params[requiredParam.value]) {
				missingParams.push(requiredParam.value);
			}
		});

		if(missingParams.length) {
			res.header('Access-Control-Allow-Origin', '*');
			return res.send(400, 'Bad Request - Missing Params: ' + missingParams.join(', '));
		}
		else {
			return next();
		}
	});

};