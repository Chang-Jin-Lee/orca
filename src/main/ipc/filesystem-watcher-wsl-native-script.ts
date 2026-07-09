const SAFE_IGNORE_NAME = /^[A-Za-z0-9_.-]+$/

export function validateWslWatcherIgnoreDirs(ignoreDirs: readonly string[]): void {
  for (const name of ignoreDirs) {
    if (!SAFE_IGNORE_NAME.test(name)) {
      throw new Error(`Unsupported WSL watcher ignore name: ${name}`)
    }
  }
}

/**
 * Build a third-party-package-free recursive watcher for the Linux side of WSL.
 *
 * The script uses Python's standard library to call inotify directly. It emits
 * newline-delimited JSON so arbitrary Linux path characters stay framed while
 * only change deltas cross the WSL boundary.
 */
export function buildWslNativeWatcherScript(): string {
  return String.raw`import ctypes
import json
import os
import select
import struct
import sys

IN_MODIFY = 0x00000002
IN_ATTRIB = 0x00000004
IN_CLOSE_WRITE = 0x00000008
IN_MOVED_FROM = 0x00000040
IN_MOVED_TO = 0x00000080
IN_CREATE = 0x00000100
IN_DELETE = 0x00000200
IN_DELETE_SELF = 0x00000400
IN_MOVE_SELF = 0x00000800
IN_Q_OVERFLOW = 0x00004000
IN_IGNORED = 0x00008000
IN_ISDIR = 0x40000000
WATCH_MASK = (IN_MODIFY | IN_ATTRIB | IN_CLOSE_WRITE | IN_MOVED_FROM |
              IN_MOVED_TO | IN_CREATE | IN_DELETE | IN_DELETE_SELF | IN_MOVE_SELF)
MAX_EVENTS = 5000
EVENT = struct.Struct("iIII")

root = os.path.abspath(sys.argv[1])
ignored = set(sys.argv[2:])
libc = ctypes.CDLL(None, use_errno=True)
libc.inotify_init1.argtypes = [ctypes.c_int]
libc.inotify_init1.restype = ctypes.c_int
libc.inotify_add_watch.argtypes = [ctypes.c_int, ctypes.c_char_p, ctypes.c_uint32]
libc.inotify_add_watch.restype = ctypes.c_int
libc.inotify_rm_watch.argtypes = [ctypes.c_int, ctypes.c_int]
libc.inotify_rm_watch.restype = ctypes.c_int

def emit(message):
    sys.stdout.write(json.dumps(message, ensure_ascii=True, separators=(",", ":")) + "\n")
    sys.stdout.flush()

def fail(message):
    emit({"type": "error", "message": str(message)})
    raise SystemExit(1)

fd = libc.inotify_init1(os.O_CLOEXEC | os.O_NONBLOCK)
if fd < 0:
    fail(OSError(ctypes.get_errno(), os.strerror(ctypes.get_errno())))

watch_paths = {}
path_watches = {}

def add_watch(path):
    if path in path_watches:
        return
    wd = libc.inotify_add_watch(fd, os.fsencode(path), WATCH_MASK)
    if wd < 0:
        error = ctypes.get_errno()
        raise OSError(error, os.strerror(error), path)
    old_path = watch_paths.get(wd)
    if old_path is not None:
        path_watches.pop(old_path, None)
    watch_paths[wd] = path
    path_watches[path] = wd

def add_tree(path):
    pending = [path]
    while pending:
        directory = pending.pop()
        add_watch(directory)
        try:
            with os.scandir(directory) as entries:
                for entry in entries:
                    if entry.name in ignored:
                        continue
                    try:
                        if entry.is_dir(follow_symlinks=False):
                            pending.append(entry.path)
                    except OSError:
                        pass
        except FileNotFoundError:
            pass

def forget_watch(wd):
    path = watch_paths.pop(wd, None)
    if path is not None:
        path_watches.pop(path, None)

def remove_tree(path):
    prefix = path + os.sep
    for watched_path, wd in list(path_watches.items()):
        if watched_path != path and not watched_path.startswith(prefix):
            continue
        libc.inotify_rm_watch(fd, wd)
        forget_watch(wd)

def event_type(mask):
    if mask & (IN_DELETE | IN_MOVED_FROM | IN_DELETE_SELF | IN_MOVE_SELF):
        return "delete"
    if mask & (IN_CREATE | IN_MOVED_TO):
        return "create"
    if mask & (IN_MODIFY | IN_ATTRIB | IN_CLOSE_WRITE):
        return "update"
    return None

try:
    if not os.path.isdir(root):
        fail("watch root is not a directory: " + root)
    add_tree(root)
    emit({"type": "ready"})
    while True:
        select.select([fd], [], [])
        data = os.read(fd, 1024 * 1024)
        offset = 0
        changes = []
        overflowed = False
        while offset + EVENT.size <= len(data):
            wd, mask, cookie, name_length = EVENT.unpack_from(data, offset)
            offset += EVENT.size
            raw_name = data[offset:offset + name_length].split(b"\0", 1)[0]
            offset += name_length
            if mask & IN_Q_OVERFLOW:
                overflowed = True
                continue
            directory = watch_paths.get(wd)
            if directory is None:
                continue
            if mask & IN_IGNORED:
                forget_watch(wd)
                continue
            name = os.fsdecode(raw_name) if raw_name else ""
            if name in ignored:
                continue
            path = os.path.join(directory, name) if name else directory
            if mask & IN_ISDIR and mask & (IN_DELETE | IN_MOVED_FROM):
                remove_tree(path)
            if mask & IN_ISDIR and mask & (IN_CREATE | IN_MOVED_TO):
                add_tree(path)
            kind = event_type(mask)
            if kind is not None:
                changes.append([kind, path])
                if len(changes) > MAX_EVENTS:
                    changes = []
                    overflowed = True
            if path == root and mask & (IN_DELETE_SELF | IN_MOVE_SELF):
                overflowed = True
                emit({"type": "overflow"})
                raise SystemExit(1)
        if overflowed:
            emit({"type": "overflow"})
        elif changes:
            emit({"type": "events", "events": changes})
except (OSError, ValueError) as error:
    fail(error)
finally:
    os.close(fd)
`
}
