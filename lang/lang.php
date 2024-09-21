<?php
const languages = [
	['id' => 0, 'file' => 'en.php', 'name' => 'English'],
	['id' => 1, 'file' => 'it.php', 'name' => 'Italiano']
];

if (isset($_POST['language_id'])) {
	$selectedLanguage = intval($_POST['language_id']);
	if (array_key_exists($selectedLanguage, languages)) {
		$_SESSION['languageId'] = $selectedLanguage;
	}
}
$defaultLanguage = require 'en.php';
if (!isset($_SESSION['languageId'])) {
	$accept = substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);
	if ($accept == 'en') $_SESSION['languageId'] = 0;
	if ($accept == 'it') $_SESSION['languageId'] = 1;
}
if (isset($_SESSION['languageId'])) {
	$currentLanguage = require languages[$_SESSION['languageId']]['file'];
}

function getTranslation($message) {
	global $currentLanguage;
	global $defaultLanguage;
	return $currentLanguage[$message] ?? $defaultLanguage[$message];
}
