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
		importMatchRatings: function(pushState = true, fallback = false) {
			let matchForm = document.getElementById('match_id');
			let matchId = Number(matchForm.value);
			let path = `/match${fallback ? '_scrape' : ''}?matchid=${matchId}`;
			let request = new XMLHttpRequest();
			request.open('GET', path, true);
			request.onload = () => {
				if (request.status == 200) {
					matchForm.classList.remove('is-invalid');
					let homeRatings, awayRatings, homeName, awayName;
					if (!fallback) {
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
					IMP.prediction.printPrediction(false);
					document.title = `${homeName.slice(0, 8).trim()} - ${awayName.slice(0, 8).trim()} · IMP`;
					document.getElementById('home_name').textContent = homeName;
					document.getElementById('away_name').textContent = awayName;
					if (pushState) history.pushState({}, null, `/m/${matchId}`);
				} else {
					matchForm.classList.add('is-invalid');
				}
			}
			request.send();
		}
	};
})();
