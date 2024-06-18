var IMP = IMP || {};

IMP.form = (function() {
	'use strict';

	const _formSide = {
		home: 'home',
		away: 'away'
	};

	function _getFormRatings(team) {
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

	function _setFormRatings(team, ratings) {
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
	}

	function _getXmlRatings(xml) {
		return new IMP.ratings(
			xml.getElementsByTagName('RatingLeftDef')[0] / 4 + 0.75,
			xml.getElementsByTagName('RatingMidDef')[0] / 4 + 0.75,
			xml.getElementsByTagName('RatingRightDef')[0] / 4 + 0.75,
			xml.getElementsByTagName('RatingMidfield')[0] / 4 + 0.75,
			xml.getElementsByTagName('RatingLeftAtt')[0] / 4 + 0.75,
			xml.getElementsByTagName('RatingMidAtt')[0] / 4 + 0.75,
			xml.getElementsByTagName('RatingRightAtt')[0] / 4 + 0.75,
			xml.getElementsByTagName('RatingIndirectSetPiecesDef')[0] / 4 + 0.75,
			xml.getElementsByTagName('RatingIndirectSetPiecesAtt')[0] / 4 + 0.75,
			0.25,
			xml.getElementsByTagName('TacticType')[0],
			xml.getElementsByTagName('TacticSkill')[0],	
		);
	}

	function _updateLiveProbabilities(home, away) {
		let h = _getFormRatings(home);
		let a = _getFormRatings(away);
		document.querySelector(`[for="${home}_ld"] > span`).textContent = Math.round(100 * (1 - IMP.predictor.scoringChance(a.rightAttack, h.leftDefense))) + "%";
		document.querySelector(`[for="${home}_cd"] > span`).textContent = Math.round(100 * (1 - IMP.predictor.scoringChance(a.centralAttack, h.centralDefense))) + "%";
		document.querySelector(`[for="${home}_rd"] > span`).textContent = Math.round(100 * (1 - IMP.predictor.scoringChance(a.leftAttack, h.rightDefense))) + "%";
		document.querySelector(`[for="${home}_mf"] > span`).textContent = Math.round(100 * IMP.predictor.chanceDistribution(h.midfield, a.midfield)) + "%";
		document.querySelector(`[for="${home}_ra"] > span`).textContent = Math.round(100 * IMP.predictor.scoringChance(h.rightAttack, a.leftDefense)) + "%";
		document.querySelector(`[for="${home}_ca"] > span`).textContent = Math.round(100 * IMP.predictor.scoringChance(h.centralAttack, a.centralDefense)) + "%";
		document.querySelector(`[for="${home}_la"] > span`).textContent = Math.round(100 * IMP.predictor.scoringChance(h.leftAttack, a.rightDefense)) + "%";
		document.querySelector(`[for="${home}_sa"] > span`).textContent = Math.round(100 * IMP.predictor.scoringChance(h.ispAttack, a.ispDefense)) + "%";
		document.querySelector(`[for="${home}_sd"] > span`).textContent = Math.round(100 * (1 - IMP.predictor.scoringChance(a.ispAttack, h.ispDefense))) + "%";
	}

	function _gradientTable(prediction, rows, cols) {
		let table = '<thead><tr><th></th>';
		for (let away = 0; away < cols; away++) {
			table += `<th>${away}</th>`;
		}
		table += '</tr></thead><tbody>';

		let max = prediction.flat().reduce((max, val) => val > max ? val : max, 0);
		for (let home = 0; home < rows; home++) {
			table += `<tr><th>${home}</th>`;
			for (let away = 0; away < cols; away++) { 
				let p = prediction[home][away];
				let style = `background: rgba(144, 155, 166, ${(p/max)**0.5});`;
				if (away == home) style += ' box-shadow: var(--bs-body-color) 0 0 0 1px inset;';
				table += `<td style="${style}">${p ? (100 * p).toFixed(1) + '%' : '-'}</td>`;
			}
			table += '</tr>';
		}
		table += '</tbody>';

		let tableNode = document.createElement('table');
		tableNode.classList = 'table table-borderless text-center';
		tableNode.innerHTML = table;
		return tableNode;
	}

	function _odds(prediction) {
		let odds = [0, 0, 0];
		prediction.forEach((x, h) => x.forEach((y, a) => odds[Math.sign(a - h) + 1] += y));
		return {
			win: odds[0],
			draw: odds[1],
			loss: odds[2]
		};
	}

	function _printDelta(node, value, digits) {
		node.textContent = value.toFixed(digits);
		let diff = value - (node.getAttribute('data') ?? value);
		if (diff) node.textContent += ` (${(diff > 0) ? "+" : ""}${diff.toFixed(digits)})`;
		node.setAttribute('data', value);
	}

	function _forumTable() {
		let forumTable = '[table][tr][th align=center]Home[/th][th align=center]Draw[/th]';
		forumTable += '[th align=center]Away[/th][/tr][tr][td align=center]';
		forumTable += Number(document.getElementById('pred1').getAttribute('data')).toFixed(1);
		forumTable += '%[/td][td align=center]';
		forumTable += Number(document.getElementById('predx').getAttribute('data')).toFixed(1);
		forumTable += '%[/td][td align=center]';
		forumTable += Number(document.getElementById('pred2').getAttribute('data')).toFixed(1);
		forumTable += '%[/td][/tr][tr][td align=center]';
		forumTable += Number(document.getElementById('goal1').getAttribute('data')).toFixed(2);
		forumTable += '[/td][td align=center][b]Goals[/b][/td][td align=center]';
		forumTable += Number(document.getElementById('goal2').getAttribute('data')).toFixed(2);
		forumTable += '[/td][/tr][tr][td align=center]';
		forumTable += Number(document.getElementById('chan1').getAttribute('data')).toFixed(2);
		forumTable += '[/td][td align=center][b]Chances[/b][/td][td align=center]';
		forumTable += Number(document.getElementById('chan2').getAttribute('data')).toFixed(2);
		forumTable += '[/td][/tr][tr][td align=center]';
		forumTable += Number(document.getElementById('scor1').getAttribute('data')).toFixed(1);
		forumTable += '%[/td][td align=center][b]Scoring[/b][/td][td align=center]';
		forumTable += Number(document.getElementById('scor2').getAttribute('data')).toFixed(1);
		forumTable += '%[/td][/tr][/table]';
		return forumTable;
	}

	return {
		saveRatings: function(homeTeam = true) {
			let a = document.createElement("a");
			let side = homeTeam ? _formSide.home : _formSide.away;
			a.href = "data:text/json;charset=utf-8," + JSON.stringify(_getFormRatings(side));
			a.download = new Date().toISOString() + ".imp";
			document.body.appendChild(a).click();
		},

		loadRatings: function(formFileField, homeTeam = true) {
			let side = homeTeam ? _formSide.home : _formSide.away;
			formFileField.files[0].text().then(file => JSON.parse(file)).then(ratings => {
				_setFormRatings(side, ratings);
				IMP.form.updateLiveProbabilities();
			});
		},

		flipRatings: function(homeTeam = true) {
			let side = homeTeam ? _formSide.home : _formSide.away;
			let ratings = _getFormRatings(side);
			let rightDefense = ratings.rightDefense;
			let rightAttack = ratings.rightAttack;
			ratings.rightDefense = ratings.leftDefense;
			ratings.rightAttack = ratings.leftAttack;
			ratings.leftDefense = rightDefense;
			ratings.leftAttack = rightAttack;
			_setFormRatings(side, ratings);
		},

		importMatchRatings: function(pushState = true) {
			let matchForm = document.getElementById('match_id');
			let matchId = Number(matchForm.value);
			let path = '/match?id=' + matchId;
			let request = new XMLHttpRequest();
			request.open('GET', path, true);
			//request.setRequestHeader("If-Modified-Since", ?? );
			request.onload = () => {
				if (request.status == 200) {
					matchForm.classList.remove('is-invalid');
					let xml = request.responseXML;
					_setFormRatings(_formSide.home, _getXmlRatings(xml.getElementsByTagName('HomeTeam')[0]));
					_setFormRatings(_formSide.away, _getXmlRatings(xml.getElementsByTagName('AwayTeam')[0]));
					IMP.form.updateLiveProbabilities();
					IMP.form.printPrediction();
					document.title = `${xml.getElementsByTagName('HomeTeamName')[0].slice(0, 8).trim()} - ${xml.getElementsByTagName('AwayTeamName')[0].slice(0, 8).trim()} · IMP`;
					if (pushState) history.pushState({}, null, `/m/${matchId}`);
				} else {
					matchForm.classList.add('is-invalid');
				}
			}
			request.send();
		},

		updateLiveProbabilities: function(home, away) {
			_updateLiveProbabilities(_formSide.home, _formSide.away);
			_updateLiveProbabilities(_formSide.away, _formSide.home);
		},

		copyForumTable: function(button) {
			if (navigator.clipboard) {
				window.navigator.clipboard.writeText(_forumTable());
			} else {
				let text = document.createElement('textarea');
				text.value = _forumTable();
				document.body.appendChild(text).select();
				document.execCommand('copy');
				text.remove();
			}
			button.textContent = 'Copied!';
			setTimeout(() => { button.textContent = 'Copy' }, 500);
		},

		printPrediction: function() {
			let home = _getFormRatings(_formSide.home);
			let away = _getFormRatings(_formSide.away);

			let possession = IMP.predictor.chanceDistribution(home.midfield, away.midfield);
			let pressing = IMP.predictor.tacticEfficacy(1, home.tactics[1]);
			pressing += IMP.predictor.tacticEfficacy(1, away.tactics[1]);
			let avgScoringHome = IMP.predictor.avgScoringChance(home, away);
			let avgScoringAway = IMP.predictor.avgScoringChance(away, home);
			let caThreshold = home.tactics[2]*away.tactics[2] ? 0.5 : 0.43245;
			let countersHome = (possession < caThreshold) ? IMP.predictor.tacticEfficacy(2, home.tactics[2]) : 0;
			let countersAway = (1 - possession < caThreshold) ? IMP.predictor.tacticEfficacy(2, away.tactics[2]) : 0;

			let prediction = IMP.predictor.prediction(
				possession,
				pressing,
				avgScoringHome,
				avgScoringAway,
				countersHome,
				countersAway
			);
			_printDelta(document.getElementById('pred1'), 100 * _odds(prediction).win, 1);
			_printDelta(document.getElementById('predx'), 100 * _odds(prediction).draw, 1);
			_printDelta(document.getElementById('pred2'), 100 * _odds(prediction).loss, 1);

			let avgChancesHome = possession + countersHome * (1 - possession) * (1 - avgScoringAway);
			let avgChancesAway = (1 - possession) + countersAway * possession * (1 - avgScoringHome);
			_printDelta(document.getElementById('goal1'), 10 * avgChancesHome * (1 - pressing) * avgScoringHome, 2);
			_printDelta(document.getElementById('goal2'), 10 * avgChancesAway * (1 - pressing) * avgScoringAway, 2);
			_printDelta(document.getElementById('chan1'), 10 * avgChancesHome * (1 - pressing), 2);
			_printDelta(document.getElementById('chan2'), 10 * avgChancesAway * (1 - pressing), 2);
			_printDelta(document.getElementById('scor1'), 100 * avgScoringHome, 1);
			_printDelta(document.getElementById('scor2'), 100 * avgScoringAway, 1);

			document.getElementById('gradient').replaceChildren(_gradientTable(
				prediction,
				countersHome ? 16 : 11,
				countersAway ? 16 : 11
			));
		}
	};
})();
