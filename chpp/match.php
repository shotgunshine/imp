<?php
require 'auth.php';

function getMatch($matchId) {
	$params = [
		'file' => 'matchdetails',
		'version' => '3.1',
		'matchEvents' => 'false',
		'matchID' => strval($matchId),
		'sourceSystem' => 'hattrick'
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

function getMatchTimeline($matchId) {
	$cache = 'cache/' . $matchId . '.json';
	if (file_exists($cache)) {
		header('Cache-Control: public, max-age=31536000');
		echo file_get_contents($cache);
	} else {
		$url = 'https://hattrick.org/Club/Matches/Match.aspx?matchID=' . strval($matchId) . '&SourceSystem=Hattrick';
		preg_match('/window[.]HT[.]ngMatch[.]data = .*/', file_get_contents($url), $matches);
		$data = json_decode(explode(' = ', $matches[0])[1]);
		if ($data === null or ! $data->isFinished or $data->isWalkover) {
			header('HTTP/1.0 404 Not found');
		} else {
			header('Cache-Control: public, max-age=31536000');
			file_put_contents($cache, json_encode($data));
			echo json_encode($data);
		}
	}
}

function getMatches($teamId) {
	$params = [
		'file' => 'matches',
		'version' => '2.9',
		'teamID' => strval($teamId)
	];

	$matches = accessProtectedResource(
		$params,
		$_SESSION['requestToken'],
		$_SESSION['requestSecret']
	);

	$xml = new SimpleXMLElement($matches);
	if ($xml->Team->MatchList->children()) {
		echo $matches;
	} else {
		header('HTTP/1.0 404 Not found');
	}
}
