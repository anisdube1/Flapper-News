'use strict';

var app = angular.module('flapperNews', ['ui.router']);

app.config([
	'$stateProvider',
	'$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {

		$stateProvider
			.state('home', {
				url: '/home',
				templateUrl: '/home.html',
				controller: 'MainCtrl',
				resolve: {
					postPromise: ['posts', function(posts) {
						return posts.getAll();
					}]
				}
			})
			.state('posts', {
				url: '/posts/{id}',
				templateUrl: '/posts.html',
				controller: 'PostsCtrl',
				resolve: {
					post: ['$stateParams', 'posts', function($stateParams, posts) {
						return posts.get($stateParams.id);
					}]
				}
			})
			.state('login', {
				url: '/login',
				templateUrl: '/login.html',
				controller: 'AuthCtrl',
				onEnter: ['$state', 'auth', function($state, auth) {
					if (auth.isLoggedIn()) {
						$state.go('home');
					}
				}]
			})
			.state('register', {
				url: '/register',
				templateUrl: '/register.html',
				controller: 'AuthCtrl',
				onEnter: ['$state', 'auth', function($state, auth) {
					if (auth.isLoggedIn()) {
						$state.go('home');
					}
				}]
			});

		$urlRouterProvider.otherwise('home');
	}
]);

app.factory('auth', ['$http', '$window', function($http, $window) {
	var auth = {};
	auth.saveToken = function(token) {
		$window.localStorage['flapper-news-token'] = token;
	};

	auth.getToken = function() {
		return $window.localStorage['flapper-news-token'];
	}

	auth.isLoggedIn = function() {
		var token = auth.getToken();

		if (token) {
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.exp > Date.now() / 1000;
		} else {
			return false;
		}
	};

	auth.currentUser = function() {
		if (auth.isLoggedIn()) {
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.username;
		}
	};

	auth.register = function(user) {
		return $http.post('/register', user).success(function(data) {
			auth.saveToken(data.token);
		});
	};

	auth.logIn = function(user) {
		return $http.post('/login', user).success(function(data) {
			auth.saveToken(data.token);
		});
	};

	auth.logOut = function() {
		$window.localStorage.removeItem('flapper-news-token');
	};


	return auth;
}]);

app.factory('posts', ['$http', 'auth', function($http, auth) {
	var o = {
		posts: []
	};
	o.getAll = function() {
		return $http.get('/posts').success(function(data) {
			angular.copy(data, o.posts);
		});
	};
	// o.create = function(post) {
	// 	return $http.post('/posts', post).success(function(data) {
	// 		o.posts.push(data);
	// 	});
	// };
	o.create = function(post) {

		var temp = {headers: {Authorization: 'Bearer ' + auth.getToken()}};
		console.log(temp);

		return $http.post('/posts', post, {
			headers: {
				Authorization: 'Bearer ' + auth.getToken()
			}
		}).success(function(data) {
			console.log("hello");
			o.posts.push(data);
		});
	};
	// o.upvote = function(post) {
	// 	return $http.put('/posts/' + post._id + '/upvote')
	// 		.success(function(data) {
	// 			post.upvotes += 1;
	// 		});
	// };

	o.upvote = function(post) {
		return $http.put('/posts/' + post._id + '/upvote', null, {
			headers: {
				Authorization: 'Bearer ' + auth.getToken()
			}
		}).success(function(data) {
			post.upvotes += 1;
		});
	};


	o.get = function(id) {
		return $http.get('/posts/' + id).then(function(res) {
			return res.data;
		});
	};

	// o.addComment = function(id, comment) {
	// 	return $http.post('/posts/' + id + '/comments', comment);
	// };

	o.addComment = function(id, comment) {
		return $http.post('/posts/' + id + '/comments', comment, {
			headers: {
				Authorization: 'Bearer ' + auth.getToken()
			}
		});
	};


	// o.upvoteComment = function(post, comment) {
	// 	return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote')
	// 		.success(function(data) {
	// 			comment.upvotes += 1;
	// 		});
	// };

	o.upvoteComment = function(post, comment) {
		return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote', null, {
			headers: {
				Authorization: 'Bearer ' + auth.getToken()
			}
		}).success(function(data) {
			comment.upvotes += 1;
		});
	};

	return o;
}]);



app.controller('MainCtrl', [
	'$scope',
	'posts',
	'auth',
	function($scope, posts, auth) {
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.posts = posts.posts;
		// $scope.posts = [{
		// 	title: 'post 1',
		// 	upvotes: 5,
		// 	comments: []
		// }, {
		// 	title: 'post 2',
		// 	upvotes: 2,
		// 	comments: []
		// }, {
		// 	title: 'post 3',
		// 	upvotes: 15,
		// 	comments: []
		// }, {
		// 	title: 'post 4',
		// 	upvotes: 9,
		// 	comments: []
		// }, {
		// 	title: 'post 5',
		// 	upvotes: 4,
		// 	comments: []
		// }];

		// $scope.addPost = function() {
		// 	if (!$scope.title || $scope.title === '') {
		// 		return;
		// 	}
		// 	$scope.posts.push({
		// 		title: $scope.title,
		// 		link: $scope.link,
		// 		upvotes: 0,
		// 		comments: [{
		// 			author: 'Joe',
		// 			body: 'Cool post!',
		// 			upvotes: 0
		// 		}, {
		// 			author: 'Bob',
		// 			body: 'Great idea but everything is wrong!',
		// 			upvotes: 0
		// 		}]
		// 	});
		// 	$scope.title = '';
		// 	$scope.link = '';
		// };

		$scope.addPost = function() {
			if (!$scope.title || $scope.title === '') {
				return;
			}
			posts.create({
				title: $scope.title,
				link: $scope.link,
			});
			$scope.title = '';
			$scope.link = '';
		};

		// $scope.incrementUpvotes = function(post) {
		// 	post.upvotes += 1;
		// };
		$scope.incrementUpvotes = function(post) {
			posts.upvote(post);
		};
		//posts.posts = $scope.posts;
	}
]);

// app.controller('PostsCtrl', [
// 	'$scope',
// 	'$stateParams',
// 	'posts',
// 	function($scope, $stateParams, posts) {
// 		$scope.post = posts.posts[$stateParams.id];
// 		$scope.addComment = function() {
// 			if ($scope.body === '') {
// 				return;
// 			}
// 			$scope.post.comments.push({
// 				body: $scope.body,
// 				author: 'user',
// 				upvotes: 0
// 			});
// 			$scope.body = '';
// 		};
// 		$scope.incrementUpvotes = function(comments) {
// 			comments.upvotes += 1;
// 		};
// 	}
// ]);

app.controller('PostsCtrl', [
	'$scope',
	'posts',
	'post',
	'auth',
	function($scope, posts, post, auth) {
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.post = post;
		// $scope.addComment = function() {
		// 	if ($scope.body === '') {
		// 		return;
		// 	}
		// 	$scope.post.comments.push({
		// 		body: $scope.body,
		// 		author: 'user',
		// 		upvotes: 0
		// 	});
		// 	$scope.body = '';
		// };
		// $scope.incrementUpvotes = function(comments) {
		// 	comments.upvotes += 1;
		// };

		$scope.addComment = function() {
			if ($scope.body === '') {
				return;
			}
			posts.addComment(post._id, {
				body: $scope.body,
				author: 'user',
			}).success(function(comment) {
				$scope.post.comments.push(comment);
			});
			$scope.body = '';
		};

		$scope.incrementUpvotes = function(comment) {
			posts.upvoteComment(post, comment);
		};


	}
]);


app.controller('AuthCtrl', [
	'$scope',
	'$state',
	'auth',
	function($scope, $state, auth) {
		$scope.user = {};

		$scope.register = function() {
			auth.register($scope.user).error(function(error) {
				$scope.error = error;
			}).then(function() {
				$state.go('home');
			});
		};

		$scope.logIn = function() {
			auth.logIn($scope.user).error(function(error) {
				$scope.error = error;
			}).then(function() {
				$state.go('home');
			});
		};
	}
]);


app.controller('NavCtrl', [
	'$scope',
	'auth',
	function($scope, auth) {
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.currentUser = auth.currentUser;
		$scope.logOut = auth.logOut;
	}
]);