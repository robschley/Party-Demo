
/**
 * Initialize the module
 *
 * @param  {Express.Server} server The express server.
 */
module.exports = exports = function(server) {

	// Setup the resources.
	var resources = [
		{
			id: 1,
			title: 'AngularJS.org API Documentation',
			description: 'Use the API Reference documentation when you need more information about a ' +
				'specific feature.',
			url: 'http://docs.angularjs.org/api/'
		},
		{
			id: 2,
			title: 'AngularJS.org Tutorial',
			description: 'A great way to get introduced to AngularJS is to work through this tutorial, ' +
				'which walks you through the construction of an AngularJS web app.',
			url: 'http://docs.angularjs.org/tutorial/index'
		},
		{
			id: 3,
			title: 'AngularJS.org Developer Guide',
			description: 'An extensive guide that takes you through the major concepts of AngularJS.',
			url: 'http://docs.angularjs.org/guide/'
		}
	];

	// Get a list of resources.
	server.get('/api/resources', function(req, res, next) {
		res.json(200, resources);
	});

	// Get a single resource.
	server.get('/api/resources/:id', function(req, res, next) {

		// Get the resource id.
		var id = req.param('id');

		// The resource container.
		var resource;

		// Find the resource by id.
		resources.every(function(item) {
			if (item.id == id) {
				resource = item;
				return false;
			} else {
				return true;
			}
		});

		// Check if the resource was found.
		if (resource) {
			res.json(200, resource);
		}
		// The resource was not found.
		else {
			res.json(404, {
				message: 'The requested resource could not be found.'
			});
		}
	});
};