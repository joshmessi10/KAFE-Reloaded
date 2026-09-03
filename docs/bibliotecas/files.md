# FILES — Manejo de Archivos

FILES provee operaciones de entrada/salida para manejo de archivos de texto.

**Importación:**

```kafe
import files;
```

---

## Referencia de Funciones

| Función | Firma Formal | Descripción |
|---------|-------------|-------------|
| `files.create` | `(STR) -> VOID` | Crea un archivo vacío |
| `files.write` | `(STR, STR) -> VOID` | Sobrescribe contenido |
| `files.read` | `(STR) -> STR` | Lee contenido completo |
| `files.delete` | `(STR) -> VOID` | Elimina el archivo |

---

## Ejemplo Completo

```kafe
import files;

-- Crear archivo
files.create("notas.txt");

-- Escribir contenido
files.write("notas.txt", "Primera línea");

-- Leer contenido
STR contenido = files.read("notas.txt");
show(contenido);

-- Eliminar archivo
files.delete("notas.txt");
```

---

## Manejo de Errores

| Error | Causa |
|-------|-------|
| **Directorio no existe** | En `create` si el directorio no existe |
| **Archivo protegido** | En `write` si el archivo está protegido |
| **Archivo no existe** | En `read` si el archivo no existe |
| **Permisos** | En `delete` si no se tienen permisos |

!!! note "Nota"
    Las rutas son relativas al directorio de ejecución. Leer un archivo inexistente lanza un error en tiempo de ejecución.
