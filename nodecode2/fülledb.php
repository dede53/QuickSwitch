<?php
echo"Hallo!";
error_reporting(E_ALL);
ini_set('track_errors', 1);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set("memory_limit","64M");
ini_set("max_execution_time","30");

$SQLITEdb = "abc.db";
$db = db_con($SQLITEdb);


echo "Verbunden";
$query = $db->query("CREATE TABLE IF NOT EXISTS temperatur (id INTEGER PRIMARY KEY,time INT DEFAULT (strftime('%s','now')) NOT NULL,nodeID INT,place TEXT,supplyV TEXT,temp TEXT,hum TEXT);");
$allsensors = 	$query->fetchAll();
var_dump($allsensors);
//$query = "CREATE TABLE IF NOT EXISTS temperatur (id INTEGER PRIMARY KEY,time INT DEFAULT (strftime('%s','now')) NOT NULL,nodeID INT,place TEXT,supplyV TEXT,temp TEXT,hum TEXT)";
// $query = $db->query($query);
//$allsensors = 	$query->fetchAll();
//var_dump($allsensors);

$sensor[15]="Wohnzimmer";
$sensor[16]="Daniel";
$sensor[17]="Balkon";

echo"beginne";
for($b = 0; $b <= 100; $b++){
	for($i = 15; $i <= 17; $i++){
		$query = "INSERT INTO temperatur (nodeID,place,supplyV,temp) VALUES ('". $i ."','".$sensor[$i]."','". ($b  / 500 + 2) ."','". ($b / 500 + 1.8) ."')";
		$query = $db->query($query);
	}
	echo $b;
}
echo"fertig";


// DB connect
function db_con($DBfile) {

    if (!$db = new PDO("sqlite:$DBfile")) {
        $e="font-size:23px; text-align:left; color:firebrick; font-weight:bold;";
        echo "<b style='".$e."'>Fehler beim öffnen der Datenbank $DBfile:</b><br/>";
        echo "<b style='".$e."'>".$db->errorInfo()."</b><br/>";
        die;
    }
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_OBJ);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    return $db;
}

// DB Query
// function db_query($sql) {
    // global $db;
    // $result = $db->query($sql) OR db_error($sql,$db->errorInfo());
    // return $result;
// }

// DB errors
// function db_error($sql,$error) {
    // die('<small><font color="#ff0000"><b>[DB ERROR]</b></font></small><br/><br/><font color="#800000"><b>'.$error.'</b><br/><br/>'.$sql.'</font>');
// }

// Add HTML character incoding to strings
// function db_output($string) {
    // return htmlspecialchars($string);
// }
// Add slashes to incoming data
// function db_input($string) {
    // if (function_exists('mysql_real_escape_string')) {
        // return mysql_real_escape_string($string);
    // }
    // return addslashes($string);
// }

?>