# Byte Ring Buffer

Standalone C11 FIFO for embedded byte streams. The library has no heap allocation,
OS dependency, or connection to the web app. Storage is supplied by the caller.

## Contract

Include `include/ring_buffer.h` and compile `src/ring_buffer.c` into your firmware.
Zero-initialize the control structure, then call `rb_init` with writable storage
and a nonzero capacity. All slots are usable; capacity need not be a power of two.
Storage must stay valid and must not overlap the control structure. Do not modify
control fields directly. The caller is responsible for the actual allocation size.

- `rb_push` and `rb_pop` transfer a byte in FIFO order.
- `rb_write` and `rb_read` transfer exactly the requested byte count.
- Transfers wrap at the storage boundary without overwriting unread data.
- `rb_reset` discards queued bytes without erasing the backing storage.
- Zero-length bulk transfers succeed and permit a null data pointer.
- Invalid arguments or invalid control fields return `RB_INVALID_ARGUMENT`.
- Single-byte operations return `RB_FULL` or `RB_EMPTY` when unavailable.
- Bulk operations return `RB_NO_SPACE` or `RB_NO_DATA` if the whole transfer cannot
  be completed. Errors leave buffer state and read output unchanged.
- Bulk input/output must not overlap backing storage or the control structure.

This is not a lock-free or interrupt-safe buffer. Serialize access externally,
including task/ISR access. It does not detect dangling pointers or overwrite by
other code, persist data, or erase sensitive bytes.

## Build and run

Requires GCC, its matching gcov, GNU Make, LCOV 2.x, and genhtml. On Debian/Ubuntu:

```sh
sudo apt-get update
sudo apt-get install -y build-essential lcov
```

From the repository root:

```sh
make -C embedded/ring_buffer test
make -C embedded/ring_buffer coverage
```

The four checks cover initialization, byte FIFO order, bulk FIFO order, and reset
and reuse. The build uses strict warnings and coverage instrumentation. Each
coverage run rebuilds and resets counters so results represent that run.

## Reports

All paths below are relative to `embedded/ring_buffer/`:

| Output | Path |
| --- | --- |
| gcov annotated source and branch counts | `coverage/ring_buffer.c.gcov` |
| LCOV trace | `coverage/lcov.info` |
| HTML report | `coverage/html/index.html` |
| Raw compiler counters | `build/*.gcno` and `build/*.gcda` |

The LCOV report includes the library source only; the test runner is excluded.
Branch coverage is enabled. These results are independent of the web app's
JavaScript coverage and are not merged into its percentages. Generated files
are ignored by Git. `make -C embedded/ring_buffer clean` removes native outputs.

## Recorded coverage

A GCC/gcov 13.3.0 and LCOV 2.0 run passed all four checks:

| Metric | Covered | Total | Coverage |
| --- | ---: | ---: | ---: |
| Lines | 50 | 60 | 83.3% |
| Functions | 8 | 8 | 100.0% |
| Branches taken | 28 | 52 | 53.8% |

Coverage measures execution, not proof of correctness. The commands above
regenerate the detailed source and branch reports locally.
