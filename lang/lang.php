<?php
const languages = [
	'en' => ['file' => 'en.php', 'name' => 'English'],
	'it' => ['file' => 'it.php', 'name' => 'Italiano']
];

if (isset($_POST['language_id'])) {
	$selectedLanguage = htmlspecialchars($_POST['language_id']);
	if (array_key_exists($selectedLanguage, languages)) {
		$_SESSION['languageId'] = $selectedLanguage;
	}
}

if (!isset($_SESSION['languageId'])) {
	$acceptedLanguage = substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);
	if (array_key_exists($acceptedLanguage, languages)) {
		$_SESSION['languageId'] = $acceptedLanguage;
	}
}

$defaultLanguage = require 'en.php';
if (isset($_SESSION['languageId'])) {
	$currentLanguage = require languages[$_SESSION['languageId']]['file'];
}

function getTranslation($message) {
	global $currentLanguage;
	global $defaultLanguage;
	return $currentLanguage[$message] ?? $defaultLanguage[$message];
}
