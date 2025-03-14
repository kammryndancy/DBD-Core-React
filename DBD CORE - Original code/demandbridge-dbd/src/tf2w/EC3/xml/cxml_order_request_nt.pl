# Collect incoming variable stream
# write out to file in directory
# look for file with original name + ".o"
# send it's results back then remove it
# use perl cgi module


##########
# Initilization section
##########
$ec_ver = "2.1";
$ec_date = "March 4, 2004";
$suffix = ".xml";
$dir = 'W:/';




# Gather info from CGI call first, then open connection to the 
# server to print it out
# Get CGI info

$query = "";
if ( $ENV{REQUEST_METHOD} eq 'POST' ) {
	read( STDIN, $query, $ENV{CONTENT_LENGTH} ) == $ENV{CONTENT_LENGTH}
		or $query = "";
}


#
# If no values then print About info
#

if ( $query eq ''  ) {
	print "Content-Type: text/html\n\n";
	print "<html>\n";
	print "cxml_order_request_nt by TopForm Software, Inc<br>";
	print  "Version: ", $ec_ver,"<br>\n" ;
	print "Date: ",$ec_date,"<br>\n" ;
	print "Put files into: ", $dir,"<br>\n";
	print "Suffix to use: ",$suffix,"<br>\n";
	print "</html>\n";
	exit;
}







############## Normal processing ####################

############## Create file to write into ##################
do 
{
	$outfile = $dir . int( rand( 99999 ) ) . $suffix;
	$infile = $outfile . ".o";
} until ( !( -e $outfile ) );


# Write out values to file for server to process to tmp file 
$tmpout = $outfile . "tmp";
open (WIP, "> $tmpout" );

print WIP $query;

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


while( <RESP> )
	{
	print ();
	};
close( RESP );
unlink $infile;

exit;
