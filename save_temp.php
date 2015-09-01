<?php
/******************************
curl -i -X POST 
-H 'Content-Type: application/json' 
-d '{"nodeID": 16,"supplyV": 2.2,"temp":15.9,"hum":50}' 

http://192.168.2.47:8000/newdata
***********************************/


$url = 'http://192.168.2.47:8000/newdata';
$SECURITYKEY = "ichbineinpasswort";

if (!empty($_GET)) {
    $ValidKey = false;
    foreach ($_GET AS $arg => $var) {
        if ($arg == "key" AND $var == $SECURITYKEY) { $ValidKey=true; }
        if ($arg == "node")	{ $nodeID 	= $var; }
        if ($arg == "v") 	{ $supplyV 	= $var; }
        if ($arg == "t") 	{ $temp 	= $var; }
        if ($arg == "h") 	{ $hum 		= $var; }
    }
    if (!$ValidKey) {
		echo "Invalid Key!";
		exit();
	}

    if ( isset($nodeID) AND isset($supplyV) AND (isset($temp) OR isset($hum)) ) {
		
		$data = array();
		$data['nodeID'] = $nodeID;
		$data['supplyV'] = $supplyV;
		$data['temp'] = $temp;
		$data['hum'] = $hum;
		
		echo save_temp($data, $url);
    }
}


function save_temp($data, $url){
	$data = json_encode($data);

	$options = array(
		'http' => array(
			'header'  => "Content-Type: application/json",
			'method'  => 'POST',
			// 'content' => http_build_query($data),
			'content' => $data,
		),
	);
	$context  = stream_context_create($options);
	$result = file_get_contents($url, false, $context);

	return($result);	
}












?>