<?php
session_start([
	'cookie_lifetime' => 60*60*24*365,
	'cookie_secure' => true,
	'cookie_httponly' => true,
	'cookie_samesite' => 'Strict',
]);

$uri = explode('/', parse_url($_SERVER['REQUEST_URI'])['path']);

if ($uri[1] == '' or $uri[1] == 'm') {
	require 'lang/lang.php';
	require 'view/head.phtml';
	require 'view/predictor.phtml';
	require 'view/foot.phtml';
}

elseif ($uri[1] == 'team') {
	if (isset($_SESSION['accessToken'])) {
		if (isset($uri[2])) {
			$teamId = intval($uri[2]);
		} else {
			$teamId = '';
		}
		require 'chpp/match.php';
		$matches = getMatches($teamId);
		if ($matches->Team->MatchList->children()) {
			require 'lang/lang.php';
			$title = htmlspecialchars($matches->Team->TeamName);
			require 'view/head.phtml';
			require 'view/team.phtml';
			require 'view/foot.phtml';
		} else {
			if ($teamId === '') {
				header('Location: /logout', true, 302);
			} else {
				header('Location: /team', true, 302);
			}
		}
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
		require 'lang/lang.php';
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
			$_SESSION['teams'] = [];
			require 'chpp/match.php';
			foreach (getTeams()->Teams->children() as $t) {
				$teamId = $t->TeamID->__toString();
				$teamName = $t->ShortTeamName->__toString();
				$_SESSION['teams'][$teamId] = $teamName;
			}
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
		if (boolval($_GET['timeline'])) {
			$cache = 'cache/' . $matchId . '.json';
			if (file_exists($cache)) {
				header('Cache-Control: public, max-age=31536000');
				echo file_get_contents($cache);
			} else {
				$match = getMatchTimeline(intval($_GET['match_id']));
				if ($match === null or ! $match->isFinished or $match->isWalkover) {
					header('HTTP/1.0 404 Not found');
				} else {
					header('Cache-Control: public, max-age=31536000');
					file_put_contents($cache, json_encode($match));
					echo json_encode($match);
				}
			}
		} else {
			$match = getMatch(intval($_GET['match_id']));
			if ($match->Match->FinishedDate) {
				header('Cache-Control: public, max-age=31536000');
				echo $match->asXML();
			} else {
				header('HTTP/1.0 404 Not found');
			}
		}
	} else {
		header('HTTP/1.0 401 Unauthorized');
	}
}

else {
	header('HTTP/1.0 404 Not found');
	require 'lang/lang.php';
	$title = getTranslation('errorNotFoundTitle');
	require 'view/head.phtml';
	$error = getTranslation('errorNotFoundMessage');
	require 'view/error.phtml';
	require 'view/foot.phtml';
}
