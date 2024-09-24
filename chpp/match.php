<?php
require 'auth.php';

function getMatch($matchId, $sourceSystem = 'hattrick', $matchEvents = false) {
	$params = [
		'file' => 'matchdetails',
		'version' => '3.1',
		'matchEvents' => $matchEvents,
		'matchID' => $matchId,
		'sourceSystem' => $sourceSystem,
	];

	$match = accessProtectedResource(
		$params,
		$_SESSION['requestToken'],
		$_SESSION['requestSecret']
	);

	$xml = new SimpleXMLElement($match);
	if ($xml->FinishedDate) {
		header('Cache-Control: public, max-age=31536000');
		echo $match;
	} else {
		header('HTTP/1.0 404 Not found');
	}
}

function scrapeMatch($matchId, $sourceSystem = 'Hattrick') {
	$url = 'https://hattrick.org/Club/Matches/Match.aspx?matchID=' . $matchId . '&SourceSystem=' . $sourceSystem;
	preg_match('/window[.]HT[.]ngMatch[.]data = .*/', file_get_contents($url), $matches);
	$data = json_decode(explode(' = ', $matches[0])[1]);

	if ($data === null or ! $data->isFinished or $data->isWalkover) {
		header('HTTP/1.0 404 Not found');
	} else {
		header('Cache-Control: public, max-age=31536000');
		echo json_encode($data);
	}
}
