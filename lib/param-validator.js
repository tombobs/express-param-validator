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
	var url = require('url');
	var fs = require('fs');

	var urlObj = url.parse(req.protocol + '://' + req.get('host') + req.originalUrl);
	var urlWithPath = urlObj.href.replace(urlObj.search, '');

	// get the path to the controller
	var dirArray = __dirname.split('/');
	dirArray.splice(dirArray.length - 3, 3);	// cd to project root

	var parts = urlWithPath.split('/');
	var controllerPath = dirArray.join('/') + '/controllers/' + parts[parts.length - 2] + 'Ctrl.js';
	var endpoint = parts[parts.length - 1];

	// handle case where endpoint is controllerName/ but the final / is not supplied.
	if(!fs.existsSync(controllerPath)) {
		controllerPath = dirArray.join('/') + '/controllers/' + parts[parts.length - 1] + 'Ctrl.js';
		endpoint = '';
	}

	return fs.exists(controllerPath, function (exists) {
		if(!exists) {
			console.log('Cannot find controller at ' + controllerPath + '. Does it exist?')
			return next();
		}
		else {
			annotation(controllerPath, function(AnnotationReader) {

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
		}
	});

};