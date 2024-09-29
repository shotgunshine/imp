var IMP = IMP || {};

IMP.binomial = (function() {
	'use strict';

	const _choose = [
		[1],
		[1, 1],
		[1, 2, 1],
		[1, 3, 3, 1],
		[1, 4, 6, 4, 1],
		[1, 5, 10, 10, 5, 1],
		[1, 6, 15, 20, 15, 6, 1],
		[1, 7, 21, 35, 35, 21, 7, 1],
		[1, 8, 28, 56, 70, 56, 28, 8, 1],
		[1, 9, 36, 84, 126, 126, 84, 36, 9, 1],
		[1, 10, 45, 120, 210, 252, 210, 120, 45, 10, 1]
	];

	function _mass(n, k, p) {
		return _choose[n][k] * p**k * (1-p)**(n-k);
	}

	return {
		variable: function(n, p) {
			return Array(n+1).fill().map((x, k) => _mass(n, k, p));
		}
	};
})();
