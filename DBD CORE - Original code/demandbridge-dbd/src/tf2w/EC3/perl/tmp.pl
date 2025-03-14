#
($sec, $min, $hour, $mday, $mon, $year, $wday, $yday, $isdt) = localtime(time);
$year -= 100;
$dsec = $sec + ($min * 60) + ($hour *3600);
$suffix = ".ec";
$outfile = $dir . $year . $yday . $dsec     
           . "_" . int( rand( 999 ) ) . $suffix;
print "$year$yday$dsec \n";
print "$outfile \n";

if ( open (TO1, "< tmp.pl" ) ) {
	while ( <TO1> ) {
		print $_;
	}

} else {
	print "couldn't\n";
	print "open the file\n";
	print "test.pl\n";
};

