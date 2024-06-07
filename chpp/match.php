<?php
require_once 'auth.php';

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
	die();
}
