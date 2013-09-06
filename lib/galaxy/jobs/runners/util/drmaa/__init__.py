try:
    from drmaa import Session, JobControlAction
except ImportError:
    # Will not be able to use DRMAA
    Session = None

NO_DRMAA_MESSAGE = "Attempt to use DRMAA, but DRMAA Python library cannot be loaded."


class DrmaaSessionFactory(object):
    """
    Abstraction used to production DrmaaSession wrappers.
    """
    def __init__(self):
        self.session_constructor = Session

    def get(self, **kwds):
        session_constructor = self.session_constructor
        if not session_constructor:
            raise Exception(NO_DRMAA_MESSAGE)
        return DrmaaSession(session_constructor(), **kwds)


class DrmaaSession(object):
    """
    Abstraction around `drmaa` module `Session` objects.
    """

    def __init__(self, session, **kwds):
        self.session = session
        session.initialize()

    def run_job(self, **kwds):
        """
        Create a DRMAA job template, populate with specified properties,
        run the job, and return the external_job_id.
        """
        template = self.session.createJobTemplate()
        try:
            for key, value in kwds.iteritems():
                setattr(template, key, value)
            return self.session.runJob(template)
        finally:
            self.session.deleteJobTemplate(template)

    def kill(self, external_job_id):
        return self.session.control(external_job_id, JobControlAction.TERMINATE)

    def job_status(self, external_job_id):
        return self.session.jobStatus(external_job_id)


__all__ = [DrmaaSessionFactory]
