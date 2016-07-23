<?php
	if(empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] == "off"){
    	header('Location: https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']);
    	exit();
	}
	function execInBackground($cmd) { 
	    if (substr(php_uname(), 0, 7) == "Windows"){ 
	        pclose(popen("start /B ". $cmd, "r"));
	    } 
	    else { 
	        exec($cmd . " > /dev/null &");   
	    } 
	}
	function portInUse($port){
		$connection = @fsockopen($_SERVER['HTTP_HOST'], $_COOKIE['pGo']);
		return is_resource($connection);
	}
	$start = false;
	$globalPort = false;
	if(isset($_COOKIE['pGo']) && !portInUse($_COOKIE['pGo'])) {
    	$start = true;
	}
	else if(!isset($_COOKIE['pGo'])){
    	$start = true;
	}
	if($start) {
		$steps = '3';
		if(isset($_GET['steps'])){
			$steps = $_GET['steps'];
		}
		$host = '127.0.0.1';
		if (strtoupper(substr(PHP_OS, 0, 3)) !== 'WIN') {
			$host = '0.0.0.0';
		}
		$command = '';
		if(isset($_COOKIE['pGoPro'])) {
			$_GET['p'] = $_COOKIE['pGoPro'];
		}
		if(isset($_GET['p'])){
			$globalPort = $_GET['p'];
			$command = 'example.py -u panferno44 -p hola45 -l "durango" -H '.$host.' -P '.$_GET['p'].' -st '.$steps;
			setcookie("pGo", $_GET['p'],  time()+2678400);
			setcookie("pGoPro", $_GET['p'],  time()+2678400);
			$_COOKIE['pGo'] = $_GET['p'];
		}
		else{
			$port = intval(file_get_contents('port.conf'));
			if($port > 5500){
				$port = 5000;
				exec('pkill -f example.py');
			}
			$globalPort = $port;
			$command = 'example.py -u panferno44 -p hola45 -l "durango" -H '.$host.' -P '.$port.' -st '.$steps;
			setcookie("pGo", $port,  time()+600);
			$_COOKIE['pGo'] = $port;
			$port++;
			file_put_contents('port.conf', $port);
		}
		if (strtoupper(substr(PHP_OS, 0, 3)) !== 'WIN') {
			$command = 'python '.$command;
		}
		if(!portInUse($globalPort)){
			execInBackground($command);	
		}
	}
	if(isset($_GET['location']) && isset($_COOKIE['pGo'])){
		$coords = json_decode(file_get_contents('coords.json'), true);
		if(!is_array($coords)){
			$coords = array();
		}
		$coords[$_COOKIE['pGo']] = $_GET['location'];
		file_put_contents('coords.json', json_encode($coords));
	}
	echo file_get_contents('templates/example_fullmap.html');
?>
