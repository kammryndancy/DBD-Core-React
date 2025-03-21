#!/usr/bin/perl
# preforking server
#
# uses TCP port 4543 (hex of "EC")
# 1.1  Modified 2001/02/10 by kmc
#	a line of "dir=pathname/" (ending in a /) will reset the path the file
#	is written to (default is /usr/lib/basic/www_interface)
#	a line of "suffix=.suffixname" will reset the output file suffix
#	default is ".ec"
#	These allow the client script to control where files go etc.
# 1.2 Modified 2001/02/24 by kmc
#	Added umask setting of 0666 to script so that created files can be
# 	easily manipulated by others
#
# 1.3	Modified 2001/03/14 by kmc
#	Was pushing lines into an array and popping them off, this reverses the
# 	order of information causing issues. Replace pop with shift to return
#	values in the correct order.
#	Added 1st parameter -> # of children to maintain, if not given defaults to 5
#	Did not change # of clients to process, this was left at 5
#
# 1.4   Modified 2001/05/11 by kmc
#	Dropped the printing of the "Content-Type:" header. This will now
#	be provided by EC3SRV. This will allow an override of the type if
#	desired. (to do a redirect for example)
#
# 2.0 Modified by kmc 2001/08/22
#	When receiving ecserver=status command, print out webpage
#	giving version, machine name, and process id
#
#	Time out after 90 seconds or seconds in 2nd argument and give
#	brief web page response
#
#	ecserver.pl #child_processs  #seconds_till_giveup
#


use IO::Socket;
use Symbol;
use POSIX;
use CGI; #2.0

##########
# Initilization section  2.0
##########
$ec_ver = "2.0";
$ec_date = "August 22, 2001";


# 1.2
umask 0;

 
# establish SERVER socket, bind and listen
$server = IO::Socket::INET->new( LocalPort 	=> 4543,
				Type		=> SOCK_STREAM,
				Proto		=> 'tcp',
				Reuse		=> 1,
				Listen		=> 10
			       )
	or die "making socket: $@\n";

#global variables
$PREFORK = @ARGV[0] or $PREFORK = 5;# number of children to maintain 
						# 1.3 get from ARGV[0]
$MAX_CLIENTS_PER_CHILD	= 5;		# no of clients each child should proc
%children		= ();		# keys are current child process IDs
$children		= 0;		# current number of children

$TIMEOUT = @ARGV[1] or $TIMEOUT = 90; # number of seconds until give up


sub REAPER {				# takes care of dead children
	$SIG{CHLD} = \ &REAPER;
	my $pid = wait;
	$children -- ;
	delete $children{$pid};
}

sub HUNTSMAN {				# signal handerl for SIGINT
	local($SIG{CHLD}) = 'IGNORE';	# we're going to kill our children
	kill 'INT' => keys %children;
	exit;				# clean up with dignity
}

# Fork off our children
for (1 .. $PREFORK ) {
	make_new_child();
}

# Install signal handlers
$SIG{CHLD} =  \&REAPER;
$SIG{INT} = \&HUNTSMAN;

# And maintain the population
while (1) {
	sleep;				# wait for a signal (ie, child's death)
	for ($i = $children; $i < $PREFORK; $i++ ) {
		make_new_child();	# top up the child pool
	}
}

sub make_new_child {
	my $pid;
	my $sigset;

	#block signal for fork
	$sigset = POSIX::SigSet->new(SIGINT);
	sigprocmask(SIG_BLOCK, $sigset) 
		or die "Can't block SIGINT for fork: $!\n";
	
	die "fork: $!" unless defined ($pid = fork);

	if ($pid) {
		# Parent records the child's birth and returns 
		sigprocmask(SIG_UNBLOCK, $sigset)
			or die "Can't unblock SIGINT for fork: $!\n";
		$children{$pid} = 1;
		$children++;
		return;
	} else {
		# Child can *NOT* return from this subroutine 
		$SIG{INT} = 'DEFAULT'; 		# make SIGINT kill us as before
		
		# unblock signals
		sigprocmask(SIG_UNBLOCK, $sigset)
			or die "Can't unblock SIGINT for fork: $!\n";

		# Handle connections until we've reached $MAX_CLIENTS_PER_CHILD
		for ($i=0; $i < $MAX_CLIENTS_PER_CHILD; $i++) {
			$client = $server->accept() or last;
			$client->autoflush(1);

			#do something

			# wait $TIMEOUT seconds then send web response and return
			$SIG{ALRM} = sub { die "timeout" };

			eval {
				alarm( $TIMEOUT );
				transfer_data();
				alarm( 0 );
			};
			
			if ($@) {  
				# an exception occured
				if ($@ =~ /timeout/) {    
					# the exception was a timeout
					print $client "Content-Type: text/html\n\n\n";
					print $client "<HTML>";
					print $client "timed out";
					print $client "</HTML>";
				} else {
					alarm( 0 ); # clear alarm
					die;
				}
			}


			close($client);



		}


		# tidy up gracefully and finish

		# this exit is VERY important, otherwise the child will become
		# a producer of more and more children, forking yourself into
		# process death
		exit;
	}
}

sub transfer_data {
	my $suffix = ".ec";
	my $dir = '/usr/lib/basic/www_interface/';
	my $status_only = 0;

	# Say Hello and give version #
	print $client "ECSERVER Version ", $ec_ver, "\n";

	# read from port and write to WIP, until we see END
	while (<$client>) {
		$line = $_;
		chomp($line);	
		# if it is the word END then we are done
		last if ( $line eq "END" or $line eq "END\r" );
		
		# if line starts with dir the reset directory
		($name, $value) = split(/=/, $line);
	
		if ( $name eq "ecserver" ) {
			if ( $value =~ /^status\b/ ) {	# set status only on
				$status_only = 1;	
			}
		} elsif ( $name eq "suffix" ) {
 			( $suffix = $value ) =~ s/\W$//;# chop off any non-alpha endings
		} elsif ( $name eq "dir" ) {
 			( $dir = $value ) =~ s/\W$//;# chop off any non-alpha endings
		} else {
			push @lines, $line;
		}

	}	


	
	if ( $status_only ) {
		$out = new CGI( "" ); # create empty query

		select( $client ); # sent info to client

		print $out->header ();
		print $out->start_html( -title => 'ecserver version: ' . $ec_ver );
		print $out->h1( "ecserver by TopForm Software, Inc" );
		print $out->h1( "Version: ", $ec_ver );
		print $out->h1( "Date: ",$ec_date );
		print $out->h1( "Directory: ", $dir );
		print $out->h1( "Suffix: ", $suffix );
		print $out->h1( "My process id is: ", $$ );
		print $out->h1( "My parent process id is: ", getppid() );
		print $out->h1( "Data passed to me:");
		foreach $dataline (@lines) {
			print $out->li( $dataline );
		}
		print $out->end_html;

		print $client "\n"; # make sure we are at start of new line
	} else {

		# Create unique filename
		do 
		{
			$outfile = $dir . int( rand( 99999 ) ) . $suffix;
			$infile = $outfile . ".o";
		} until ( !( -e $outfile ) );


		# Write out values to file for server to process to tmp file 
		$tmpout = $outfile . "tmp";
		open (WIP, "> $tmpout" );
	

		# now print them out - 1.3
		while ($line = shift @lines) {
			print WIP "$line\n";
		}

		close ( WIP );

		rename $tmpout, $outfile;



		# Wait until we see the file coming back
		until ( -e "$infile" ) {
			sleep 1;
		};
	
		#open it and send it
		sleep 1;
		open( RESP, "< $infile" );
	
		#set to flush after every print
		$|=1;
		# send the header first so apache won't complain
		# This line removed in 1.4
		# print $client  "Content-type: text/html\n\n";
	
		while( <RESP> ) {
			print $client $_;
		};
		close( RESP );
		unlink $infile;
	}


	# tell the client we're done
	print $client "END\n";
	return;
}

