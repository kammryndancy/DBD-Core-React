#!/usr/bin/perl
#
# Establish communcition with WebEC server in XML mode
# Send information and the receive information back for return
# Removed CGI interface and does direct pass through now
#
#
use IO::Socket;

##########
# Initilization section
##########
$ec_ver = "2.1";
$ec_date = "March 3, 2004";
$peer_addr = "10.6.72.10";
$peer_port = 4543;
$send_to_dir = "/usr/lib/pvx/www_interface/";
$send_suffix = ".xml";


###########
###########


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
	print "ecclient by TopForm Software, Inc<br>";
	print  "Version: ", $ec_ver,"<br>\n" ;
	print "Date: ",$ec_date,"<br>\n" ;
	print "Sending requests to: ", $peer_addr,"<br>\n" ;
	print "Using port: ",$peer_port,"<br>\n" ;
	print "Put files into: ", $send_to_dir,"<br>\n";
	print "Suffix to use: ",$send_suffix,"<br>\n";

	if ( open_server() ) {
		print "Server response: ",$server_response,"<br>\n";
	}
	else	{
		print "Server unavailable!!!: ",$err_message,"<br>\n";
	}

	print "</html>\n";
	exit;
}


#
# Start connection to server
#

open_server()  or die $err_message ;


#
# set directory and suffix
#
print $server "dir=", $send_to_dir, "\r\n";
print $server "suffix=", $send_suffix, "\r\n";

#
# Now send values to the server
#	
        print $server $query;



#
# Say we're done now
#
print $server "END\n";

#
# Now get return data until we see an END
#
	while (<$server>) {
		$line = $_;
		chomp($line);	
		# if it is the word END then we are done
		last if ( $line eq "END" or $line eq "END\r" );
		print "$line\n";
	}	


#
# Now close the connection to the server
#
close ( $server );
 #
# Done with everything
#
exit;


############
# Subroutines
############


######
# open_server
# 	No arguements, uses global values of $peer_address & $peer_port - will change later
#	$err_message will contain message if error happen, will return undef
#	$server_reponse will contain response from server and will return a 1 if connected
######

sub open_server {

	 # Initialize
	$server_response = "";
	$err_message = "";


	 # open connection if unsuccessful print message and return undef
 	$server = IO::Socket::INET->new(	PeerAddr => $peer_addr ,
 						PeerPort => $peer_port,
 						Proto	=> "tcp",
 						Type	=> SOCK_STREAM )
 	or $err_message =  "Couldn't connect to Web EC Server: $@";	

	if ( $err_message ) {
		return 0;
	}

 	# Set AutoFlush
 	$server->autoflush(1);


 	# get response from server for reference
 	$server_response = <$server>;
}


