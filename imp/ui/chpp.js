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

	return {
		importMatchRatings: function(options = {}) {
			let matchForm = document.getElementById('match_id');
			let matchId = Number(matchForm.value);
			let path = `/match?match_id=${matchId}&timeline=true`;
			let request = new XMLHttpRequest();
			request.open('GET', path, true);
			request.onload = () => {
				if (request.status == 200) {
					matchForm.classList.remove('is-invalid');
					document.getElementById('match_invalid').classList.add('d-none');
					document.getElementById('match_sign').classList.add('d-none');
					let json = JSON.parse(request.response);
					let homeName = json.homeTeamName;
					let awayName = json.awayTeamName;
					IMP.form.setHomeRatings(_getJsonRatingsHome(json));
					IMP.form.setAwayRatings(_getJsonRatingsAway(json));
					IMP.prediction.printPrediction(false);
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
			}
			request.send();
		},

		saveMatchRatings: function(matchId, isHome) {
			let path = `/match?match_id=${matchId}&timeline=true`;
			let request = new XMLHttpRequest();
			request.open('GET', path, true);
			request.onload = () => {
				if (request.status == 200) {
					let ratings;
					let json = JSON.parse(request.response);
					if (isHome) {
						ratings = _getJsonRatingsHome(json);
					} else {
						ratings = _getJsonRatingsAway(json);
					}
					let a = document.createElement('a');
					a.href = 'data:text/json;charset=utf-8,' + JSON.stringify(ratings);
					a.download = `${matchId}-${isHome ? 'home' : 'away'}.imp`;
					document.body.appendChild(a).click();
				}
			}
			request.send();
		},

		importMatchesRatings: function() {
			let tactics = ['', 'Press', 'CA', 'AIM', 'AOW', '', '', 'PC', 'LS']; // to-do: localize
			for (let tr of document.querySelectorAll('#matches > tbody > tr')) {
				let matchId = tr.getAttribute('match-id');
				let path = `/match?match_id=${matchId}&timeline=true`;
				let request = new XMLHttpRequest();
				request.open('GET', path, true);
				request.onload = () => {
					if (request.status == 200) {
						let json = JSON.parse(request.response);
						let lineups = json.events.filter(x => x.eventType == 23 || x.eventType == 24);
						lineups = lineups[0].eventText.match(/[0-9]-[0-9]-[0-9]/g);
						let ratings, tactic, tacticLevel;
						if (tr.getAttribute('is-home') === 'true') {
							ratings = _getJsonRatingsHome(json);
							tactic = json.homeTacticType;
							tacticLevel = json.homeTacticSkill;
							tr.children[4].innerHTML = lineups[0];
						} else {
							ratings = _getJsonRatingsAway(json);
							tactic = json.awayTacticType;
							tacticLevel = json.awayTacticSkill;
							tr.children[4].innerHTML = lineups[1] ?? lineups[0];
							if (json.events.filter(x => x.eventType == 25).length > 0) {
								tr.children[2].innerHTML = 'Derby'; // to-do: localize
							}
						}
						if (json.events.filter(x => x.eventType == 26).length > 0) {
							tr.children[2].innerHTML = 'Neutral'; // to-do: localize
						}
						if (tactic > 0) {
							tr.children[4].innerHTML += `<br>${tactics[tactic]}&nbsp(${tacticLevel})`;
						}
						tr.children[5].innerHTML = `
							<table class="table table-sm table-bordered text-center m-0">
							<tr><td>${(ratings.rightDefense + 0.75).toFixed(2)}</td>
							<td>${(ratings.centralDefense + 0.75).toFixed(2)}</td>
							<td>${(ratings.leftDefense + 0.75).toFixed(2)}</td></tr>
							<tr><td colspan="3">${(ratings.midfield + 0.75).toFixed(2)}</td></tr>
							<tr><td>${(ratings.rightAttack + 0.75).toFixed(2)}</td>
							<td>${(ratings.centralAttack + 0.75).toFixed(2)}</td>
							<td>${(ratings.leftAttack + 0.75).toFixed(2)}</td></tr>
						`;
					}
				}
				request.send();
			}
		}
	};
})();
