<?php
	function execInBackground($cmd) { 
	    if (substr(php_uname(), 0, 7) == "Windows"){ 
	        pclose(popen("start /B ". $cmd, "r"));
	    } 
	    else { 
	        exec($cmd . " > /dev/null &");   
	    } 
	}
	function init_start(){
		if(strpos($_SERVER['REQUEST_URI'], '?') !== false){
			header('Location: http://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'].'&start');	
		}
		else{
			header('Location: http://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'].'?start');	
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
			if($port > 5015){
				$port = 5000;
				exec('pkill -f example.py');
			}
			$command = '';
			if(isset($_GET['p'])){
				$command = 'example.py -u panferno44 -p hola45 -l "durango" -H '.$host.' -P '.$_GET['p'].' -st '.$steps;
				setcookie("pGo", $_GET['p'],  time()+2678400);
				$_COOKIE['pGo'] = $_GET['p'];
			}
			else{
				$command = 'example.py -u panferno44 -p hola45 -l "durango" -H '.$host.' -P '.$port.' -st '.$steps;
				setcookie("pGo", $port,  time()+600);
				$_COOKIE['pGo'] = $port;
				$port++;
				file_put_contents('port.conf', $port);
			}
			if (strtoupper(substr(PHP_OS, 0, 3)) !== 'WIN') {
				$command = 'python '.$command;
			}
			execInBackground($command);
		}
		if(isset($_COOKIE['pGo'])){
			if(intval($_COOKIE['pGo']) > 5015 && !isset($_GET['p'])) {
				init_start();
			}
			else{
				sleep(5);
				header('Location: http://'.$_SERVER['HTTP_HOST'].':'.$_COOKIE['pGo']);	
			}
		}
		else{
			init_start();
		}
	}
?>
