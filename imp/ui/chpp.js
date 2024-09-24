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
			xml.getElementsByTagName('TacticSkill')[0],
		);
	}

	function _getJsonRatings(ratings, tacticType, tacticSkill) {
		return new IMP.ratings(
			ratings.averageLeftDef / 4,
			ratings.averageMidDef / 4,
			ratings.averageRightDef / 4,
			ratings.averageMidfield / 4,
			ratings.averageLeftAtt / 4,
			ratings.averageMidAtt / 4,
			ratings.averageRightAtt / 4,
			ratings.averageIndirectFreeKickDef / 4,
			ratings.averageIndirectFreeKickAtt / 4,
			0.25,
			tacticType,
			tacticSkill
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
						homeRatings = _getJsonRatings(
							json.ratings.filter(x => x.teamId == json.homeTeamIdDB)[0],
							json.homeTacticType,
							json.homeTacticSkill
						);
						awayRatings = _getJsonRatings(
							json.ratings.filter(x => x.teamId == json.awayTeamIdDB)[0],
							json.awayTacticType,
							json.awayTacticSkill
						);
						homeName = json.homeTeamName;
						awayName = json.awayTeamName;
					}
					IMP.form.setHomeRatings(homeRatings);
					IMP.form.setAwayRatings(awayRatings);
					IMP.prediction.printPrediction();
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
