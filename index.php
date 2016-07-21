<?php
	function execInBackground($cmd) { 
	    if (substr(php_uname(), 0, 7) == "Windows"){ 
	        pclose(popen("start /B ". $cmd, "r"));
	    } 
	    else { 
	        exec($cmd . " > /dev/null &");   
	    } 
	} 
	if(isset($_GET['location']) && isset($_COOKIE['pGo'])){
		$coords = json_decode(file_get_contents('coords.json'), true);
		if(!is_array($coords)){
			$coords = array();
		}
		$coords[$_COOKIE['pGo']] = $_GET['location'];
		file_put_contents('coords.json', json_encode($coords));
		header('Location: ' . $_SERVER['HTTP_REFERER']);
	}
	else{
		if(isset($_GET['start'])){
			$steps = '3';
			if(isset($_GET['steps'])){
				$steps = $_GET['steps'];
			}
			$host = '127.0.0.1';
			if (strtoupper(substr(PHP_OS, 0, 3)) !== 'WIN') {
				$host = '0.0.0.0';
			}
			$port = intval(file_get_contents('port.conf'));
			if($port > 5020){
				$port = 5000;
				exec('pkill -f example.py');
			}
			$command = 'example.py -u panferno44 -p hola45 -l "durango" -H '.$host.' -P '.$port.' -st '.$steps;
			if (strtoupper(substr(PHP_OS, 0, 3)) !== 'WIN') {
				$command = 'python '.$command;
			}
			setcookie("pGo", $port,  time()+600);
			$_COOKIE['pGo'] = $port;
			$port++;
			file_put_contents('port.conf', $port);
			execInBackground($command);
		}
		if(isset($_COOKIE['pGo'])){
			sleep(10);
			header('Location: http://'.$_SERVER['HTTP_HOST'].':'.$_COOKIE['pGo']);	
		}
		else{
			if(strpos($_SERVER['REQUEST_URI'], '?') !== false){
				header('Location: http://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'].'&start');	
			}
			else{
				header('Location: http://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'].'?start');	
			}
		}
	}
?>
