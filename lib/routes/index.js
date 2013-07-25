
/**
 * Initialize the module
 *
 * @param  {Express.Server} server The express server.
 */
module.exports = exports = function(server) {

	// Handle layout requests.
	server.get('/layouts/*', function(req, res, next) {
		var layout = req.url.replace(/^\/layouts\//, '').replace(/\.html$/, '');
		res.render(layout, { pretty: true });
	});

	// Handle index requests.
	server.get('*', function(req, res, next) {
		res.render('index', { pretty: true });
	});
};