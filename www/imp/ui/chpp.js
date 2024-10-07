var IMP = IMP || {};

IMP.chpp = (function() {
	'use strict';

	function _getJsonRatingsHome(json) {
		let ratings = json.ratings.filter(x => x.teamId == json.homeTeamIdDB)[0];
		let timeline = json.analysis.timeline.filter(x => x.minute < 5).at(-1);
		return new IMP.ratings(
			timeline.ratings.sectors[2].homeRating / 4,
			timeline.ratings.sectors[1].homeRating / 4,
			timeline.ratings.sectors[0].homeRating / 4,
			timeline.ratings.sectors[3].homeRating / 4,
			timeline.ratings.sectors[6].homeRating / 4,
			timeline.ratings.sectors[5].homeRating / 4,
			timeline.ratings.sectors[4].homeRating / 4,
			ratings.averageIndirectFreeKickDef / 4,
			ratings.averageIndirectFreeKickAtt / 4,
			0.25,
			json.homeTacticType,
			json.homeTacticSkill
		);
	}

	function _getJsonRatingsAway(json) {
		let ratings = json.ratings.filter(x => x.teamId == json.awayTeamIdDB)[0];
		let timeline = json.analysis.timeline.filter(x => x.minute < 5).at(-1);
		return new IMP.ratings(
			timeline.ratings.sectors[4].awayRating / 4,
			timeline.ratings.sectors[5].awayRating / 4,
			timeline.ratings.sectors[6].awayRating / 4,
			timeline.ratings.sectors[3].awayRating / 4,
			timeline.ratings.sectors[0].awayRating / 4,
			timeline.ratings.sectors[1].awayRating / 4,
			timeline.ratings.sectors[2].awayRating / 4,
			ratings.averageIndirectFreeKickDef / 4,
			ratings.averageIndirectFreeKickAtt / 4,
			0.25,
			json.awayTacticType,
			json.awayTacticSkill
		);
	}

	function _getMatch(matchId, callback) {
			let path = `/match?match_id=${matchId}&timeline=true`;
			let request = new XMLHttpRequest();
			request.open('GET', path, true);
			request.onload = () => { callback(request); }
			request.send();
	}

	function _playerIconName(positionId, behaviour) {
		switch (behaviour) {
			case 0: return 'normal';
			case 1: return 'down';
			case 2: return 'up';
			case 3: return (positionId == 101 || positionId == 106) ? 'right' : 'left';
			case 4: return (positionId == 102 || positionId == 107 || positionId == 111) ? 'left' : 'right';
			default: return 'empty';
		}
	}

	function _playerIcon(players, positionId) {
		let player = players.filter(q => q.positionId == positionId)[0];
		return `<img src="/res/img/lineup/${_playerIconName(positionId, player ? player.behaviour : null)}.svg" width="12">`;
	}

	return {
		importMatchRatings: function(options = {}) {
			let matchForm = document.getElementById('match_id');
			let matchId = Number(matchForm.value);
			_getMatch(matchId, request => {
				if (request.status == 200) {
					matchForm.classList.remove('is-invalid');
					document.getElementById('match_invalid').classList.add('d-none');
					document.getElementById('match_sign').classList.add('d-none');

					let json = JSON.parse(request.response);
					IMP.form.setHomeRatings(_getJsonRatingsHome(json));
					IMP.form.setAwayRatings(_getJsonRatingsAway(json));
					IMP.prediction.printPrediction(false);

					let homeName = json.homeTeamName;
					let awayName = json.awayTeamName;
					document.title = `${homeName.slice(0, 8).trim()} - ${awayName.slice(0, 8).trim()} · IMP`;
					document.getElementById('home_name').textContent = homeName;
					document.getElementById('away_name').textContent = awayName;
					if (options.pushState ?? true) history.pushState({}, null, `/m/${matchId}`);
				} else if (request.status == 404) {
					document.getElementById('match_sign').classList.add('d-none');
					document.getElementById('match_invalid').classList.remove('d-none');
					matchForm.classList.add('is-invalid');
				} else if (request.status == 401) {
					document.getElementById('match_invalid').classList.add('d-none');
					document.getElementById('match_sign').classList.remove('d-none');
					matchForm.classList.add('is-invalid');
				}
			});
		},

		saveMatchRatings: function(matchId, isHome) {
			_getMatch(matchId, request => {
				if (request.status == 200) {
					let json = JSON.parse(request.response);
					let ratings = isHome ? _getJsonRatingsHome(json) : _getJsonRatingsAway(json);
					let a = document.createElement('a');
					a.href = 'data:text/json;charset=utf-8,' + JSON.stringify(ratings);
					a.download = `${matchId}-${isHome ? 'home' : 'away'}.imp`;
					document.body.appendChild(a).click();
				}
			});
		},

		importMatchesRatings: function(locale) {
			for (let tr of document.querySelectorAll('#matches > tbody > tr')) {
				let matchId = tr.getAttribute('match-id');
				let isHome = tr.getAttribute('is-home');
				_getMatch(matchId, request => {
					if (request.status == 200) {
						let json = JSON.parse(request.response);
						if (json.events.filter(x => x.eventType == 22 || x.eventType == 28).length == 0) {
							let lineups = json.events.filter(x => x.eventType == 23 || x.eventType == 24);
							lineups = lineups[0].eventText.match(/[0-9]-[0-9]-[0-9]/g);
							let ratings, players, tactic, tacticLevel;
							if (isHome == 'true') {
								ratings = _getJsonRatingsHome(json);
								players = json.analysis.timeline.filter(x => x.minute < 5).at(-1).ratings.homePlayers;
								tactic = json.homeTacticType;
								tacticLevel = json.homeTacticSkill;
								tr.children[4].innerHTML = lineups[0];
							} else {
								ratings = _getJsonRatingsAway(json);
								players = json.analysis.timeline.filter(x => x.minute < 5).at(-1).ratings.awayPlayers;
								tactic = json.awayTacticType;
								tacticLevel = json.awayTacticSkill;
								tr.children[4].innerHTML = lineups[1] ?? lineups[0];
								if (json.events.filter(x => x.eventType == 25).length > 0) {
									tr.children[2].innerHTML = locale.derby;
								}
							}
							if (json.events.filter(x => x.eventType == 26).length > 0) {
								tr.children[2].innerHTML = locale.neutral;
							}
							if (tactic > 0) {
								tr.children[4].innerHTML += `<br>${locale.tactics[tactic]}&nbsp(${tacticLevel})`;
							}
							tr.children[5].innerHTML = `<table class="table table-sm table-borderless text-center m-0">
								<tr><td>${_playerIcon(players, 101)}</td>
								<td>${_playerIcon(players, 102)}</td>
								<td>${_playerIcon(players, 103)}</td>
								<td>${_playerIcon(players, 104)}</td>
								<td>${_playerIcon(players, 105)}</td></tr>
								<tr><td>${_playerIcon(players, 106)}</td>
								<td>${_playerIcon(players, 107)}</td>
								<td>${_playerIcon(players, 108)}</td>
								<td>${_playerIcon(players, 109)}</td>
								<td>${_playerIcon(players, 110)}</td></tr>
								<tr><td>${_playerIcon(players, null)}</td>
								<td>${_playerIcon(players, 111)}</td>
								<td>${_playerIcon(players, 112)}</td>
								<td>${_playerIcon(players, 113)}</td>
								<td>${_playerIcon(players, null)}</td></tr>
							</table>`;
							tr.children[6].innerHTML = `<table class="table table-sm table-bordered text-center m-0">
								<tr><td>${(ratings.rightDefense + 0.75).toFixed(2)}</td>
								<td>${(ratings.centralDefense + 0.75).toFixed(2)}</td>
								<td>${(ratings.leftDefense + 0.75).toFixed(2)}</td></tr>
								<tr><td colspan="3">${(ratings.midfield + 0.75).toFixed(2)}</td></tr>
								<tr><td>${(ratings.rightAttack + 0.75).toFixed(2)}</td>
								<td>${(ratings.centralAttack + 0.75).toFixed(2)}</td>
								<td>${(ratings.leftAttack + 0.75).toFixed(2)}</td></tr>
							</table>`;
							tr.children[7].innerHTML = `<button
								class="btn btn-inverted p-2"
								title="${locale.save}"
								onclick="IMP.chpp.saveMatchRatings(${matchId}, ${isHome})">
									<img src="/res/img/save.svg" width="24">
							</button>`;
						}
					}
				});
			}
		}
	};
})();
