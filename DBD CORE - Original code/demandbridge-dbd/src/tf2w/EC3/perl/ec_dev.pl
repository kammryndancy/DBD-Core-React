# Collect incoming variable stream
# write out to file in directory
# look for file with original name + ".o"
# send it's results back then remove it
# use perl cgi module


use CGI;
$in = new CGI;




$suffix = ".dev";
$dir = 'Y:/';

do 
{
	$outfile = $dir . int( rand( 99999 ) ) . $suffix;
	$infile = $outfile . ".o";
} until ( !( -e $outfile ) );


# Write out values to file for server to process to tmp file 
$tmpout = $outfile . "tmp";
open (WIP, "> $tmpout" );


foreach $key ($in->param) {              
        @values = $in->param($key);
        print WIP "$key=",join(", ",@values),"\n";   
}       


while (($ekey, $eval) = each %ENV) {
	if ( $ekey =~ /^REMOTE_/ ) {
		print (WIP "$ekey=$eval\n");
	}
}


close ( WIP );
rename $tmpout, $outfile;



# Wait until we see the file coming back
until ( -e "$infile" )
	{
	sleep 1;
	};

#open it and send it
sleep 1;
open( RESP, "< $infile" );

#set to flush after every print
$|=1;
# send the header first so apache won't complain
print ( "Content-type: text/html\n\n");


while( <RESP> )
	{
	print ();
	};
close( RESP );
unlink $infile;

exit;
