

class CollectionTypeDescriptionFactory( object ):

    def __init__( self, type_registry ):
        # taking in type_registry though not using it, because we will someday
        # I think.
        self.type_registry = type_registry

    def for_collection_type( self, collection_type ):
        return CollectionTypeDescription( collection_type, self )


class CollectionTypeDescription( object ):
    """ Abstraction over dataset collection type that ties together string
    reprentation in database/model with type registry.


    >>> nested_type_description = CollectionTypeDescription( "list:paired", None )
    >>> paired_type_description = CollectionTypeDescription( "paired", None )
    >>> nested_type_description.has_subcollections_of_type( "list" )
    False
    >>> nested_type_description.has_subcollections_of_type( "list:paired" )
    False
    >>> nested_type_description.has_subcollections_of_type( "paired" )
    True
    >>> nested_type_description.has_subcollections_of_type( paired_type_description )
    True
    >>> nested_type_description.has_subcollections( )
    True
    >>> paired_type_description.has_subcollections( )
    False
    >>> paired_type_description.rank_collection_type()
    'paired'
    >>> nested_type_description.rank_collection_type()
    'list'
    """

    def __init__( self, collection_type, collection_type_description_factory ):
        self.collection_type = collection_type
        self.collection_type_description_factory = collection_type_description_factory
        self.__has_subcollections = self.collection_type.find( ":" ) > 0

    def has_subcollections_of_type( self, other_collection_type ):
        """ Take in another type (either flat string or another
        CollectionTypeDescription) and determine if this collection contains
        subcollections matching that type.

        The way this is used in map/reduce it seems to make the most sense
        for this to return True if these subtypes are proper (i.e. a type
        is not considered to have subcollections of its own type).
        """
        if hasattr( other_collection_type, 'collection_type' ):
            other_collection_type = other_collection_type.collection_type
        collection_type = self.collection_type
        return collection_type.endswith( other_collection_type ) and collection_type != other_collection_type

    def can_match_type( self, other_collection_type ):
        if hasattr( other_collection_type, 'collection_type' ):
            other_collection_type = other_collection_type.collection_type
        collection_type = self.collection_type
        return other_collection_type == collection_type

    def subcollection_type_description( self ):
        if not self.__has_subcollections:
            raise ValueError( "Cannot generate subcollection type description for flat type %s" % self.collection_type )
        subcollection_type = self.collection_type.split( ":", 1 )[ 1 ]
        return self.collection_type_description_factory.for_collection_type( subcollection_type )

    def has_subcollections( self ):
        return self.__has_subcollections

    def rank_collection_type( self ):
        """ Return the top-level collection type corresponding to this
        collection type. For instance the "rank" type of a list of paired
        data ("list:paired") is "list".
        """
        return self.collection_type.split( ":" )[ 0 ]

    def rank_type_plugin( self ):
        return self.collection_type_description_factory.type_registry.get( self.rank_collection_type() )