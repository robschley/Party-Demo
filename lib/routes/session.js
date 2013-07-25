
/**
 * Initialize the module
 *
 * @param  {Express.Server} server The express server.
 */
module.exports = exports = function(server) {

	// Handle session retrieval.
	server.get('/api/session', function(req, res, next) {

		// Check if the user has been authenticated.
		if (!req.session.user) {
			return res.json(401, {
				message: 'You must be logged in to access this resource'
			});
		}

		// Send the user object.
		res.json(200, req.session.user);
	});

	// Handle session instantiation.
	server.post('/api/session', function(req, res, next) {

		// Get the username and password.
		var username = req.param('username');
		var password = req.param('password');

		// Check that a username and password were set.
		if (username && password) {

			// Inject the user into the session.
			req.session.user = {
				username: username,
				email: username + '@frontendparty.com'
			};

			// Send the user object.
			res.json(200, req.session.user);
		}
		// No username and password set, reject.
		else {
			res.json(401, {
				message: 'The supplied credentials were invalid'
			});
		}
	});
};
