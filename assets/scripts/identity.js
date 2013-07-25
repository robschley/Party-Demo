(function(angular, undefined) {

	// Instantiate the identity module.
	var module = angular.module('PartyIdentity', [
		'ngResource'
	]);

	/**
	 * The Login Replay Queue.
	 */
	function LoginReplayQueue($q) {

		/**
		 * The request queue.
		 *
		 * @type {Array}
		 */
		this.queue = [];

		/**
		 * The processing state.
		 *
		 * @type {Boolean}
		 */
		this.processing = false;

		/**
		 * Add a replay function to the queue.
		 *
		 * @param  {Function} replay A function to execute.
		 *
		 * @return {$q.promise}      A $q promise object.
		 */
		this.add = function(replay) {

			// Create a new deferred operation.
			var deferred = $q.defer();

			// Push the retry function into the queue.
			this.queue.push(function() {

				// Execute the replay function.
				replay().then(deferred.resolve, deferred.reject);
			});

			return deferred.promise;
		};

		/**
		 * Process the queued requests.
		 */
		this.process = function() {

			// Don't allow concurrent processing.
			if (this.processing) {
				return;
			}

			// Start processing.
			this.processing = true;

			// Process each individual request.
			while (this.queue.length) {

				// Replay the individual request.
				(this.queue.shift())();
			}

			// End processing.
			this.processing = false;
		};
	}

	// Register the login replay queue service.
	module.service('LoginReplayQueue', [
		'$q', function($q) {

			// Instantiate a login replay queue.
			return new LoginReplayQueue($q);
		}
	]);

	// Register the login interceptor.
	module.factory('LoginInterceptor', [
		'$injector', '$q', '$rootScope', 'LoginReplayQueue', function($injector, $q, $rootScope, LoginReplayQueue) {

			/**
			 * The Login Interceptor.
			 */
			function LoginInterceptor() {

				var self = this, $http;

				/**
				 * The error handler.
				 *
				 * @param  {Object} response The response object.
				 *
				 * @return {$q.promise}      A promise object that has already been rejected.
				 */
				this.error = function(response)
				{
					// Check if $http is initialized.
					if (!$http) {

						// Lazy load $http to prevent circular references.
						$http = $injector.get('$http');
					}

					// Check if the request requires authentication.
					if (response.status === 401) {

						// Broadcast the login required event.
						$rootScope.$broadcast('partyLoginRequired');

						// Copy the config to avoid closure rewrite.
						var config = angular.extend({}, response.config);

						// Add the request to the queue.
						return LoginReplayQueue.add(function() {
							return $http(config);
						});
					}

					// Reject the request.
					return $q.reject(response);
				};

				/**
				 * The promise wrapper.
				 *
				 * @param  {$q.promise} promise The promise object.
				 *
				 * @return {$q.promise}         Another promise object wrapped with the request interceptor error handler.
				 */
				return function(promise) {
					return promise.then(null, self.error);
				};
			}

			// Instantiate the login interceptor.
			return new LoginInterceptor();
		}
	]);

	// Register the login interceptor.
	module.config([
		'$httpProvider', function($httpProvider) {
			$httpProvider.responseInterceptors.push('LoginInterceptor');
		}
	]);

	// Register the session service.
	module.factory('Session', [
		'$resource', function($resource)
		{
			// Setup the session service.
			var Session = $resource(
				'/api/session',
				{},
				{
					start: {
						method: 'POST'
					},
					destroy: {
						method: 'DELETE'
					}
				}
			);

			return Session;
		}
	]);

	// Register the identity object.
	module.factory('$identity', [
		'$rootScope', 'Session', function($rootScope, Session)
		{
			function Identity()
			{
				var self = this;
				var keys = [];

				/**
				 * @var boolean True if the identity is a guest, false otherwise.
				 */
				this.guest = undefined;

				/**
				 * @var boolean True if the identity is loaded, false otherwise.
				 */
				this.loaded = false;

				/**
				 * Login the identity.
				 *
				 * @param object credentials The credentials object.
				 */
				this.login = function(credentials)
				{
					// Create the session.
					Session.start(credentials, this.loginSuccess, this.loginError);
				};

				/**
				 * Login Success Callback
				 *
				 * @param object data The data returned by the service.
				 */
				this.loginSuccess = function(data)
				{
					// Stash the keys being bound.
					keys = [];
					for (var i in data) {
						if (data.hasOwnProperty(i)) {
							keys.push(i);
						}
					}

					// Bind the identity.
					angular.extend(self, data);

					// Remove guest designation.
					self.guest = false;

					// Mark the identity as loaded.
					self.loaded = true;

					// Broadcast the login success event.
					$rootScope.$broadcast('partyLoginSuccess', self);
				};

				/**
				 * Login Error Callback
				 *
				 * @param object error The error returned by the service.
				 * @return void
				 * @since 1.0
				 */
				this.loginError = function(error)
				{
					// Mark the identity as loaded.
					self.loaded = true;

					// Broadcast the login success event.
					$rootScope.$broadcast('partyLoginError', error.data);
				};

				/**
				 * Logout the identity.
				 *
				 * @return void
				 * @since 1.0
				 */
				this.logout = function()
				{
					// Destroy the session.
					Session.destroy(function()
					{
						// Initialize the identity.
						self.initialize();
					});
				};

				/**
				 * Initialize the identity.
				 *
				 * @return void
				 * @since 1.0
				 */
				this.initialize = function()
				{
					// Initialize basic parameters.
					self.guest = true;

					// Reset the properties bound from the session.
					var key;
					for (key in keys)
					{
						delete self[key];
					}
				};

				// Initialize the identity.
				this.initialize();

				// Get the identity data from the session.
				Session.get(this.loginSuccess, this.loginError);

				// Monitor for the login required event.
				$rootScope.$on('partyLoginRequired', function(event)
				{
					self.loaded = true;
					self.guest = true;
				});
			}

			return new Identity();
		}
	]);

	/**
	 * The Login Form Controller
	 */
	function LoginFormController($scope, $identity, LoginReplayQueue)
	{
		// Initialize the form state.
		$scope.state = {
			submitted: false
		};

		// Initialize the credentials.
		$scope.credentials = {
			username: '',
			password: ''
		};

		// Submit the form.
		$scope.submit = function()
		{
			// Update the form state.
			$scope.state.submitted = true;

			// Attempt to login with the credentials.
			$identity.login($scope.credentials);
		};

		// Monitor for the login success event.
		$scope.$on('partyLoginSuccess', function(event)
		{
			// Update the form state.
			$scope.state.error = null;
			$scope.state.submitted = false;

			// Process the queued requests.
			LoginReplayQueue.process();
		});

		// Monitor for the login error event.
		$scope.$on('partyLoginError', function(event, error)
		{
			// Update the form state.
			$scope.state.error = error;
			$scope.state.submitted = false;
		});
	}

	// Register the login form controller.
	module.controller('LoginFormController', [
		'$scope', '$identity', 'LoginReplayQueue', LoginFormController
	]);

})(angular);