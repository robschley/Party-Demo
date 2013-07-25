
// Load external dependencies.
var express = require('express');
var less = require('less-middleware');
var path = require('path');

// Server variables.
var server;

// Initialize the server.
exports.initialize = function() {

	// Instantiate the express server.
	server = express();

	// Setup basic middleware.
	server.use(express.logger('dev'));
	server.use(express.bodyParser());

	// Setup asset pipeline.
	server.set('views', __dirname + '/../assets/layouts');
	server.set('view engine', 'jade');
	server.use(less({ src: __dirname + '/../assets' }));
	server.use(express.static(__dirname + '/../assets'));

	// Setup error handling middleware.
	server.use(express.errorHandler());

	// Setup session middleware.
	server.use(express.cookieParser('#FrontEndParty'));
	server.use(express.session());

	// Restrict access to API routes.
	server.use('/api/', function(req, res, next) {

		// Check if the user is authenticated.
		if (!req.session.user) {

			// If the request path is for /session, allow the request.
			if (req.path.match(/^\/session$/)) {
				return next();
			}
			else {
				res.json(401, {
					message: 'You must be logged in to access this resource.'
				});
				return;
			}
		}
		// The user is logged in, allow the request.
		else {
			return next();
		}
	});

	// Setup server router.	
	server.use(server.router);

	// Add the server routes.
	require('./routes/resources')(server);
	require('./routes/session')(server);
	require('./routes/index')(server); // This should be last as it has a wildcard route.
};

// Start the server.
exports.listen = function() {

	// Make sure the server is initialized.
	if (!server) {
		throw new Error('The server has not been initialized.');
	}

	// Start the server.
	server.listen(8000, function() {
		console.info('Server listening on port %d', 8000);
	});
};