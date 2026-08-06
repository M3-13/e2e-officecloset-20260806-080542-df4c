import atexit
import os
import tempfile

_fd, _db_path = tempfile.mkstemp(suffix=".db", prefix="test_wardrobe_")
os.close(_fd)


def _cleanup_db():
    try:
        if os.path.exists(_db_path):
            os.unlink(_db_path)
    except OSError:
        pass


atexit.register(_cleanup_db)
os.environ["DATABASE_PATH"] = _db_path
