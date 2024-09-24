<?php
session_start([
	'cookie_lifetime' => 60*60*24*365,
	'cookie_secure' => true,
	'cookie_httponly' => true,
	'cookie_samesite' => 'Strict',
]);

require 'lang/lang.php';

error_reporting(E_ALL);

$uri = explode('/', parse_url($_SERVER['REQUEST_URI'])['path']);

if ($uri[1] == '' or $uri[1] == 'm') {
	require 'view/head.phtml';
	require 'view/predictor.phtml';
	require 'view/foot.phtml';
}

elseif ($uri[1] == 'myteam') {
	if (isset($_SESSION['accessToken'])) {
		require 'chpp/auth.php';
		$title = 'My Team';
		require 'view/head.phtml';
		require 'view/team.phtml';
		require 'view/foot.phtml';
	} else {
		header('Location: /', true, 302);
	}
}

elseif ($uri[1] == 'login') {
	require 'chpp/auth.php';
	$response = getParameters(obtainRequestToken());
	if (isset($response['oauth_token'])) {
		$_SESSION['requestToken'] = $response['oauth_token'];
		$_SESSION['requestSecret'] = $response['oauth_token_secret'];
		$path = paths['authorizeToken'] . '?oauth_token=' . $response['oauth_token'];
		$path .= '&oauth_callback=https://' . $_SERVER['SERVER_NAME'] . '/request_token_ready';
		header('Location: ' . $path, true, 302);
	} else {
		$title = getTranslation('errorChppTitle');
		require 'view/head.phtml';
		$error = getTranslation('errorChppMessage');
		require 'view/error.phtml';
		require 'view/foot.phtml';
	}
}

elseif ($uri[1] == 'request_token_ready') {
	require 'chpp/auth.php';
	if (isset($_GET['oauth_verifier']) and strstr($_SERVER['HTTP_REFERER'], paths['authorizeToken'])) {
		$response = getParameters(obtainAccessToken(
			htmlspecialchars($_GET['oauth_verifier']),
			$_SESSION['requestToken'],
			$_SESSION['requestSecret']
		));
		if (isset($response['oauth_token'])) {
			$_SESSION['accessToken'] = $response['oauth_token'];
			$_SESSION['accessSecret'] = $response['oauth_token_secret'];
		}
	}
	header('Location: /', true, 302);
}

elseif ($uri[1] == 'logout') {
	session_destroy();
	header('Location: /', true, 302);
}

elseif ($uri[1] == 'match') {
	if (isset($_SESSION['accessToken'])) {
		require 'chpp/match.php';
		getMatch(intval($_GET['matchid']));
	} else {
		header('HTTP/1.0 401 Unauthorized');
	}
}

elseif ($uri[1] == 'match_scrape') {
	require 'chpp/match.php';
	scrapeMatch(intval($_GET['matchid']));
}

else {
	header('HTTP/1.0 404 Not found');
	$title = getTranslation('errorNotFoundTitle');
	require 'view/head.phtml';
	$error = getTranslation('errorNotFoundMessage');
	require 'view/error.phtml';
	require 'view/foot.phtml';
}
