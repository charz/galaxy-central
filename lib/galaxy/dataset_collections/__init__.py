from .registry import DatasetCollectionTypesRegistry
from .matching import MatchingCollections

from galaxy import model
from galaxy.exceptions import MessageException
from galaxy.exceptions import ItemAccessibilityException
from galaxy.exceptions import RequestParameterInvalidException
from galaxy.web.base.controller import (
    UsesHistoryDatasetAssociationMixin,
    UsesLibraryMixinItems,
    UsesTagsMixin,
)
from galaxy.managers import hdas  # TODO: Refactor all mixin use into managers.

from galaxy.util import validation

import logging
log = logging.getLogger( __name__ )


ERROR_INVALID_ELEMENTS_SPECIFICATION = "Create called with invalid parameters, must specify element identifiers."
ERROR_NO_COLLECTION_TYPE = "Create called without specifing a collection type."


class DatasetCollectionsService(
    UsesHistoryDatasetAssociationMixin,
    UsesLibraryMixinItems,
    UsesTagsMixin,
):
    """
    Abstraction for interfacing with dataset collections instance - ideally abstarcts
    out model and plugin details.
    """

    def __init__( self, app ):
        self.type_registry = DatasetCollectionTypesRegistry( app )
        self.model = app.model
        self.security = app.security
        self.hda_manager = hdas.HDAManager()

    def create(
        self,
        trans,
        parent,  # PRECONDITION: security checks on ability to add to parent occurred during load.
        name,
        collection_type,
        element_identifiers=None,
        elements=None,
        implicit_collection_info=None,
    ):
        """
        """
        dataset_collection = self.__create_dataset_collection(
            trans=trans,
            collection_type=collection_type,
            element_identifiers=element_identifiers,
            elements=elements,
        )
        if isinstance( parent, model.History ):
            dataset_collection_instance = self.model.HistoryDatasetCollectionAssociation(
                collection=dataset_collection,
                name=name,
            )
            if implicit_collection_info:
                for input_name, input_collection in implicit_collection_info[ "implicit_inputs" ]:
                    dataset_collection_instance.add_implicit_input_collection( input_name, input_collection )
                dataset_collection_instance.implicit_output_name = implicit_collection_info[ "implicit_output_name" ]
            # Handle setting hid
            parent.add_dataset_collection( dataset_collection_instance )
        elif isinstance( parent, model.LibraryFolder ):
            dataset_collection_instance = self.model.LibraryDatasetCollectionAssociation(
                collection=dataset_collection,
                folder=parent,
                name=name,
            )
        else:
            message = "Internal logic error - create called with unknown parent type %s" % type( parent )
            log.exception( message )
            raise MessageException( message )

        return self.__persist( dataset_collection_instance )

    def __create_dataset_collection(
        self,
        trans,
        collection_type,
        element_identifiers=None,
        elements=None,
    ):
        if element_identifiers is None and elements is None:
            raise RequestParameterInvalidException( ERROR_INVALID_ELEMENTS_SPECIFICATION )
        if not collection_type:
            raise RequestParameterInvalidException( ERROR_NO_COLLECTION_TYPE )
        rank_collection_type = collection_type.split( ":" )[ 0 ]
        if elements is None:
            if rank_collection_type != collection_type:
                # Nested collection - recursively create collections and update identifiers.
                self.__recursively_create_collections( trans, element_identifiers )
            elements = self.__load_elements( trans, element_identifiers )

        type_plugin = self.__type_plugin( rank_collection_type )
        dataset_collection = type_plugin.build_collection( elements )
        dataset_collection.collection_type = collection_type
        return dataset_collection

    def delete( self, trans, instance_type, id ):
        dataset_collection_instance = self.get_dataset_collection_instance( trans, instance_type, id, check_ownership=True )
        dataset_collection_instance.deleted = True
        trans.sa_session.add( dataset_collection_instance )
        trans.sa_session.flush( )

    def update( self, trans, instance_type, id, payload ):
        dataset_collection_instance = self.get_dataset_collection_instance( trans, instance_type, id, check_ownership=True )
        if trans.user is None:
            anon_allowed_payload = {}
            if 'deleted' in payload:
                anon_allowed_payload[ 'deleted' ] = payload[ 'deleted' ]
            if 'visible' in payload:
                anon_allowed_payload[ 'visible' ] = payload[ 'visible' ]
            payload = self._validate_and_parse_update_payload( anon_allowed_payload )
        else:
            payload = self._validate_and_parse_update_payload( payload )
        changed = self._set_from_dict( trans, dataset_collection_instance, payload )
        return changed

    def _set_from_dict( self, trans, dataset_collection_instance, new_data ):
        # Blatantly stolen from UsesHistoryDatasetAssociationMixin.set_hda_from_dict.

        # send what we can down into the model
        changed = dataset_collection_instance.set_from_dict( new_data )
        # the rest (often involving the trans) - do here
        if 'annotation' in new_data.keys() and trans.get_user():
            dataset_collection_instance.add_item_annotation( trans.sa_session, trans.get_user(), dataset_collection_instance.collection, new_data[ 'annotation' ] )
            changed[ 'annotation' ] = new_data[ 'annotation' ]
        if 'tags' in new_data.keys() and trans.get_user():
            self.set_tags_from_list( trans, dataset_collection_instance.collection, new_data[ 'tags' ], user=trans.user )

        if changed.keys():
            trans.sa_session.flush()

        return changed

    def _validate_and_parse_update_payload( self, payload ):
        validated_payload = {}
        for key, val in payload.items():
            if val is None:
                continue
            if key in ( 'name' ):
                val = validation.validate_and_sanitize_basestring( key, val )
                validated_payload[ key ] = val
            if key in ( 'deleted', 'visible' ):
                validated_payload[ key ] = validation.validate_boolean( key, val )
            elif key == 'tags':
                validated_payload[ key ] = validation.validate_and_sanitize_basestring_list( key, val )
        return validated_payload

    def history_dataset_collections(self, history, query):
        collections = history.dataset_collections
        collections = filter( query.direct_match, collections )
        return collections

    def __persist( self, dataset_collection_instance ):
        context = self.model.context
        context.add( dataset_collection_instance )
        context.flush()
        return dataset_collection_instance

    def __recursively_create_collections( self, trans, element_identifiers ):
        # TODO: Optimize - don't recheck parent, reload created model, just use as is.
        new_elements = dict()
        for key, element_identifier in element_identifiers.iteritems():
            try:
                if not element_identifier[ "src" ] == "new_collection":
                    # not a new collection, keep moving...
                    continue
            except KeyError:
                # Not a dictionary, just an id of an HDA - move along.
                continue

            # element identifier is a dict with src new_collection...
            collection_type = element_identifier.get( "collection_type", None )
            if not collection_type:
                raise RequestParameterInvalidException( "No collection_type define for nested collection." )
            collection = self.__create_dataset_collection(
                trans=trans,
                collection_type=collection_type,
                element_identifiers=element_identifier[ "element_identifiers" ],
            )
            self.__persist( collection )
            new_elements[ key ] = dict(
                src="dc",
                id=trans.security.encode_id( collection.id ),
            )
        element_identifiers.update( new_elements )
        return element_identifiers

    def __load_elements( self, trans, element_identifiers ):
        load_element = lambda element_identifier: self.__load_element( trans, element_identifier )
        return dict( [ ( k, load_element( i ) ) for k, i in element_identifiers.iteritems() ] )

    def __load_element( self, trans, element_identifier ):
        #if not isinstance( element_identifier, dict ):
        #    # Is allowing this to just be the id of an hda too clever? Somewhat
        #    # consistent with other API methods though.
        #    element_identifier = dict( src='hda', id=str( element_identifier ) )

        # dateset_identifier is dict {src=hda|ldda, id=<encoded_id>}
        try:
            src_type = element_identifier.get( 'src', 'hda' )
        except AttributeError:
            raise MessageException( "Dataset collection element definition (%s) not dictionary-like." % element_identifier )
        encoded_id = element_identifier.get( 'id', None )
        if not src_type or not encoded_id:
            raise RequestParameterInvalidException( "Problem decoding element identifier %s" % element_identifier )

        if src_type == 'hda':
            decoded_id = int( trans.app.security.decode_id( encoded_id ) )
            element = self.hda_manager.get( trans, decoded_id, check_ownership=False )
        elif src_type == 'ldda':
            element = self.get_library_dataset_dataset_association( trans, encoded_id )
        elif src_type == 'hdca':
            # TODO: Option to copy? Force copy? Copy or allow if not owned?
            element = self.__get_history_collection_instance( trans, encoded_id ).collection
        # TODO: ldca.
        elif src_type == "dc":
            # TODO: Force only used internally during nested creation so no
            # need to recheck security.
            element = self.get_dataset_collection( trans, encoded_id )
        else:
            raise RequestParameterInvalidException( "Unknown src_type parameter supplied '%s'." % src_type )
        return element

    def __type_plugin( self, collection_type ):
        return self.type_registry.get( collection_type )

    def match_collections( self, collections_to_match ):
        """
        May seem odd to place it here, but planning to grow sophistication and
        get plugin types involved so it will likely make sense in the future.
        """
        return MatchingCollections.for_collections( collections_to_match )

    def get_dataset_collection_instance( self, trans, instance_type, id, **kwds ):
        """
        """
        if instance_type == "history":
            return self.__get_history_collection_instance( trans, id, **kwds )
        elif instance_type == "library":
            return self.__get_library_collection_instance( trans, id, **kwds )

    def get_dataset_collection( self, trans, encoded_id ):
        collection_id = int( trans.app.security.decode_id( encoded_id ) )
        collection = trans.sa_session.query( trans.app.model.DatasetCollection ).get( collection_id )
        return collection

    def __get_history_collection_instance( self, trans, id, check_ownership=False, check_accessible=True ):
        instance_id = int( trans.app.security.decode_id( id ) )
        collection_instance = trans.sa_session.query( trans.app.model.HistoryDatasetCollectionAssociation ).get( instance_id )
        # TODO: Verify this throws exception...
        self.security_check( trans, collection_instance.history, check_ownership=check_ownership, check_accessible=check_accessible )
        return collection_instance

    def __get_library_collection_instance( self, trans, id, check_ownership=False, check_accessible=True ):
        if check_ownership:
            raise NotImplemented( "Functionality (getting library dataset collection with ownership check) unimplemented." )
        instance_id = int( trans.security.decode_id( id ) )
        collection_instance = trans.sa_session.query( trans.app.model.LibraryDatasetCollectionAssociation ).get( instance_id )
        if check_accessible:
            if not trans.app.security_agent.can_access_library_item( trans.get_current_user_roles(), collection_instance, trans.user ):
                raise ItemAccessibilityException( "LibraryDatasetCollectionAssociation is not accessible to the current user", type='error' )
        return collection_instance
