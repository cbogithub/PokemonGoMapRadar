<?php
	if(isset($_GET['location'])){
		file_put_contents('coords.json', json_encode(array('location'=> $_GET['location'])));
	}
	if(isset($_GET['start'])){
		$steps = '5';
		if(isset($_GET['steps'])){
			$steps = $_GET['steps'];
		}
		exec('example.py -u panferno44 -p hola45 -l -st '.$_GET['steps']);
	}
	header('Location: '.$_SERVER['HTTP_HOST'].':5000');
	var_dump(json_decode(file_get_contents('coords.json'),true));
?>