<?php
// UNDP Subnational FIX v1.0
// author:{author}
// custom data fixer for subnational.cvs
// modifies directly ../api/projects/{#}.json files
// mofidy $source = '' with your data locatoin or overwrite csv file in
// data_fix folder
// to run:
// php undp-subnation-fix.php
define('LINE_LIMIT',1000);

$source = "data_fix/subnational.csv";


// reading the csv file first...

$projects = array(); 	// store mass here

$row = 1;		// hold row of csv
$awardIDCount = 0;
if (($handle = fopen($source, "r")) !== FALSE) {
	
	// first one is field descriptor
	while (($data = fgetcsv($handle, LINE_LIMIT, ",")) !== FALSE) {

		$num = count($data);
		//echo "$num fields in line $row:\n";
		
	
		$row++;
		if($row == 2) continue;	// skip field descriptor
		
		// read in
		// awardID,lat,lon,precision,type,scope
		// 00060777,31,64,4,2,2

		//var_dump($data);
	
		$awardID = $data[0];
		$fill = array(
			'lat'		=> $data[1],
			'lon'		=> $data[2],
			'precision'	=> $data[3],
			'scope'		=> $data[4],
			'type'		=> $data[5]
			);
		$awardIDCount++;
		


		if(array_key_exists($awardID,$projects)) {
			$projects[$awardID][] = $fill;
		}
		else {
			$projects[$awardID]=array($fill);

		}	
		//if($row == 40) break;
	}
	$unique_projects = count($projects);
	echo "Collected single position data:$awardIDCount\n";
	echo "Unique projects: $unique_projects\n";
	fclose($handle);
}

//var_dump($projects['00040456']);

foreach($projects as $key => $value) {
	$json_filename = ltrim($key, '0');
	$json_file = "../api/projects/{$json_filename}.json";
	if(file_exists($json_file)) {
		$data = json_decode(file_get_contents($json_file));
		$subnational = $data->subnational;
		$data->subnational = $projects[$key];
		$json_data = json_encode($data);
		file_put_contents($json_file,$json_data);
	}
	else {
		echo "File not exists! [$json_file]";

	}
}
echo "All project files fixed!";
/*
$sample = "../api/projects/40456.json";
$data = json_decode(file_get_contents($sample));
$subnational = $data->subnational;

$data->subnational = $projects['00040456'];
$test2 = json_encode($data);
echo $test2;
file_put_contents($sample,$test2);
*/




?>
