# FILES — File operations

FILES provides input and output operations for text files.

**Import:**

```kafe
import files;
```

---

## Function reference

| Function | Signature | Description |
|---------|-------------|-------------|
| `files.create` | `(STR) -> VOID` | Creates an empty file |
| `files.write` | `(STR, STR) -> VOID` | Overwrites file contents |
| `files.read` | `(STR) -> STR` | Reads the full contents |
| `files.delete` | `(STR) -> VOID` | Deletes the file |

---

## Complete example

```kafe
import files;

-- Create a file
files.create("notes.txt");

-- Write contents
files.write("notes.txt", "First line");

-- Read contents
STR content = files.read("notes.txt");
show(content);

-- Delete the file
files.delete("notes.txt");
```

---

## Error handling

| Error | Cause |
|-------|-------|
| **Directory does not exist** | `create` is called with a nonexistent directory |
| **File is protected** | `write` is called for a protected file |
| **File does not exist** | `read` is called for a nonexistent file |
| **Insufficient permissions** | `delete` is called without sufficient permissions |

!!! note "Note"
    Paths are relative to the execution directory. Reading a nonexistent file raises a runtime error.
