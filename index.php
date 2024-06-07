<?php
session_start([
	'cookie_lifetime' => 60*60*24*365,
	'cookie_secure' => true,
	'cookie_httponly' => true,
	'cookie_samesite' => 'Strict',
]);

error_reporting(E_ALL);

$uri = explode('/', parse_url($_SERVER['REQUEST_URI'])['path']);

if ($uri[1] == '' or $uri[1] == 'm') {
	include_once('view/head.phtml');
	include_once('view/predictor.phtml');
	include_once('view/foot.phtml');
}

elseif ($uri[1] == 'myteam') {
	if ($_SESSION['accessToken']) {
		require_once 'chpp/auth.php';
		$title = 'My Team';
		include_once('view/head.phtml');
		include_once('view/team.phtml');
		include_once('view/foot.phtml');
	} else {
		header('Location: /', true, 302);
		die();
	}
}

elseif ($uri[1] == 'login') {
	require_once 'chpp/auth.php';
	$response = getParameters(obtainRequestToken());
	if ($response['oauth_token']) {
		$_SESSION['requestToken'] = $response['oauth_token'];
		$_SESSION['requestSecret'] = $response['oauth_token_secret'];
		$path = paths['authorizeToken'] . '?oauth_token=' . $response['oauth_token'];
		$path .= '&oauth_callback=https://' . $_SERVER['SERVER_NAME'] . '/request_token_ready';
		header('Location: ' . $path, true, 302);
		die();
	} else {
		header('Location: /', true, 302);
		die();
	}
}

elseif ($uri[1] == 'request_token_ready') {
	$verifier = htmlspecialchars($_GET['oauth_verifier']);
	if ($verifier and $_SERVER['HTTP_REFERER'] == 'https://chpp.hattrick.org') {
		require_once 'chpp/auth.php';
		$response = getParameters(obtainAccessToken(
			$verifier,
			$_SESSION['requestToken'],
			$_SESSION['requestSecret']
		));
		if ($response['oauth_token']) {
			$_SESSION['accessToken'] = $response['oauth_token'];
			$_SESSION['accessSecret'] = $response['oauth_token_secret'];
		}
	}
	header('Location: /', true, 302);
	die();
}

elseif ($uri[1] == 'match') {
	if ($_SESSION['accessToken']) {
		require_once 'chpp/match.php';
		echo getMatch(intval($_GET['matchid']));
	} else {
		header('HTTP/1.0 403 Forbidden');
		die();
	}
}

elseif ($uri[1] == 'league') {
	if ($_SESSION['accessToken']) {
//		
	} else {
		header('HTTP/1.0 403 Forbidden');
		die();
	}
}

elseif ($uri[1] == 'fixtures') {
	if ($_SESSION['accessToken']) {
//		$mh = curl_multi_init();
	} else {
		header('HTTP/1.0 403 Forbidden');
		die();
	}
}

elseif ($uri[1] == 'logout') {
	session_destroy();
	header('Location: /', true, 302);
	die();
}

else {
	header('HTTP/1.0 404 Not found');
	die();
}
