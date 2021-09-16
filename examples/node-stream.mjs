import { WASI } from "wasi";
import { compile } from "simple-wasi-zstd";
const wasi = new WASI({});

const instance = await WebAssembly.instantiate(await compile(), {
    wasi_snapshot_preview1: wasi.wasiImport,
});
const exports = instance.exports;
const {memory, malloc, free, ZSTD_CStreamInSize, ZSTD_CStreamOutSize, ZSTD_createCCtx, ZSTD_freeCCtx, ZSTD_createDCtx, ZSTD_freeDCtx, ZSTD_CCtx_reset, ZSTD_DCtx_reset, ZSTD_compressStream2_simpleArgs, ZSTD_decompressStream_simpleArgs, ZSTD_isError} = exports;

class Cbuf {
    ptr;
    size;
    constructor(size) {
        const ptr = malloc(size);
        if (ptr < 0) {
            throw new Error();
        }
        this.ptr = ptr;
        this.size = size;
    }

    mem(size) {
        return new Uint8Array(memory.buffer, this.ptr, size || this.size);
    }

    free() {
        free(this.ptr);
        this.ptr = 0;
        this.size = 0;
    }
}

class SizetPtr {
    ptr;
    constructor() {
        this.ptr = malloc(Uint32Array.BYTES_PER_ELEMENT);
        if (!this.ptr) {
            throw new Error();
        }
    }

    get val() {
        return new Uint32Array(memory.buffer, this.ptr, Uint32Array.BYTES_PER_ELEMENT)[0];
    }

    set val(v) {
        new Uint32Array(memory.buffer, this.ptr, Uint32Array.BYTES_PER_ELEMENT)[0] = v;
    }

    free() {
        free(this.ptr);
    }
}

const input = "Hello, World!Hello, World!Hello, World!Hello, World!Hello, World!";

function proc(cctx, dctx, ibuf, ipos, obuf, opos) {
    ZSTD_CCtx_reset(cctx, 2);
    ZSTD_DCtx_reset(dctx, 2);

    const compressed = [];
    const encoder = new TextEncoder();
    let pos = 0;
    while (pos < input.length) {
        const { read, written } = encoder.encodeInto(input.slice(pos), ibuf.mem());
        pos += read;

        const last = !(pos < input.length);

        ipos.val = 0;
        while (true) {
            opos.val = 0;
            const mode = last ? 2: 0;
            const ret = ZSTD_compressStream2_simpleArgs(cctx, obuf.ptr, obuf.size, opos.ptr, ibuf.ptr, written, ipos.ptr, mode);
            if (ZSTD_isError(ret)) {
                throw new Error(`err ${ret}`);
            }
            if (opos.val !== 0) {
                compressed.push(...obuf.mem(opos.val));
            }
            if (last ? ret === 0 : written === ipos.val) {
                break;
            }
        }
    }

    ZSTD_CCtx_reset(cctx, 2);
    ZSTD_DCtx_reset(dctx, 2);

    const decompressed = [];
    const decoder = new TextDecoder();
    pos = 0;
    while (pos < compressed.length) {
        const n = Math.min(ibuf.size, compressed.length - pos);
        ibuf.mem().set(compressed.slice(pos, pos + n));
        pos += n;

        ipos.val = 0;
        while (true) {
            opos.val = 0;
            const ret = ZSTD_decompressStream_simpleArgs(dctx, obuf.ptr, obuf.size, opos.ptr, ibuf.ptr, n, ipos.ptr);
            if (ZSTD_isError(ret)) {
                throw new Error(`err ${ret}`);
            }
            if (opos.val !== 0) {
                decompressed.push(decoder.decode(obuf.mem(opos.val), { stream: true }));
                opos.val = 0;
            }
            if (n === ipos.val) {
                break;
            }
        }
    }
    if (input !== decompressed.join("")) {
        throw new Error(decompressed.join(""));
    }
}

const cctx = ZSTD_createCCtx();
try {
    const dctx = ZSTD_createDCtx();
    try {
        const ibuf = new Cbuf(ZSTD_CStreamInSize());
        try {
            const obuf = new Cbuf(ZSTD_CStreamOutSize());
            try {
                const ipos = new SizetPtr();
                try {
                    const opos = new SizetPtr();
                    try {
                        proc(cctx, dctx, ibuf, ipos, obuf, opos);
                    } finally {
                        opos.free();
                    }
                } finally {
                    ipos.free();
                }
            } finally {
                obuf.free();
            }
        } finally {
            ibuf.free();
        }
    } finally {
        ZSTD_freeDCtx(dctx);
    }
} finally {
    ZSTD_freeCCtx(cctx);
}

console.log("all okay.");
