<?php
require_once 'keys.php';
const oauthVersion = '1.0';
const signatureMethod = 'HMAC-SHA1';
const paths = [
	'requestToken' => 'https://chpp.hattrick.org/oauth/request_token.ashx',
	'authorizeToken' => 'https://chpp.hattrick.org/oauth/authorize.aspx',
	'accessToken' => 'https://chpp.hattrick.org/oauth/access_token.ashx',
	'protectedResource' => 'https://chpp.hattrick.org/chppxml.ashx'
];

function getParameters($query) {
	$params = [];
	foreach (explode('&', $query) as $tuple) {
		$t = explode('=', $tuple);
		$params[$t[0]] = $t[1];
	}
	return $params;
}

function generateSignature($httpMethod, $path, $params, $tokenSecret) {
	ksort($params);
	$sortedParams = [];
	foreach ($params as $key => $value) {
		array_push($sortedParams, $key . "=" . $value);
	}
	$signatureBaseString = join('&', array(
		$httpMethod,
		urlencode($path),
		urlencode(join('&', $sortedParams))
	));
	$signatureKey = consumerSecret . '&' . $tokenSecret;
	return base64_encode(hash_hmac(
		'sha1',
		$signatureBaseString,
		$signatureKey,
		true
	));
}

function chppRequest($path, $params, $tokenSecret) {
	$params['oauth_signature'] = generateSignature('GET', $path, $params, $tokenSecret);
	ksort($params);
	$sortedParams = [];
	foreach ($params as $key => $value) {
		array_push($sortedParams, $key . "=" . $value);
	}
	$curlHandle = curl_init($path . '?' . join('&', $sortedParams));
	curl_setopt($curlHandle, CURLOPT_RETURNTRANSFER, true);
	$response = curl_exec($curlHandle);
	return $response;
}

function obtainRequestToken() {
	$params = [
		'oauth_consumer_key' => consumerKey,
		'oauth_signature_method' => signatureMethod,
		'oauth_timestamp' => time(),
		'oauth_nonce' => rand(),
		'oauth_version' => oauthVersion
	];
	return chppRequest(
		paths['requestToken'],
		$params,
		''
	);
}

function obtainAccessToken($verifier, $requestToken, $requestTokenSecret) {
	$params = [
		'oauth_consumer_key' => consumerKey,
		'oauth_token' => $requestToken,
		'oauth_signature_method' => signatureMethod,
		'oauth_timestamp' => time(),
		'oauth_nonce' => rand(),
		'oauth_verifier' => $verifier,
		'oauth_version' => oauthVersion
	];
	return chppRequest(
		paths['accessToken'],
		$params,
		$requestTokenSecret
	);
}

function accessProtectedResource($parameters, $accessToken, $accessTokenSecret) {
	$params = [
		'oauth_consumer_key' => consumerKey,
		'oauth_token' => $accessToken,
		'oauth_signature_method' => signatureMethod,
		'oauth_timestamp' => time(),
		'oauth_nonce' => rand(),
		'oauth_version' => oauthVersion
	];
	return chppRequest(
		paths['protectedResource'],
		array_merge($parameters, $params),
		$accessTokenSecret
	);
}
