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

	// get the path to the controllers dir
	var dirArray = __dirname.split('/');
	dirArray.pop();

	// get the endpoint from the request
	var parts = req.originalUrl.split('/');
	var controller = parts[1] + 'Ctrl.js';
	var method = parts[2].split('?')[0];

	annotation(dirArray.join('/') + '/controllers/' + controller, function(AnnotationReader) {

		try {
			var requiredParams = AnnotationReader.getMethodAnnotations(method);
		}
		catch (e) {
			// there was no annotation
			return next();
		}

		var params = req.method === 'POST' ? req.body.params : req.query,
			missingParams = [];

		requiredParams.forEach(function (requiredParam) {
			if (!params[requiredParam.value]) {
				missingParams.push(requiredParam.value);
			}
		});

		if(missingParams.length) {

			var errorMsg = 'Bad Request: ';

			missingParams.forEach(function (param, index) {
				errorMsg += param + (index !== missingParams.length - 1 ? ', ' : '');
			});

			errorMsg += ' param' + (missingParams.length > 1 ? 's are' : ' is') + ' required.';

			res.header('Access-Control-Allow-Origin', '*');
			res.header('Access-Control-Allow-Headers', 'X-Requested-With, Authorization, token-created-at, Content-Type, Content-Length');

			return res.send(400, errorMsg);

		}
		else {
			return next();
		}
	});

};