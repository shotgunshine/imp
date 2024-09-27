var IMP = IMP || {};

IMP.chpp = (function() {
	'use strict';

	function _getXmlRatings(xml) {
		return new IMP.ratings(
			xml.getElementsByTagName('RatingLeftDef')[0] / 4,
			xml.getElementsByTagName('RatingMidDef')[0] / 4,
			xml.getElementsByTagName('RatingRightDef')[0] / 4,
			xml.getElementsByTagName('RatingMidfield')[0] / 4,
			xml.getElementsByTagName('RatingLeftAtt')[0] / 4,
			xml.getElementsByTagName('RatingMidAtt')[0] / 4,
			xml.getElementsByTagName('RatingRightAtt')[0] / 4,
			xml.getElementsByTagName('RatingIndirectSetPiecesDef')[0] / 4,
			xml.getElementsByTagName('RatingIndirectSetPiecesAtt')[0] / 4,
			0.25,
			xml.getElementsByTagName('TacticType')[0],
			xml.getElementsByTagName('TacticSkill')[0]
		);
	}

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
			let timeline = options.timeline ?? true;
			let path = `/match?match_id=${matchId}&timeline=${timeline}`;
			let request = new XMLHttpRequest();
			request.open('GET', path, true);
			request.onload = () => {
				if (request.status == 200) {
					matchForm.classList.remove('is-invalid');
					document.getElementById('match_invalid').classList.add('d-none');
					document.getElementById('match_sign').classList.add('d-none');
					let homeRatings, awayRatings, homeName, awayName;
					if (!timeline) {
						let xml = request.responseXML;
						homeRatings = _getXmlRatings(xml.getElementsByTagName('HomeTeam')[0]);
						awayRatings = _getXmlRatings(xml.getElementsByTagName('AwayTeam')[0]);
						homeName = xml.getElementsByTagName('HomeTeamName')[0];
						awayName = xml.getElementsByTagName('AwayTeamName')[0];
					} else {
						let json = JSON.parse(request.response);
						homeRatings = _getJsonRatingsHome(json);
						awayRatings = _getJsonRatingsAway(json);
						homeName = json.homeTeamName;
						awayName = json.awayTeamName;
					}
					IMP.form.setHomeRatings(homeRatings);
					IMP.form.setAwayRatings(awayRatings);
					let showDiff = false;
					IMP.prediction.printPrediction(showDiff);
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

		saveMatchRatings: function(matchId, isHome, options = {}) {
			let timeline = options.timeline ?? true;
			let path = `/match?match_id=${matchId}&timeline=${timeline}`;
			let request = new XMLHttpRequest();
			request.open('GET', path, true);
			request.onload = () => {
				if (request.status == 200) {
					let ratings;
					if (!timeline) {
						let xml = request.responseXML;
						if (isHome) {
							ratings = _getXmlRatings(xml.getElementsByTagName('HomeTeam')[0]);
						} else {
							ratings = _getXmlRatings(xml.getElementsByTagName('AwayTeam')[0]);
						}
					} else {
						let json = JSON.parse(request.response);
						if (isHome) {
							ratings = _getJsonRatingsHome(json);
						} else {
							ratings = _getJsonRatingsAway(json);
						}
					}
					let a = document.createElement('a');
					a.href = 'data:text/json;charset=utf-8,' + JSON.stringify(ratings);
					a.download = `${matchId}-${isHome ? 'home' : 'away'}.imp`;
					document.body.appendChild(a).click();
				}
			}
			request.send();
		}
	};
})();
