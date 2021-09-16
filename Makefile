WASM_SYSROOT = /opt/wasi-sdk/wasi-sysroot

CC = clang
AR = llvm-ar
LD = wasm-ld
CFLAGS = --target=wasm32-wasi --sysroot=$(WASM_SYSROOT)
LDFLAGS = -Wl,--export=malloc
LDFLAGS += -Wl,--export=free
LDFLAGS += -Wl,--export=ZSTD_isError
LDFLAGS += -Wl,--export=ZSTD_getErrorName
LDFLAGS += -Wl,--export=ZSTD_CStreamInSize
LDFLAGS += -Wl,--export=ZSTD_CStreamOutSize
LDFLAGS += -Wl,--export=ZSTD_compress
LDFLAGS += -Wl,--export=ZSTD_decompress
LDFLAGS += -Wl,--export=ZSTD_getFrameContentSize
LDFLAGS += -Wl,--export=ZSTD_createCCtx
LDFLAGS += -Wl,--export=ZSTD_freeCCtx
LDFLAGS += -Wl,--export=ZSTD_CCtx_setParameter
LDFLAGS += -Wl,--export=ZSTD_CCtx_setPledgedSrcSize
LDFLAGS += -Wl,--export=ZSTD_CCtx_reset
LDFLAGS += -Wl,--export=ZSTD_compressStream2_simpleArgs
LDFLAGS += -Wl,--export=ZSTD_createDCtx
LDFLAGS += -Wl,--export=ZSTD_freeDCtx
LDFLAGS += -Wl,--export=ZSTD_DCtx_setParameter
LDFLAGS += -Wl,--export=ZSTD_DCtx_reset
LDFLAGS += -Wl,--export=ZSTD_decompressStream_simpleArgs
LDFLAGS += -Wl,--no-entry
SONAME_FLAGS = -nostartfiles

.PHONY: all tests

all: libzstd.js

tests:
	node --experimental-wasi-unstable-preview1 tests/node-test.mjs
	deno run --unstable tests/deno-test.ts
	node --experimental-wasi-unstable-preview1 tests/node-test.mjs
	deno run --allow-read --unstable tests/deno-test-stream.ts

libzstd.js: libzstd.wasm
	npx wasmto-js < $< > $@

libzstd.wasm: zstd/lib/libzstd.so.1.5.0
	wasm-opt -Os -o $@ $<

zstd/lib/libzstd.so.1.5.0: zstd/Makefile
	$(MAKE) -Czstd lib-nomt CC=$(CC) AR=$(AR) LD=$(LD) CFLAGS='$(CFLAGS)' LDFLAGS='$(LDFLAGS)' SONAME_FLAGS='$(SONAME_FLAGS)'
