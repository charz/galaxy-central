import threading

from distutils.version import LooseVersion

from .interface import ToolLineage
from .interface import ToolLineageVersion


class StockLineage(ToolLineage):
    """ Simple tool's loaded directly from file system with lineage
    determined solely by distutil's LooseVersion naming scheme.
    """
    lineages_by_id = {}
    lock = threading.Lock()

    def __init__(self, tool_id, **kwds):
        self.tool_id = tool_id
        self.tool_versions = set()

    def get_version_ids( self, reverse=False ):
        return [self.tool_id]

    @staticmethod
    def for_tool_id( tool_id ):
        lineages_by_id = StockLineage.lineages_by_id
        with StockLineage.lock:
            if tool_id not in lineages_by_id:
                lineages_by_id[ tool_id ] = StockLineage( tool_id )
        return lineages_by_id[ tool_id ]

    def register_version( self, tool_version ):
        assert tool_version is not None
        self.tool_versions.add( tool_version )

    def get_versions( self, reverse=False ):
        versions = [ ToolLineageVersion( self.tool_id, v ) for v in self.tool_versions ]
        # Sort using LooseVersion which defines an appropriate __cmp__
        # method for comparing tool versions.
        return sorted( versions, key=_to_loose_version )


def _to_loose_version( tool_lineage_version ):
    return LooseVersion( tool_lineage_version.version )
