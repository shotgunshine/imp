var IMP = IMP || {};

IMP.predictor = (function() {
	'use strict';

	const PRESSING = 1;
	const CA = 2;
	const AIM = 3;
	const AOW = 4;
	const LS = 8;
	const LS_SCORING = 800;

	function _chanceDistribution(midfieldHome, midfieldAway) {
		if (midfieldHome < midfieldAway) {
			return midfieldHome**2 / midfieldAway**2 / 2
		} else {
			return 1 - (midfieldAway**2 / midfieldHome**2 / 2);
		}
	}

	function _scoringChance(attack, defense) {
		let ratio = attack / (attack + defense);
		return 0.875 * Math.tanh(10.55 * ratio**4.32);
	}

	function _tacticEfficacy(tacticId, tacticLevel) {
		if (tacticId == PRESSING) {
			return 0.40 * Math.tanh(tacticLevel**2.4 / 302);
		} else if (tacticId == CA) {
			return 0.43 * Math.tanh(tacticLevel**1.8 / 130);
		} else if (tacticId == AIM) {
			return 0.27 * Math.tanh(tacticLevel**2 / 166);
		} else if (tacticId == AOW) {
			return 0.38 * Math.tanh(tacticLevel**2 / 125);
		} else if (tacticId == LS) {
			return 0.39 * Math.tanh(tacticLevel**1.4 / 50);
		} else if (tacticId == LS_SCORING) {
			return 0.65 * Math.tanh(tacticLevel**2.8 / 3200);
		} else {
			return 0;
		}
	}

	return {
		chanceDistribution: _chanceDistribution,
		scoringChance: _scoringChance,
		tacticEfficacy: _tacticEfficacy,

		avgScoringChance: function(home, away) {
			let wingsChance = _scoringChance(home.rightAttack, away.leftDefense);
			wingsChance += _scoringChance(home.leftAttack, away.rightDefense);
			let wingsWeight = 0.52 * (1 - _tacticEfficacy(AIM, home.tactics[AIM]));
			wingsWeight += 0.36 * _tacticEfficacy(AOW, home.tactics[AOW]);
			wingsChance *= wingsWeight / 2;
			let middleChance = _scoringChance(home.centralAttack, away.centralDefense);
			let middleWeight = 0.36 * (1 - _tacticEfficacy(AOW, home.tactics[AOW]));
			middleWeight += 0.52 * _tacticEfficacy(AIM, home.tactics[AIM]);
			middleChance *= middleWeight;
			let lsConversion = _tacticEfficacy(LS, home.tactics[LS]);
			let lsScoring = _tacticEfficacy(LS_SCORING, home.tactics[LS]);
			let meanChance = (wingsChance + middleChance)*(1 - lsConversion) + lsConversion * lsScoring;
			meanChance += 0.08 * home.dspProb;
			meanChance += 0.04 * _scoringChance(home.ispAttack, away.ispDefense);
			return meanChance;
		},

		prediction: function(
			chanceProbHome,
			pressingProb,
			scoringProbHome,
			scoringProbAway,
			counterProbHome,
			counterProbAway
		) {
			let scores = Array(16).fill().map(() => Array(16).fill(0));

			let chanceDist = IMP.binomial.variable(5, chanceProbHome);
			let pressing = Array(11).fill().map((x, n) => IMP.binomial.variable(n, pressingProb));
			let scoringHome = Array(11).fill().map((x, n) => IMP.binomial.variable(n, scoringProbHome));
			let scoringAway = Array(11).fill().map((x, n) => IMP.binomial.variable(n, scoringProbAway));
			let counterHome = Array(11).fill().map((x, n) => IMP.binomial.variable(n, counterProbHome));
			let counterAway = Array(11).fill().map((x, n) => IMP.binomial.variable(n, counterProbAway));

			for (let homeExcl = 0; homeExcl <= 5; homeExcl++) {
			for (let awayExcl = 0; awayExcl <= 5; awayExcl++) {
			for (let homeShrd = 0; homeShrd <= 5; homeShrd++) {
			for (let homePrss = 0; homePrss <= homeExcl + homeShrd; homePrss++) {
			for (let awayPrss = 0; awayPrss <= awayExcl + 5 - homeShrd; awayPrss++) {
			for (let homeGoal = 0; homeGoal <= homeExcl + homeShrd - homePrss; homeGoal++) {
			for (let awayGoal = 0; awayGoal <= awayExcl + 5 - homeShrd - awayPrss; awayGoal++) {
			for (let homeCA = 0; homeCA <= awayExcl + 5 - homeShrd - awayPrss - awayGoal; homeCA++) {
			for (let homeCAGoal = 0; homeCAGoal <= homeCA; homeCAGoal++) {
			for (let awayCA = 0; awayCA <= homeExcl + homeShrd - homePrss - homeGoal; awayCA++) {
			for (let awayCAGoal = 0; awayCAGoal <= awayCA; awayCAGoal++) {
				let prob = chanceDist[homeExcl];
				prob *= chanceDist[5 - awayExcl];
				prob *= chanceDist[homeShrd];
				prob *= pressing[homeExcl + homeShrd][homePrss];
				prob *= pressing[awayExcl + 5 - homeShrd][awayPrss];
				prob *= scoringHome[homeExcl + homeShrd - homePrss][homeGoal];
				prob *= scoringAway[awayExcl + 5 - homeShrd - awayPrss][awayGoal];
				prob *= counterHome[awayExcl + 5 - homeShrd - awayPrss - awayGoal][homeCA];
				prob *= scoringHome[homeCA][homeCAGoal];
				prob *= counterAway[homeExcl + homeShrd - homePrss - homeGoal][awayCA];
				prob *= scoringAway[awayCA][awayCAGoal];

				scores[homeGoal + homeCAGoal][awayGoal + awayCAGoal] += prob;
			}}}}}}}}}}}

			return scores;
		}
	};
})();
