WASM_SYSROOT = /opt/wasi-sdk/wasi-sysroot

CC = clang
AR = llvm-ar
LD = wasm-ld
CFLAGS = --target=wasm32-wasi --sysroot=$(WASM_SYSROOT)
LDFLAGS = -Wl,--export=malloc -Wl,--export=free -Wl,--export=ZSTD_compress -Wl,--export=ZSTD_decompress -Wl,--no-entry
SONAME_FLAGS = -nostartfiles

.PHONY: all tests

all: libzstd.mjs

tests:
	node --experimental-wasi-unstable-preview1 tests/node-test.mjs
	deno run --unstable tests/deno-test.ts

libzstd.mjs: libzstd.wasm
	npx wasmto-js < $< > $@

libzstd.wasm: zstd/lib/libzstd.so.1.5.0
	wasm-opt -Os -o $@ $<

zstd/lib/libzstd.so.1.5.0: zstd/Makefile
	make -Czstd lib-nomt CC=$(CC) AR=$(AR) LD=$(LD) CFLAGS='$(CFLAGS)' LDFLAGS='$(LDFLAGS)' SONAME_FLAGS='$(SONAME_FLAGS)'
