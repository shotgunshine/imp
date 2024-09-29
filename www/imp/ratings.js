var IMP = IMP || {};

IMP.ratings = (function() {
	'use strict';

	return function(
		leftDefense, centralDefense, rightDefense,
		midfield,
		leftAttack, centralAttack, rightAttack,
		ispDefense, ispAttack,
		dspProb,
		tacticId, tacticLevel
	) {
		this.leftDefense = leftDefense;
		this.centralDefense = centralDefense;
		this.rightDefense = rightDefense;
		this.midfield = midfield;
		this.leftAttack = leftAttack;
		this.centralAttack = centralAttack;
		this.rightAttack = rightAttack;
		this.ispDefense = ispDefense;
		this.ispAttack = ispAttack;
		this.dspProb = dspProb;
		this.tactics = new Array(9).fill(0);
		this.tactics[tacticId] = tacticLevel;
	}
})();
