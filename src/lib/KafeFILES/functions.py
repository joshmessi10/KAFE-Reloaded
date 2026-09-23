import os

from TypeUtils import string_type
from global_utils import check_sig
import globals


@check_sig([1], [string_type])
def create(filename):
    filename = os.path.join(globals.current_dir, filename)
    try:
        with open(filename, "x"):
            pass
    except FileExistsError:
        raise Exception(f"create: File {os.path.basename(filename)} already exists")


@check_sig([1], [string_type])
def read(filename):
    filename = os.path.join(globals.current_dir, filename)
    try:
        with open(filename, "r", encoding="utf-8") as f:
            content = f.read()
        return content
    except FileNotFoundError:
        raise Exception(f"read: File {os.path.basename(filename)} doesn't exist")


@check_sig([2], [string_type], [string_type])
def write(filename, content):
    filename = os.path.join(globals.current_dir, filename)
    try:
        with open(filename, "w", encoding="utf-8") as f:
            f.write(content + "\n")
    except OSError as e:
        raise Exception(f"write: Error writing on {os.path.basename(filename)}: {e}")


@check_sig([1], [string_type])
def delete(filename):
    filename = os.path.join(globals.current_dir, filename)
    try:
        os.remove(filename)
    except FileNotFoundError:
        raise Exception(f"delete: File {os.path.basename(filename)} doesn't exist")
