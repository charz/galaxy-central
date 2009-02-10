import sys, re

def stop_err( msg ):
    sys.stderr.write( msg )
    sys.exit()

def __main__():
    try:
        infile =  open ( sys.argv[1], 'r')
#    cols   =  ( re.sub( '\s*','',sys.argv[2] ) ).split( ',' )
        outfile = open ( sys.argv[2], 'w')
    except:
        stop_err( 'Cannot open or create a file\n' )
        
    if len( sys.argv ) < 4:
        stop_err( 'No columns to merge' )
    else:
        cols = sys.argv[3:]        

    skipped_lines = 0

    for line in infile:
        line = line.rstrip( '\r\n' )
        if line and not line.startswith( '#' ):
            fields = line.split( '\t' )
            line += '\t'
            for col in cols:
                try:
                    line += fields[ int( col ) -1 ]
                except:
                    skipped_lines += 1
                    
            print >>outfile, line
            
    if skipped_lines > 0:
        print 'Skipped %d invalid lines' % skipped_lines
            
if __name__ == "__main__" : __main__()