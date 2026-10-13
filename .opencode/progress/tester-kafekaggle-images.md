# Tester Report — KafeKAGGLE Image Ingestion API

**Date:** 2026-10-13
**Role:** Tester — validation and benchmark of the generic image API (`load_image`, `load_images`, `load_image_dataset`) and the `ImageDataset` container.
**Related:** `.opencode/progress/impact-kafekaggle-images.md`, `.opencode/progress/builder-kafekaggle-images.md`

## 1. Full test suite

Command (exactly as requested):

```
pytest tests/ -q
```

Result:

- **628 passed, 2 skipped** in 287.65 s (0:04:47). Suite is GREEN.
- The 2 skips are preexisting (pre-feature baseline: 577 passed, 1 skipped).
- The new image backend tests (`tests/test_KafeKaggle_backend.py`, 64 tests) pass and touch no network and install no packages.

## 2. Offline benchmark — how to run

```
python .opencode/benchmarks/kafekaggle_images.py
```

- Script: `.opencode/benchmarks/kafekaggle_images.py`.
- OFFLINE by design: it does NOT use the network and does NOT install packages.
  - `_download_dataset` is replaced by a `tempfile.TemporaryDirectory` filled with synthetic 32x32 PNGs generated with Pillow.
  - `_require_image_dependencies` is replaced by a double returning `(PIL.Image, None)`, so `py7zr` is not required.
  - If Pillow is not installed, the script detects it, prints a clear message and exits, WITHOUT installing it.
- Per scenario: the public function is called 3 times inside `tracemalloc`; runtime is the median of `time.perf_counter()` and peak is the max of `tracemalloc.get_traced_memory()[1]` (converted to MB).
- A 1-image warm-up runs both `load_images` and `load_image_dataset` first (avoids lazy imports/first-call noise).

Environment: Python 3.13.11, Windows 11 (10.0.26200), Pillow 12.3.0, 12 logical CPUs.

## 3. Results (5 scenarios, synthetic data)

| Scenario | N | Channels | Time (ms) | Peak (MB) |
|----------|---:|---:|---:|---:|
| load_images rgb N=8 | 8 | 3 | 172.847 | 0.800 |
| load_images rgb N=64 | 64 | 3 | 1301.638 | 6.406 |
| load_images rgb N=256 | 256 | 3 | 6047.247 | 25.609 |
| load_images gray N=256 | 256 | 1 | 1551.444 | 8.603 |
| load_image_dataset N=256 (rgb) | 256 | 3 | 5923.080 | 25.642 |

Raw script output:

```
Python 3.13.11 | Windows-11-10.0.26200-SP0 | Pillow 12.3.0 | CPUs 12

| Escenario | N | Canales | Tiempo (ms) | Pico (MB) |
|---|---:|---:|---:|---:|
| load_images rgb N=8 | 8 | 3 | 172.847 | 0.800 |
| load_images rgb N=64 | 64 | 3 | 1301.638 | 6.406 |
| load_images rgb N=256 | 256 | 3 | 6047.247 | 25.609 |
| load_images gray N=256 | 256 | 1 | 1551.444 | 8.603 |
| load_image_dataset N=256 (rgb) | 256 | 3 | 5923.080 | 25.642 |
```

## 4. Performance and memory observations (R3)

- **Memory scales linearly with N x C x H x W (risk R3 confirmed).** Peak grows about 0.1 MB per 32x32 rgb image: 0.800 MB at N=8, 6.406 MB at N=64, 25.609 MB at N=256. That is roughly 32 bytes per pixel (boxed Python float plus list pointer) plus per-list overhead, the expected cost of the nested `[C][H][W]` Python lists.
- **Extrapolation:** a CIFAR-10 style set (4000 rgb 32x32) needs about 400 MB; the full 50000-image train split about 5 GB. `limit` is the documented mitigation; otherwise `load_images` / `load_image_dataset` materialize everything.
- **Gray is about one third the memory and about 4x faster** than rgb at the same N (8.603 MB / 1551 ms vs 25.609 MB / 6047 ms at N=256), as expected for 1 channel vs 3.
- **Runtime is dominated by the pure-Python per-pixel normalization loop** (about 24 ms per rgb image). It is O(N x C x H x W) with no vectorization in the from-scratch/educational implementation; gray is proportionally cheaper.
- **`load_image_dataset` adds negligible overhead** versus `load_images` (5923 vs 6047 ms for N=256 rgb): CSV label parsing, matching and 0..N-1 encoding are cheap next to image decoding/normalization.
- **Scope of measurement:** offline and synthetic, so it isolates the deterministic ingestion cost. It excludes network download (R4) and 7z extraction (R5) that the real CIFAR-10 flow would add.

## 5. Conclusion

- Suite `pytest tests/ -q`: **GREEN** (628 passed, 2 skipped).
- Benchmark: **recorded** in `.opencode/benchmarks/records.md` (5 scenarios, real offline measurements, synthetic data — not real CIFAR-10).
- Risk R3 (memory O(N x C x H x W)) is **measured**, not assumed; `limit` is the mitigation.
