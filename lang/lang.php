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
if (isset($_SESSION['languageId'])) {
	$currentLanguage = require languages[$_SESSION['languageId']]['file'];
}

function getTranslation($message) {
	global $currentLanguage;
	global $defaultLanguage;
	return $currentLanguage[$message] ?? $defaultLanguage[$message];
}
