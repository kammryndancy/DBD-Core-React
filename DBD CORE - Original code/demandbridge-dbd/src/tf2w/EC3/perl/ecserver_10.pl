#!/usr/local/bin/perl
# preforking server
#
# uses TCP port 4544 (hex of "EC")


use IO::Socket;
use Symbol;
use POSIX;

# establish SERVER socket, bind and listen
$server = IO::Socket::INET->new( LocalPort 	=> 4544,
				Type		=> SOCK_STREAM,
				Proto		=> 'tcp',
				Reuse		=> 1,
				Listen		=> 10
			       )
	or die "making socket: $@\n";

#global variables
$PREFORK		= 5;		# number of children to maintain
$MAX_CLIENTS_PER_CHILD	= 5;		# no of clients each child should proc
%children		= ();		# keys are current child process IDs
$children		= 0;		# current number of children


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
			transfer_data();
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
	my $dir = '/usr/lib/basic/www_dev/';

	# Say Hello and give version #
	print $client "WebEC Server Version 1.0\n";

	# Create unique filename
	do 
	{
		$outfile = $dir . int( rand( 99999 ) ) . $suffix;
		$infile = $outfile . ".o";
	} until ( !( -e $outfile ) );


	# Write out values to file for server to process to tmp file 
	$tmpout = $outfile . "tmp";
	open (WIP, "> $tmpout" );
	
	# read from port and write to WIP, until we see END
	while (<$client>) {
		$line = $_;
		chomp($line);	
		# if it is the word END then we are done
		last if ( $line eq "END" or $line eq "END\r" );

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
	print $client  "Content-type: text/html\n\n";
	
	while( <RESP> ) {
		print $client $_;
	};
	close( RESP );
	unlink $infile;

	# tell the client we're done
	print $client "END\n";
}

