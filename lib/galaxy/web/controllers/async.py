"""
Upload class
"""

from galaxy.web.base.controller import *

from galaxy import jobs, util, datatypes, web

import logging, urllib
import sha, hmac

log = logging.getLogger( __name__ )

class ASync( BaseController ):

    @web.expose
    def default(self, trans, tool_id=None, data_id=None, data_secret=None, **kwd):
        """Catches the tool id and redirects as needed"""
        return self.index( trans, tool_id=tool_id, data_id=data_id, data_secret=data_secret, **kwd)

    @web.expose
    def index(self, trans, tool_id=None, data_secret=None, **kwd):
        """Manages ascynchronous connections"""

        if tool_id is None:
            return "tool_id argument is required"
        tool_id=str(tool_id)
        #log.debug('async params -> %s' % kwd)

        # redirect to main when getting no parameters
        if not kwd:
            return trans.response.send_redirect( "/index" )

        history = trans.get_history( create=True )
        params  = util.Params(kwd, safe=False) 
        STATUS = params.STATUS
        URL = params.URL
        data_id = params.data_id

        log.debug('async dataid -> %s' % data_id)
        trans.log_event( 'Async dataid -> %s' % str(data_id) )

        # initialize the tool
        toolbox = self.get_toolbox()
        tool    = toolbox.tools_by_id.get(tool_id, '')
        if not tool:
            return "Tool with id %s not found" % tool_id
        
        #
        # we have an incoming data_id
        #
        if data_id:
            if not URL:
                return "No URL parameter was submitted for data %s" % data_id
            data = trans.model.HistoryDatasetAssociation.get( data_id )
           
            if not data:
                return "Data %s does not exist or has already been deleted" % data_id

            if STATUS == 'OK':
                key = hmac.new( trans.app.config.tool_secret, "%d:%d" % ( data.id, data.history_id), sha ).hexdigest()
                if key != data_secret:
                    return "You do not have permision to alter data %s." % data_id
                # push the job into the queue
                data.state = data.blurb = data.states.RUNNING
                log.debug('executing tool %s' % tool.id)
                trans.log_event( 'Async executing tool %s' % tool.id, tool_id=tool.id )
                galaxy_url  = trans.request.base + '/async/%s/%s/%s' % ( tool_id, data.id, key )
                galaxy_url = params.get("GALAXY_URL",galaxy_url)
                params = dict( url=URL, GALAXY_URL=galaxy_url )
                params[tool.outputs.keys()[0]] = data.id #assume there is exactly one output file possible
                #tool.execute( app=self.app, history=history, incoming=params )
                tool.execute( trans, incoming=params )
            else:
                log.debug('async error -> %s' % STATUS)
                trans.log_event( 'Async error -> %s' % STATUS )
                data.state = data.blurb = jobs.JOB_ERROR
                data.info  = "Error -> %s" % STATUS
            
            trans.model.flush()
            
            return "Data %s with status %s received. OK" % (data_id, STATUS)
   
        #            
        # no data_id must be parameter submission
        #
        if not data_id and len(params)>3:
            
            if params.galaxyFileFormat == 'wig':
                GALAXY_TYPE = 'wig'
            else:
                GALAXY_TYPE = params.GALAXY_TYPE  or 'interval'
                
            GALAXY_NAME  = params.GALAXY_NAME  or '%s query' % tool.name
            GALAXY_INFO  = params.GALAXY_INFO  or params.galaxyDescription or ''
            GALAXY_BUILD = params.GALAXY_BUILD or params.galaxyFreeze or 'hg17'
            
            #data = datatypes.factory(ext=GALAXY_TYPE)()
            #data.ext   = GALAXY_TYPE
            #data.name  = GALAXY_NAME
            #data.info  = GALAXY_INFO
            #data.dbkey = GALAXY_BUILD
            #data.state = jobs.JOB_OK
            #history.datasets.add_dataset( data )
            
            data = trans.app.model.HistoryDatasetAssociation( create_dataset = True, extension = GALAXY_TYPE, access_groups = [ group.group for group in trans.history.default_groups ], access_roles = [ role.role for role in trans.history.default_roles ] )
            data.name = GALAXY_NAME
            data.dbkey = GALAXY_BUILD
            data.info = GALAXY_INFO
            data.state = data.states.NEW
            data.flush()
            open( data.file_name, 'wb' ).close() #create the file
            trans.history.add_dataset( data, genome_build=GALAXY_BUILD )
            trans.model.flush()
            trans.log_event( "Added dataset %d to history %d" %(data.id, trans.history.id ), tool_id=tool_id )

            try:
                key = hmac.new( trans.app.config.tool_secret, "%d:%d" % ( data.id, data.history_id), sha ).hexdigest()
                galaxy_url  = trans.request.base + '/async/%s/%s/%s' % ( tool_id, data.id, key )
                params.update( { 'GALAXY_URL' :galaxy_url } )
                params.update( { 'data_id' :data.id } )
                url  = tool.action + '?' + urllib.urlencode( params.flatten() )
                log.debug("connecting to -> %s" % url)
                trans.log_event( "Async connecting to -> %s" % url )
                text =  urllib.urlopen(url).read(-1)
                text = text.strip()
                if not text.endswith('OK'):
                    raise Exception, text
                data.state = data.blurb = data.states.RUNNING
            except Exception, e:
                data.info  = str(e)
                data.state = data.blurb = data.states.ERROR
            
            trans.model.flush()

        return trans.fill_template('tool_executed.tmpl', out_data={}, tool=tool, config=self.app.config )
