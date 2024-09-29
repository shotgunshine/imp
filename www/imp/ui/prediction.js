var IMP = IMP || {};

IMP.prediction = (function() {
	'use strict';

	function _odds(prediction) {
		let odds = [0, 0, 0];
		prediction.forEach((x, h) => x.forEach((y, a) => odds[Math.sign(a - h) + 1] += y));
		return {
			win: odds[0],
			draw: odds[1],
			loss: odds[2]
		};
	}

	function _printDelta(node, value, digits, showDelta) {
		node.textContent = value.toFixed(digits);
		if (showDelta) {
			let diff = value - (node.getAttribute('data') ?? value);
			if (diff) node.textContent += ` (${(diff > 0) ? "+" : ""}${diff.toFixed(digits)})`;
		}
		node.setAttribute('data', value);
	}

	function _forumTable() {
		let table = document.getElementById('table_prediction').outerHTML;
		table = table.replaceAll(new RegExp([
			'\n',
			'\t',
			'</?thead>',
			'</?tbody>',
			' id="[A-z0-9 -]+"',
			' class="[A-z -]+"',
			' data="[0-9]+([.][0-9]+)?"',
			' [(][+]?[-]?[0-9]+([.][0-9]+)?[)]',
			' width="..."'
		].join('|'), 'gi'), '');
		table = table.replaceAll('<', '[');
		table = table.replaceAll('>', ']');
		table = table.replaceAll('[td]', '[td align=center]');
		table = table.replaceAll('[th]', '[th align=center]');
		return table;
	}

	function _gradientTable(prediction, rows, cols) {
		let labelHome = document.getElementById('head1').textContent;
		let labelAway = document.getElementById('head2').textContent;
		let table = '<thead><tr><th id="doubleHeader" class="p-0">';
		table += `<div class="text-end ms-3">${labelAway}</div>`;
		table += `<div class="text-start">${labelHome}</div></th>`;
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
				if (away == home && home < 8) style += ' border: 1px solid var(--bs-body-color);';
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

	return {
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
		},

		printPrediction: function(showDeltas = true) {
			let home = IMP.form.getHomeRatings();
			let away = IMP.form.getAwayRatings();

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
			_printDelta(document.getElementById('pred1'), 100 * _odds(prediction).win, 1, showDeltas);
			_printDelta(document.getElementById('predx'), 100 * _odds(prediction).draw, 1, showDeltas);
			_printDelta(document.getElementById('pred2'), 100 * _odds(prediction).loss, 1, showDeltas);

			let avgChancesHome = possession + countersHome * (1 - possession) * (1 - avgScoringAway);
			let avgChancesAway = (1 - possession) + countersAway * possession * (1 - avgScoringHome);
			_printDelta(document.getElementById('goal1'), 10 * avgChancesHome * (1 - pressing) * avgScoringHome, 2, showDeltas);
			_printDelta(document.getElementById('goal2'), 10 * avgChancesAway * (1 - pressing) * avgScoringAway, 2, showDeltas);
			_printDelta(document.getElementById('chan1'), 10 * avgChancesHome * (1 - pressing), 2, showDeltas);
			_printDelta(document.getElementById('chan2'), 10 * avgChancesAway * (1 - pressing), 2, showDeltas);
			_printDelta(document.getElementById('scor1'), 100 * avgScoringHome, 1, showDeltas);
			_printDelta(document.getElementById('scor2'), 100 * avgScoringAway, 1, showDeltas);

			document.getElementById('gradient').replaceChildren(_gradientTable(
				prediction,
				countersHome ? 16 : 11,
				countersAway ? 16 : 11
			));
		}
	};
})();
