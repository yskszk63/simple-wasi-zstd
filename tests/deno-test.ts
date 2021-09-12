import WASI from "https://deno.land/std@0.106.0/wasi/snapshot_preview1.ts";
import { compile } from "../libzstd.mjs";

const wasi = new WASI({});

interface Zstd {
    memory: WebAssembly.Memory;
    malloc(size: number): number;
    free(ptr: number): void;
    ZSTD_compress(dst: number, dstCapacity: number, src: number, srcSize: number, compressionLevel: number): number;
    ZSTD_decompress(dst: number, dstCapacity: number, src: number, compressedSize: number): number;
}

type ZstdExports = Zstd & WebAssembly.Exports;

const instance = await WebAssembly.instantiate(await compile(), {
    wasi_snapshot_preview1: wasi.exports,
});
const exports = instance.exports as ZstdExports;
const {memory, malloc, free, ZSTD_compress, ZSTD_decompress} = exports;

const input = "Hello, World!Hello, World!Hello, World!Hello, World!";
const len = input.length;
const ptr = malloc(len);
try {
    const buf = new Uint8Array(memory.buffer, ptr, len);
    new TextEncoder().encodeInto(input, buf);

    const dstlen = 8 * 1024;
    const dstptr = malloc(dstlen);
    try {
        const ret = ZSTD_compress(dstptr, dstlen, ptr, len, 0);

        const dstlen2 = 8 * 1024;
        const dstptr2 = malloc(dstlen);
        try {
            const ret2 = ZSTD_decompress(dstptr2, dstlen2, dstptr, ret);
            const answer = new Uint8Array(memory.buffer, dstptr2, ret2);
            if (new TextDecoder().decode(answer) !== input) {
                throw new Error("assertion failed.");
            }
        } finally {
            free(dstptr2);
        }
    } finally {
        free(dstptr);
    }

} finally {
    free(ptr);
}
console.log("all okay.");
