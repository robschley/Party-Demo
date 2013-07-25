(function(angular, undefined) {

	// Instantiate the application module.
	var module = angular.module('PartyApp', [
		'ngResource', 'PartyIdentity', 'ui.state'
	]);

	// Expose components to global scope.
	module.run([
		'$identity', '$rootScope', '$state', function($identity, $rootScope, $state) {

			// Expose the $identity object to the root scope. This has the side-effect of triggering a request to /session.
			$rootScope.$identity = $identity;

			// Expose the $state object to the root scope.
			$rootScope.$state = $state;
		}
	]);

	// Register the Resource service.
	module.factory('PartyResource', [
		'$resource', function($resource) {

			var PartyResource = $resource(
				'/api/resources/:id',
				{
					id: '@id'
				}
			);

			return PartyResource;
		}
	]);

	/**
	 * The Resources Item Controller
	 *
	 * @param {Angular.Scope} $scope   The angular scope for the controller.
	 * @param {Object}        resource The requested resource.
	 */
	function ResourcesItemController($scope, resource) {

		// Bind the resource to the scope.
		$scope.item = resource;
	}

	// Register the Resources Item Controller.
	module.controller('ResourcesItemController', [
		'$scope', 'resource', ResourcesItemController
	]);


	/**
	 * The Resources List Controller
	 *
	 * @param {Angular.Scope} $scope    The angular scope for the controller.
	 * @param {Array}         resources An array of resources to display.
	 */
	function ResourcesListController($scope, resources) {

		// Bind the resources to the scope.
		$scope.list = resources;
	}

	// Register the Resources List Controller.
	module.controller('ResourcesListController', [
		'$scope', 'resources', ResourcesListController
	]);

	// Setup the application routes.
	module.config([
		'$stateProvider', '$locationProvider', '$urlRouterProvider', function($stateProvider, $locationProvider, $urlRouterProvider)
		{
			// Setup the home state.
			$stateProvider.state('home', {
				url: '/',
				views: {
					'content@': {
						templateUrl: '/layouts/home.html'
					},
					'sidebar@': {
						template: '<div class="well"><p>I should put something here.</p></div>'
					}
				}
			});

			// Setup the about state.
			$stateProvider.state('about', {
				url: '/about',
				views: {
					'content@': {
						templateUrl: '/layouts/about.html'
					}
				}
			});

			// Setup the resources base state.
			$stateProvider.state('resources', {
				abstract: true,
				url: '/resources',
				views: {
					'content@': {
						templateUrl: '/layouts/resources.html'
					},
					'sidebar@': {
						template: '<div class="well"><p><img src="/images/lolcat.jpeg" title="lolcat"></p><p>That\'s better.</p></div>'
					}
				}
			});

			// Setup the resources list state.
			$stateProvider.state('resources.list', {
				url: '',
				views: {
					'detail@resources': {
						controller: 'ResourcesListController',
						resolve: {
							'resources': ['PartyResource', function(PartyResource) {
								return PartyResource.query({});
							}]
						},
						templateUrl: '/layouts/resources/list.html'
					}
				}
			});

			// Setup the resources item state.
			$stateProvider.state('resources.item', {
				url: '/:id',
				views: {
					'detail@resources': {
						controller: 'ResourcesItemController',
						resolve: {
							'resource': ['$stateParams', 'PartyResource', function($stateParams, PartyResource) {
								return PartyResource.get($stateParams);
							}]
						},
						templateUrl: '/layouts/resources/item.html'
					}
				}
			});

			// Set the fallback route.
			$urlRouterProvider.otherwise('/');

			// Set the route mode.
			$locationProvider.html5Mode(true);
		}
	]);


})(angular);