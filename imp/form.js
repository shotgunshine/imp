var IMP = IMP || {};

IMP.form = (function() {
	'use strict';

	const _formSide = {
		home: 'home',
		away: 'away'
	};

	function _getRatings(team) {
		return new IMP.ratings(
			Number(document.getElementById(team + '_ld').value - 0.75),
			Number(document.getElementById(team + '_cd').value - 0.75),
			Number(document.getElementById(team + '_rd').value - 0.75),
			Number(document.getElementById(team + '_mf').value - 0.75),
			Number(document.getElementById(team + '_la').value - 0.75),
			Number(document.getElementById(team + '_ca').value - 0.75),
			Number(document.getElementById(team + '_ra').value - 0.75),
			Number(document.getElementById(team + '_sd').value - 0.75),
			Number(document.getElementById(team + '_sa').value - 0.75),
			Number(document.getElementById(team + '_sp').value) / 100,
			Number(document.getElementById(team + '_tc').value),
			Number(document.getElementById(team + '_tl').value)
		);
	}

	function _setRatings(team, ratings) {
		document.getElementById(team + '_ld').value = (0.75 + ratings.leftDefense).toFixed(2);
		document.getElementById(team + '_cd').value = (0.75 + ratings.centralDefense).toFixed(2);
		document.getElementById(team + '_rd').value = (0.75 + ratings.rightDefense).toFixed(2);
		document.getElementById(team + '_mf').value = (0.75 + ratings.midfield).toFixed(2);
		document.getElementById(team + '_la').value = (0.75 + ratings.leftAttack).toFixed(2);
		document.getElementById(team + '_ca').value = (0.75 + ratings.centralAttack).toFixed(2);
		document.getElementById(team + '_ra').value = (0.75 + ratings.rightAttack).toFixed(2);
		document.getElementById(team + '_sd').value = (0.75 + ratings.ispDefense).toFixed(2);
		document.getElementById(team + '_sa').value = (0.75 + ratings.ispAttack).toFixed(2);
		document.getElementById(team + '_sp').value = ratings.dspProb * 100;
		document.getElementById(team + '_tc').value = 0;
		document.getElementById(team + '_tl').value = 0;
		ratings.tactics.forEach((tacticLevel, tacticId) => {
			if (tacticLevel > 0) {
				document.getElementById(team + '_tc').value = tacticId;
				document.getElementById(team + '_tl').value = tacticLevel;
			}
		});
		document.dispatchEvent(new Event('setRatings'));
	}

	function _saveRatings(team) {
		let a = document.createElement("a");
		a.href = "data:text/json;charset=utf-8," + JSON.stringify(_getRatings(team));
		a.download = new Date().toISOString() + ".imp";
		document.body.appendChild(a).click();
	}

	function _loadRatings(fileInputField, team) {
		fileInputField.files[0].text().then(file => JSON.parse(file)).then(ratings => {
			_setRatings(team, ratings);
		});
	}

	function _flipRatings(team) {
		let ratings = _getRatings(team);
		let rightDefense = ratings.rightDefense;
		let rightAttack = ratings.rightAttack;
		ratings.rightDefense = ratings.leftDefense;
		ratings.rightAttack = ratings.leftAttack;
		ratings.leftDefense = rightDefense;
		ratings.leftAttack = rightAttack;
		_setRatings(team, ratings);
	}

	function _updateSector(sector, probability) {
		let label = document.querySelector(`[for="${sector}"] > span`);
		label.textContent = Math.round(100 * probability) + "%";
	}

	function _updateLiveProbabilities(home, away) {
		let h = _getRatings(home);
		let a = _getRatings(away);
		_updateSector(`${home}_ld`, (1 - IMP.predictor.scoringChance(a.rightAttack, h.leftDefense)));
		_updateSector(`${home}_cd`, (1 - IMP.predictor.scoringChance(a.centralAttack, h.centralDefense)));
		_updateSector(`${home}_rd`, (1 - IMP.predictor.scoringChance(a.leftAttack, h.rightDefense)));
		_updateSector(`${home}_mf`, IMP.predictor.chanceDistribution(h.midfield, a.midfield));
		_updateSector(`${home}_ra`, IMP.predictor.scoringChance(h.rightAttack, a.leftDefense));
		_updateSector(`${home}_ca`, IMP.predictor.scoringChance(h.centralAttack, a.centralDefense));
		_updateSector(`${home}_la`, IMP.predictor.scoringChance(h.leftAttack, a.rightDefense));
		_updateSector(`${home}_sa`, IMP.predictor.scoringChance(h.ispAttack, a.ispDefense));
		_updateSector(`${home}_sd`, (1 - IMP.predictor.scoringChance(a.ispAttack, h.ispDefense)));
	}

	return {
		getHomeRatings: function() {
			return _getRatings(_formSide.home);
		},
		getAwayRatings: function() {
			return _getRatings(_formSide.away);
		},
		saveHomeRatings: function() {
			_saveRatings(_formSide.home);
		},
		saveAwayRatings: function() {
			_saveRatings(_formSide.away);
		},
		loadHomeRatings: function(file) {
			_loadRatings(file, _formSide.home);
		},
		loadAwayRatings: function(file) {
			_loadRatings(file, _formSide.away);
		},
		flipHomeRatings: function() {
			_flipRatings(_formSide.home);
		},
		flipAwayRatings: function() {
			_flipRatings(_formSide.away);
		},
		updateLiveProbabilities: function(home, away) {
			_updateLiveProbabilities(_formSide.home, _formSide.away);
			_updateLiveProbabilities(_formSide.away, _formSide.home);
		}
	};
})();
