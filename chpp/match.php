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

	return new SimpleXMLElement(accessProtectedResource(
		$params,
		$_SESSION['requestToken'],
		$_SESSION['requestSecret']
	));
}

function getMatchTimeline($matchId) {
	$url = 'https://hattrick.org/Club/Matches/Match.aspx?matchID=' . strval($matchId) . '&SourceSystem=Hattrick';
	preg_match('/window[.]HT[.]ngMatch[.]data = .*/', file_get_contents($url), $matches);
	return json_decode(explode(' = ', $matches[0])[1]);
}

function getMatches($teamId) {
	$params = [
		'file' => 'matches',
		'version' => '2.9',
		'teamID' => strval($teamId)
	];

	return new SimpleXMLElement(accessProtectedResource(
		$params,
		$_SESSION['requestToken'],
		$_SESSION['requestSecret']
	));
}

function getTeams() {
	$params = [
		'file' => 'teamdetails',
		'version' => '3.7'
	];

	return new SimpleXMLElement(accessProtectedResource(
		$params,
		$_SESSION['requestToken'],
		$_SESSION['requestSecret']
	));
}
