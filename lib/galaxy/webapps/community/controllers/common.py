import tarfile
from galaxy.web.base.controller import *
#from galaxy.web.controllers.admin import get_user, get_group, get_role
from galaxy.webapps.community import model
from galaxy.model.orm import *
from galaxy.web.framework.helpers import time_ago, iff, grids
from galaxy.web.form_builder import SelectField
import logging
log = logging.getLogger( __name__ )

class CommunityCommon( BaseController ):
    @web.expose
    def edit_tool( self, trans, cntrller, **kwd ):
        params = util.Params( kwd )
        message = util.restore_text( params.get( 'message', ''  ) )
        status = params.get( 'status', 'done' )
        id = params.get( 'id', None )
        if not id:
            return trans.response.send_redirect( web.url_for( controller=cntrller,
                                                              action='browse_tools',
                                                              message='Select a tool to edit',
                                                              status='error' ) )
        tool = get_tool( trans, id )
        if params.get( 'edit_tool_button', False ):
            if params.get( 'in_categories', False ):
                in_categories = [ trans.sa_session.query( trans.app.model.Category ).get( x ) for x in util.listify( params.in_categories ) ]
                trans.app.security_agent.set_entity_category_associations( tools=[ tool ], categories=in_categories )
            else:
                # There must not be any categories associated with the tool
                trans.app.security_agent.set_entity_category_associations( tools=[ tool ], categories=[] )
            if params.get( 'description', False ):
                tool.user_description = util.restore_text( params.get( 'description', '' ) )
            trans.sa_session.add( tool )
            trans.sa_session.flush()
            message="Tool '%s' description and category associations have been saved" % tool.name
            return trans.response.send_redirect( web.url_for( controller='common',
                                                              action='edit_tool',
                                                              cntrller=cntrller,
                                                              id=id,
                                                              message=message,
                                                              status='done' ) )
        elif params.get( 'approval_button', False ):
            # Move the state from NEW to WAITING
            event = trans.app.model.Event( state=trans.app.model.Tool.states.WAITING )
            tea = trans.app.model.ToolEventAssociation( tool, event )
            trans.sa_session.add_all( ( event, tea ) )
            trans.sa_session.flush()
            message = "Tool '%s' has been submitted for approval and can no longer be modified" % ( tool.name )
            return trans.response.send_redirect( web.url_for( controller='common',
                                                              action='view_tool',
                                                              cntrller=cntrller,
                                                              id=id,
                                                              message=message,
                                                              status='done' ) )
        in_categories = []
        out_categories = []
        for category in get_categories( trans ):
            if category in [ x.category for x in tool.categories ]:
                in_categories.append( ( category.id, category.name ) )
            else:
                out_categories.append( ( category.id, category.name ) )
        return trans.fill_template( '/webapps/community/tool/edit_tool.mako',
                                    cntrller=cntrller,
                                    tool=tool,
                                    id=id,
                                    in_categories=in_categories,
                                    out_categories=out_categories,
                                    message=message,
                                    status=status )
    @web.expose
    def view_tool( self, trans, cntrller, **kwd ):
        params = util.Params( kwd )
        message = util.restore_text( params.get( 'message', ''  ) )
        status = params.get( 'status', 'done' )
        id = params.get( 'id', None )
        if not id:
            return trans.response.send_redirect( web.url_for( controller=cntrller,
                                                              action='browse_tools',
                                                              message='Select a tool to view',
                                                              status='error' ) )
        tool = get_tool( trans, id )
        categories = [ tca.category for tca in tool.categories ]
        tool_file_contents = tarfile.open( tool.file_name, 'r' ).getnames()
        return trans.fill_template( '/webapps/community/tool/view_tool.mako',
                                    tool=tool,
                                    tool_file_contents=tool_file_contents,
                                    categories=categories,
                                    cntrller=cntrller,
                                    message=message,
                                    status=status )
    @web.expose
    def upload_new_tool_version( self, trans, cntrller, **kwd ):
        params = util.Params( kwd )
        message = util.restore_text( params.get( 'message', ''  ) )
        status = params.get( 'status', 'done' )
        id = params.get( 'id', None )
        if not id:
            return trans.response.send_redirect( web.url_for( controller=cntrller,
                                                              action='browse_tools',
                                                              message='Select a tool to to upload a new version',
                                                              status='error' ) )
        tool = get_tool( trans, id )
        if params.save_button and ( params.file_data != '' or params.url != '' ):
            # TODO: call the upload method in the upload controller.
            message = 'Uploading new version not implemented'
            status = 'error'
        return trans.response.send_redirect( web.url_for( controller=cntrller,
                                                          action='browse_tools',
                                                          message='Not yet implemented, sorry...',
                                                          status='error' ) )

## ---- Utility methods -------------------------------------------------------

def get_categories( trans ):
    """Get all categories from the database"""
    return trans.sa_session.query( trans.model.Category ) \
                           .filter( trans.model.Category.table.c.deleted==False ) \
                           .order_by( trans.model.Category.table.c.name )
def get_unassociated_categories( trans, obj ):
    """Get all categories from the database that are not associated with obj"""
    # TODO: we currently assume we are setting a tool category, so this method may need
    # tweaking if / when we decide to set history or workflow categories
    associated_categories = []
    for tca in obj.categories:
        associated_categories.append( tca.category )
    categories = []
    for category in get_categories( trans ):
        if category not in associated_categories:
            categories.append( category )
    return categories
def get_category( trans, id ):
    return trans.sa_session.query( trans.model.Category ).get( trans.security.decode_id( id ) )
def set_categories( trans, obj, category_ids, delete_existing_assocs=True ):
    if delete_existing_assocs:
        for assoc in obj.categories:
            trans.sa_session.delete( assoc )
            trans.sa_session.flush()
    for category_id in category_ids:
        # TODO: we currently assume we are setting a tool category, so this method may need
        # tweaking if / when we decide to set history or workflow categories
        category = trans.sa_session.query( trans.model.Category ).get( category_id )
        obj.categories.append( trans.model.ToolCategoryAssociation( obj, category ) )
def get_tool( trans, id ):
    return trans.sa_session.query( trans.model.Tool ).get( trans.app.security.decode_id( id ) )

