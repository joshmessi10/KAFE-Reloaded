"""Read intended KAFE wrapper exports and source-local public object members."""
import ast
import json
import sys
from pathlib import Path


def inventory(repository):
    result = {}
    for library, filename in (
        ("machine", "src/lib/KafeMACHINE/functions.py"),
        ("gesha", "src/lib/KafeGESHA/functions_v2.py"),
    ):
        tree = ast.parse((repository / filename).read_text(encoding="utf-8-sig"))
        names = {node.name for node in tree.body if isinstance(node, ast.FunctionDef) and not node.name.startswith("_")}
        aliases = {}
        for node in tree.body:
            if library == "machine" and isinstance(node, ast.ImportFrom) and node.module == "metrics":
                names.update(item.asname or item.name for item in node.names)
            if isinstance(node, ast.Assign) and isinstance(node.value, ast.Name):
                for target in node.targets:
                    if isinstance(target, ast.Name) and not target.id.startswith("_") and node.value.id in names:
                        aliases[target.id] = node.value.id
        owners = {}
        source_root = repository / "src/lib" / ("KafeMACHINE" if library == "machine" else "KafeGESHA")
        for source in sorted(source_root.rglob("*.py")):
            module = ast.parse(source.read_text(encoding="utf-8-sig"))
            for node in module.body:
                if not isinstance(node, ast.ClassDef) or node.name.startswith("_"):
                    continue
                members = []
                for member in node.body:
                    if isinstance(member, (ast.FunctionDef, ast.AsyncFunctionDef)) and not member.name.startswith("_"):
                        kind = "property" if any(isinstance(item, ast.Name) and item.id == "property" for item in member.decorator_list) else "method"
                        members.append({"symbol": f"{node.name}.{member.name}", "kind": kind,
                                        "line": member.lineno})
                if members:
                    fields = sorted({item.attr for item in ast.walk(node) if isinstance(item, ast.Attribute)
                                     and isinstance(item.value, ast.Name) and item.value.id == "self"
                                     and not item.attr.startswith("_")})
                    owners.setdefault(node.name, []).append({"source": source.relative_to(repository).as_posix(),
                                                            "members": members, "fields": fields})
        result[library] = {"functions": sorted(names), "aliases": aliases, "owners": owners}
    return result


if __name__ == "__main__":
    print(json.dumps(inventory(Path(sys.argv[1]).resolve()), ensure_ascii=False))
