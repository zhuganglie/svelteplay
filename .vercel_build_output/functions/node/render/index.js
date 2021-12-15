var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[Object.keys(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// node_modules/@sveltejs/kit/dist/install-fetch.js
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i]}`;
      if (meta[i].indexOf("charset=") === 0) {
        charset = meta[i].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
async function* toIterator(parts, clone2 = true) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else if (ArrayBuffer.isView(part)) {
      if (clone2) {
        let position = part.byteOffset;
        const end = part.byteOffset + part.byteLength;
        while (position !== end) {
          const size = Math.min(end - position, POOL_SIZE);
          const chunk = part.buffer.slice(position, position + size);
          position += chunk.byteLength;
          yield new Uint8Array(chunk);
        }
      } else {
        yield part;
      }
    } else {
      let position = 0;
      while (position !== part.size) {
        const chunk = part.slice(position, Math.min(part.size, position + POOL_SIZE));
        const buffer = await chunk.arrayBuffer();
        position += buffer.byteLength;
        yield new Uint8Array(buffer);
      }
    }
  }
}
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
function getHeader(boundary, name, field) {
  let header = "";
  header += `${dashes}${boundary}${carriage}`;
  header += `Content-Disposition: form-data; name="${name}"`;
  if (isBlob(field)) {
    header += `; filename="${field.name}"${carriage}`;
    header += `Content-Type: ${field.type || "application/octet-stream"}`;
  }
  return `${header}${carriage.repeat(2)}`;
}
async function* formDataIterator(form, boundary) {
  for (const [name, value] of form) {
    yield getHeader(boundary, name, value);
    if (isBlob(value)) {
      yield* value.stream();
    } else {
      yield value;
    }
    yield carriage;
  }
  yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
  let length = 0;
  for (const [name, value] of form) {
    length += Buffer.byteLength(getHeader(boundary, name, value));
    length += isBlob(value) ? value.size : Buffer.byteLength(String(value));
    length += carriageLength;
  }
  length += Buffer.byteLength(getFooter(boundary));
  return length;
}
async function consumeBody(data) {
  if (data[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS$2].disturbed = true;
  if (data[INTERNALS$2].error) {
    throw data[INTERNALS$2].error;
  }
  let { body: body4 } = data;
  if (body4 === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body4)) {
    body4 = import_stream.default.Readable.from(body4.stream());
  }
  if (Buffer.isBuffer(body4)) {
    return body4;
  }
  if (!(body4 instanceof import_stream.default)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body4) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const error2 = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body4.destroy(error2);
        throw error2;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error2) {
    const error_ = error2 instanceof FetchBaseError ? error2 : new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error2.message}`, "system", error2);
    throw error_;
  }
  if (body4.readableEnded === true || body4._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error2) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error2.message}`, "system", error2);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index, array) => {
    if (index % 2 === 0) {
      result.push(array.slice(index, index + 2));
    }
    return result;
  }, []).filter(([name, value]) => {
    try {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return true;
    } catch {
      return false;
    }
  }));
}
async function fetch(url, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url, options_);
    const options2 = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options2.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${options2.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options2.protocol === "data:") {
      const data = dataUriToBuffer$1(request.url);
      const response2 = new Response(data, { headers: { "Content-Type": data.typeFull } });
      resolve2(response2);
      return;
    }
    const send = (options2.protocol === "https:" ? import_https.default : import_http.default).request;
    const { signal } = request;
    let response = null;
    const abort = () => {
      const error2 = new AbortError("The operation was aborted.");
      reject(error2);
      if (request.body && request.body instanceof import_stream.default.Readable) {
        request.body.destroy(error2);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error2);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(options2);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (error2) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${error2.message}`, "system", error2));
      finalize();
    });
    fixResponseChunkedTransferBadEnding(request_, (error2) => {
      response.body.destroy(error2);
    });
    if (process.version < "v14") {
      request_.on("socket", (s2) => {
        let endedWithEventsCount;
        s2.prependListener("end", () => {
          endedWithEventsCount = s2._eventsCount;
        });
        s2.prependListener("close", (hadError) => {
          if (response && endedWithEventsCount < s2._eventsCount && !hadError) {
            const error2 = new Error("Premature close");
            error2.code = "ERR_STREAM_PREMATURE_CLOSE";
            response.body.emit("error", error2);
          }
        });
      });
    }
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location = headers.get("Location");
        const locationURL = location === null ? null : new URL(location, request.url);
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            if (locationURL !== null) {
              headers.set("Location", locationURL);
            }
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal,
              size: request.size
            };
            if (response_.statusCode !== 303 && request.body && options_.body instanceof import_stream.default.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            resolve2(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
          default:
            return reject(new TypeError(`Redirect option '${request.redirect}' is not a valid value of RequestRedirect`));
        }
      }
      if (signal) {
        response_.once("end", () => {
          signal.removeEventListener("abort", abortAndFinalize);
        });
      }
      let body4 = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), reject);
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body4, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: import_zlib.default.Z_SYNC_FLUSH,
        finishFlush: import_zlib.default.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body4 = (0, import_stream.pipeline)(body4, import_zlib.default.createGunzip(zlibOptions), reject);
        response = new Response(body4, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), reject);
        raw.once("data", (chunk) => {
          body4 = (chunk[0] & 15) === 8 ? (0, import_stream.pipeline)(body4, import_zlib.default.createInflate(), reject) : (0, import_stream.pipeline)(body4, import_zlib.default.createInflateRaw(), reject);
          response = new Response(body4, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body4 = (0, import_stream.pipeline)(body4, import_zlib.default.createBrotliDecompress(), reject);
        response = new Response(body4, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body4, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
function fixResponseChunkedTransferBadEnding(request, errorCallback) {
  const LAST_CHUNK = Buffer.from("0\r\n\r\n");
  let isChunkedTransfer = false;
  let properLastChunkReceived = false;
  let previousChunk;
  request.on("response", (response) => {
    const { headers } = response;
    isChunkedTransfer = headers["transfer-encoding"] === "chunked" && !headers["content-length"];
  });
  request.on("socket", (socket) => {
    const onSocketClose = () => {
      if (isChunkedTransfer && !properLastChunkReceived) {
        const error2 = new Error("Premature close");
        error2.code = "ERR_STREAM_PREMATURE_CLOSE";
        errorCallback(error2);
      }
    };
    socket.prependListener("close", onSocketClose);
    request.on("abort", () => {
      socket.removeListener("close", onSocketClose);
    });
    socket.on("data", (buf) => {
      properLastChunkReceived = Buffer.compare(buf.slice(-5), LAST_CHUNK) === 0;
      if (!properLastChunkReceived && previousChunk) {
        properLastChunkReceived = Buffer.compare(previousChunk.slice(-3), LAST_CHUNK.slice(0, 3)) === 0 && Buffer.compare(buf.slice(-2), LAST_CHUNK.slice(3)) === 0;
      }
      previousChunk = buf;
    });
  });
}
var import_http, import_https, import_zlib, import_stream, import_util, import_crypto, import_url, commonjsGlobal, src, dataUriToBuffer$1, ponyfill_es2018, POOL_SIZE$1, POOL_SIZE, _Blob, Blob2, Blob$1, FetchBaseError, FetchError, NAME, isURLSearchParameters, isBlob, isAbortSignal, carriage, dashes, carriageLength, getFooter, getBoundary, INTERNALS$2, Body, clone, extractContentType, getTotalBytes, writeToStream, validateHeaderName, validateHeaderValue, Headers, redirectStatus, isRedirect, INTERNALS$1, Response, getSearch, INTERNALS, isRequest, Request, getNodeRequestOptions, AbortError, supportedSchemas;
var init_install_fetch = __esm({
  "node_modules/@sveltejs/kit/dist/install-fetch.js"() {
    init_shims();
    import_http = __toModule(require("http"));
    import_https = __toModule(require("https"));
    import_zlib = __toModule(require("zlib"));
    import_stream = __toModule(require("stream"));
    import_util = __toModule(require("util"));
    import_crypto = __toModule(require("crypto"));
    import_url = __toModule(require("url"));
    commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
    src = dataUriToBuffer;
    dataUriToBuffer$1 = src;
    ponyfill_es2018 = { exports: {} };
    (function(module2, exports) {
      (function(global2, factory) {
        factory(exports);
      })(commonjsGlobal, function(exports2) {
        const SymbolPolyfill = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? Symbol : (description) => `Symbol(${description})`;
        function noop2() {
          return void 0;
        }
        function getGlobals() {
          if (typeof self !== "undefined") {
            return self;
          } else if (typeof window !== "undefined") {
            return window;
          } else if (typeof commonjsGlobal !== "undefined") {
            return commonjsGlobal;
          }
          return void 0;
        }
        const globals2 = getGlobals();
        function typeIsObject(x) {
          return typeof x === "object" && x !== null || typeof x === "function";
        }
        const rethrowAssertionErrorRejection = noop2;
        const originalPromise = Promise;
        const originalPromiseThen = Promise.prototype.then;
        const originalPromiseResolve = Promise.resolve.bind(originalPromise);
        const originalPromiseReject = Promise.reject.bind(originalPromise);
        function newPromise(executor) {
          return new originalPromise(executor);
        }
        function promiseResolvedWith(value) {
          return originalPromiseResolve(value);
        }
        function promiseRejectedWith(reason) {
          return originalPromiseReject(reason);
        }
        function PerformPromiseThen(promise, onFulfilled, onRejected) {
          return originalPromiseThen.call(promise, onFulfilled, onRejected);
        }
        function uponPromise(promise, onFulfilled, onRejected) {
          PerformPromiseThen(PerformPromiseThen(promise, onFulfilled, onRejected), void 0, rethrowAssertionErrorRejection);
        }
        function uponFulfillment(promise, onFulfilled) {
          uponPromise(promise, onFulfilled);
        }
        function uponRejection(promise, onRejected) {
          uponPromise(promise, void 0, onRejected);
        }
        function transformPromiseWith(promise, fulfillmentHandler, rejectionHandler) {
          return PerformPromiseThen(promise, fulfillmentHandler, rejectionHandler);
        }
        function setPromiseIsHandledToTrue(promise) {
          PerformPromiseThen(promise, void 0, rethrowAssertionErrorRejection);
        }
        const queueMicrotask = (() => {
          const globalQueueMicrotask = globals2 && globals2.queueMicrotask;
          if (typeof globalQueueMicrotask === "function") {
            return globalQueueMicrotask;
          }
          const resolvedPromise = promiseResolvedWith(void 0);
          return (fn) => PerformPromiseThen(resolvedPromise, fn);
        })();
        function reflectCall(F, V, args) {
          if (typeof F !== "function") {
            throw new TypeError("Argument is not a function");
          }
          return Function.prototype.apply.call(F, V, args);
        }
        function promiseCall(F, V, args) {
          try {
            return promiseResolvedWith(reflectCall(F, V, args));
          } catch (value) {
            return promiseRejectedWith(value);
          }
        }
        const QUEUE_MAX_ARRAY_SIZE = 16384;
        class SimpleQueue {
          constructor() {
            this._cursor = 0;
            this._size = 0;
            this._front = {
              _elements: [],
              _next: void 0
            };
            this._back = this._front;
            this._cursor = 0;
            this._size = 0;
          }
          get length() {
            return this._size;
          }
          push(element) {
            const oldBack = this._back;
            let newBack = oldBack;
            if (oldBack._elements.length === QUEUE_MAX_ARRAY_SIZE - 1) {
              newBack = {
                _elements: [],
                _next: void 0
              };
            }
            oldBack._elements.push(element);
            if (newBack !== oldBack) {
              this._back = newBack;
              oldBack._next = newBack;
            }
            ++this._size;
          }
          shift() {
            const oldFront = this._front;
            let newFront = oldFront;
            const oldCursor = this._cursor;
            let newCursor = oldCursor + 1;
            const elements = oldFront._elements;
            const element = elements[oldCursor];
            if (newCursor === QUEUE_MAX_ARRAY_SIZE) {
              newFront = oldFront._next;
              newCursor = 0;
            }
            --this._size;
            this._cursor = newCursor;
            if (oldFront !== newFront) {
              this._front = newFront;
            }
            elements[oldCursor] = void 0;
            return element;
          }
          forEach(callback) {
            let i = this._cursor;
            let node = this._front;
            let elements = node._elements;
            while (i !== elements.length || node._next !== void 0) {
              if (i === elements.length) {
                node = node._next;
                elements = node._elements;
                i = 0;
                if (elements.length === 0) {
                  break;
                }
              }
              callback(elements[i]);
              ++i;
            }
          }
          peek() {
            const front = this._front;
            const cursor = this._cursor;
            return front._elements[cursor];
          }
        }
        function ReadableStreamReaderGenericInitialize(reader, stream) {
          reader._ownerReadableStream = stream;
          stream._reader = reader;
          if (stream._state === "readable") {
            defaultReaderClosedPromiseInitialize(reader);
          } else if (stream._state === "closed") {
            defaultReaderClosedPromiseInitializeAsResolved(reader);
          } else {
            defaultReaderClosedPromiseInitializeAsRejected(reader, stream._storedError);
          }
        }
        function ReadableStreamReaderGenericCancel(reader, reason) {
          const stream = reader._ownerReadableStream;
          return ReadableStreamCancel(stream, reason);
        }
        function ReadableStreamReaderGenericRelease(reader) {
          if (reader._ownerReadableStream._state === "readable") {
            defaultReaderClosedPromiseReject(reader, new TypeError(`Reader was released and can no longer be used to monitor the stream's closedness`));
          } else {
            defaultReaderClosedPromiseResetToRejected(reader, new TypeError(`Reader was released and can no longer be used to monitor the stream's closedness`));
          }
          reader._ownerReadableStream._reader = void 0;
          reader._ownerReadableStream = void 0;
        }
        function readerLockException(name) {
          return new TypeError("Cannot " + name + " a stream using a released reader");
        }
        function defaultReaderClosedPromiseInitialize(reader) {
          reader._closedPromise = newPromise((resolve2, reject) => {
            reader._closedPromise_resolve = resolve2;
            reader._closedPromise_reject = reject;
          });
        }
        function defaultReaderClosedPromiseInitializeAsRejected(reader, reason) {
          defaultReaderClosedPromiseInitialize(reader);
          defaultReaderClosedPromiseReject(reader, reason);
        }
        function defaultReaderClosedPromiseInitializeAsResolved(reader) {
          defaultReaderClosedPromiseInitialize(reader);
          defaultReaderClosedPromiseResolve(reader);
        }
        function defaultReaderClosedPromiseReject(reader, reason) {
          if (reader._closedPromise_reject === void 0) {
            return;
          }
          setPromiseIsHandledToTrue(reader._closedPromise);
          reader._closedPromise_reject(reason);
          reader._closedPromise_resolve = void 0;
          reader._closedPromise_reject = void 0;
        }
        function defaultReaderClosedPromiseResetToRejected(reader, reason) {
          defaultReaderClosedPromiseInitializeAsRejected(reader, reason);
        }
        function defaultReaderClosedPromiseResolve(reader) {
          if (reader._closedPromise_resolve === void 0) {
            return;
          }
          reader._closedPromise_resolve(void 0);
          reader._closedPromise_resolve = void 0;
          reader._closedPromise_reject = void 0;
        }
        const AbortSteps = SymbolPolyfill("[[AbortSteps]]");
        const ErrorSteps = SymbolPolyfill("[[ErrorSteps]]");
        const CancelSteps = SymbolPolyfill("[[CancelSteps]]");
        const PullSteps = SymbolPolyfill("[[PullSteps]]");
        const NumberIsFinite = Number.isFinite || function(x) {
          return typeof x === "number" && isFinite(x);
        };
        const MathTrunc = Math.trunc || function(v) {
          return v < 0 ? Math.ceil(v) : Math.floor(v);
        };
        function isDictionary(x) {
          return typeof x === "object" || typeof x === "function";
        }
        function assertDictionary(obj, context) {
          if (obj !== void 0 && !isDictionary(obj)) {
            throw new TypeError(`${context} is not an object.`);
          }
        }
        function assertFunction(x, context) {
          if (typeof x !== "function") {
            throw new TypeError(`${context} is not a function.`);
          }
        }
        function isObject(x) {
          return typeof x === "object" && x !== null || typeof x === "function";
        }
        function assertObject(x, context) {
          if (!isObject(x)) {
            throw new TypeError(`${context} is not an object.`);
          }
        }
        function assertRequiredArgument(x, position, context) {
          if (x === void 0) {
            throw new TypeError(`Parameter ${position} is required in '${context}'.`);
          }
        }
        function assertRequiredField(x, field, context) {
          if (x === void 0) {
            throw new TypeError(`${field} is required in '${context}'.`);
          }
        }
        function convertUnrestrictedDouble(value) {
          return Number(value);
        }
        function censorNegativeZero(x) {
          return x === 0 ? 0 : x;
        }
        function integerPart(x) {
          return censorNegativeZero(MathTrunc(x));
        }
        function convertUnsignedLongLongWithEnforceRange(value, context) {
          const lowerBound = 0;
          const upperBound = Number.MAX_SAFE_INTEGER;
          let x = Number(value);
          x = censorNegativeZero(x);
          if (!NumberIsFinite(x)) {
            throw new TypeError(`${context} is not a finite number`);
          }
          x = integerPart(x);
          if (x < lowerBound || x > upperBound) {
            throw new TypeError(`${context} is outside the accepted range of ${lowerBound} to ${upperBound}, inclusive`);
          }
          if (!NumberIsFinite(x) || x === 0) {
            return 0;
          }
          return x;
        }
        function assertReadableStream(x, context) {
          if (!IsReadableStream(x)) {
            throw new TypeError(`${context} is not a ReadableStream.`);
          }
        }
        function AcquireReadableStreamDefaultReader(stream) {
          return new ReadableStreamDefaultReader(stream);
        }
        function ReadableStreamAddReadRequest(stream, readRequest) {
          stream._reader._readRequests.push(readRequest);
        }
        function ReadableStreamFulfillReadRequest(stream, chunk, done) {
          const reader = stream._reader;
          const readRequest = reader._readRequests.shift();
          if (done) {
            readRequest._closeSteps();
          } else {
            readRequest._chunkSteps(chunk);
          }
        }
        function ReadableStreamGetNumReadRequests(stream) {
          return stream._reader._readRequests.length;
        }
        function ReadableStreamHasDefaultReader(stream) {
          const reader = stream._reader;
          if (reader === void 0) {
            return false;
          }
          if (!IsReadableStreamDefaultReader(reader)) {
            return false;
          }
          return true;
        }
        class ReadableStreamDefaultReader {
          constructor(stream) {
            assertRequiredArgument(stream, 1, "ReadableStreamDefaultReader");
            assertReadableStream(stream, "First parameter");
            if (IsReadableStreamLocked(stream)) {
              throw new TypeError("This stream has already been locked for exclusive reading by another reader");
            }
            ReadableStreamReaderGenericInitialize(this, stream);
            this._readRequests = new SimpleQueue();
          }
          get closed() {
            if (!IsReadableStreamDefaultReader(this)) {
              return promiseRejectedWith(defaultReaderBrandCheckException("closed"));
            }
            return this._closedPromise;
          }
          cancel(reason = void 0) {
            if (!IsReadableStreamDefaultReader(this)) {
              return promiseRejectedWith(defaultReaderBrandCheckException("cancel"));
            }
            if (this._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("cancel"));
            }
            return ReadableStreamReaderGenericCancel(this, reason);
          }
          read() {
            if (!IsReadableStreamDefaultReader(this)) {
              return promiseRejectedWith(defaultReaderBrandCheckException("read"));
            }
            if (this._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("read from"));
            }
            let resolvePromise;
            let rejectPromise;
            const promise = newPromise((resolve2, reject) => {
              resolvePromise = resolve2;
              rejectPromise = reject;
            });
            const readRequest = {
              _chunkSteps: (chunk) => resolvePromise({ value: chunk, done: false }),
              _closeSteps: () => resolvePromise({ value: void 0, done: true }),
              _errorSteps: (e) => rejectPromise(e)
            };
            ReadableStreamDefaultReaderRead(this, readRequest);
            return promise;
          }
          releaseLock() {
            if (!IsReadableStreamDefaultReader(this)) {
              throw defaultReaderBrandCheckException("releaseLock");
            }
            if (this._ownerReadableStream === void 0) {
              return;
            }
            if (this._readRequests.length > 0) {
              throw new TypeError("Tried to release a reader lock when that reader has pending read() calls un-settled");
            }
            ReadableStreamReaderGenericRelease(this);
          }
        }
        Object.defineProperties(ReadableStreamDefaultReader.prototype, {
          cancel: { enumerable: true },
          read: { enumerable: true },
          releaseLock: { enumerable: true },
          closed: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStreamDefaultReader.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStreamDefaultReader",
            configurable: true
          });
        }
        function IsReadableStreamDefaultReader(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_readRequests")) {
            return false;
          }
          return x instanceof ReadableStreamDefaultReader;
        }
        function ReadableStreamDefaultReaderRead(reader, readRequest) {
          const stream = reader._ownerReadableStream;
          stream._disturbed = true;
          if (stream._state === "closed") {
            readRequest._closeSteps();
          } else if (stream._state === "errored") {
            readRequest._errorSteps(stream._storedError);
          } else {
            stream._readableStreamController[PullSteps](readRequest);
          }
        }
        function defaultReaderBrandCheckException(name) {
          return new TypeError(`ReadableStreamDefaultReader.prototype.${name} can only be used on a ReadableStreamDefaultReader`);
        }
        const AsyncIteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf(async function* () {
        }).prototype);
        class ReadableStreamAsyncIteratorImpl {
          constructor(reader, preventCancel) {
            this._ongoingPromise = void 0;
            this._isFinished = false;
            this._reader = reader;
            this._preventCancel = preventCancel;
          }
          next() {
            const nextSteps = () => this._nextSteps();
            this._ongoingPromise = this._ongoingPromise ? transformPromiseWith(this._ongoingPromise, nextSteps, nextSteps) : nextSteps();
            return this._ongoingPromise;
          }
          return(value) {
            const returnSteps = () => this._returnSteps(value);
            return this._ongoingPromise ? transformPromiseWith(this._ongoingPromise, returnSteps, returnSteps) : returnSteps();
          }
          _nextSteps() {
            if (this._isFinished) {
              return Promise.resolve({ value: void 0, done: true });
            }
            const reader = this._reader;
            if (reader._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("iterate"));
            }
            let resolvePromise;
            let rejectPromise;
            const promise = newPromise((resolve2, reject) => {
              resolvePromise = resolve2;
              rejectPromise = reject;
            });
            const readRequest = {
              _chunkSteps: (chunk) => {
                this._ongoingPromise = void 0;
                queueMicrotask(() => resolvePromise({ value: chunk, done: false }));
              },
              _closeSteps: () => {
                this._ongoingPromise = void 0;
                this._isFinished = true;
                ReadableStreamReaderGenericRelease(reader);
                resolvePromise({ value: void 0, done: true });
              },
              _errorSteps: (reason) => {
                this._ongoingPromise = void 0;
                this._isFinished = true;
                ReadableStreamReaderGenericRelease(reader);
                rejectPromise(reason);
              }
            };
            ReadableStreamDefaultReaderRead(reader, readRequest);
            return promise;
          }
          _returnSteps(value) {
            if (this._isFinished) {
              return Promise.resolve({ value, done: true });
            }
            this._isFinished = true;
            const reader = this._reader;
            if (reader._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("finish iterating"));
            }
            if (!this._preventCancel) {
              const result = ReadableStreamReaderGenericCancel(reader, value);
              ReadableStreamReaderGenericRelease(reader);
              return transformPromiseWith(result, () => ({ value, done: true }));
            }
            ReadableStreamReaderGenericRelease(reader);
            return promiseResolvedWith({ value, done: true });
          }
        }
        const ReadableStreamAsyncIteratorPrototype = {
          next() {
            if (!IsReadableStreamAsyncIterator(this)) {
              return promiseRejectedWith(streamAsyncIteratorBrandCheckException("next"));
            }
            return this._asyncIteratorImpl.next();
          },
          return(value) {
            if (!IsReadableStreamAsyncIterator(this)) {
              return promiseRejectedWith(streamAsyncIteratorBrandCheckException("return"));
            }
            return this._asyncIteratorImpl.return(value);
          }
        };
        if (AsyncIteratorPrototype !== void 0) {
          Object.setPrototypeOf(ReadableStreamAsyncIteratorPrototype, AsyncIteratorPrototype);
        }
        function AcquireReadableStreamAsyncIterator(stream, preventCancel) {
          const reader = AcquireReadableStreamDefaultReader(stream);
          const impl = new ReadableStreamAsyncIteratorImpl(reader, preventCancel);
          const iterator = Object.create(ReadableStreamAsyncIteratorPrototype);
          iterator._asyncIteratorImpl = impl;
          return iterator;
        }
        function IsReadableStreamAsyncIterator(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_asyncIteratorImpl")) {
            return false;
          }
          try {
            return x._asyncIteratorImpl instanceof ReadableStreamAsyncIteratorImpl;
          } catch (_a) {
            return false;
          }
        }
        function streamAsyncIteratorBrandCheckException(name) {
          return new TypeError(`ReadableStreamAsyncIterator.${name} can only be used on a ReadableSteamAsyncIterator`);
        }
        const NumberIsNaN = Number.isNaN || function(x) {
          return x !== x;
        };
        function CreateArrayFromList(elements) {
          return elements.slice();
        }
        function CopyDataBlockBytes(dest, destOffset, src2, srcOffset, n) {
          new Uint8Array(dest).set(new Uint8Array(src2, srcOffset, n), destOffset);
        }
        function TransferArrayBuffer(O) {
          return O;
        }
        function IsDetachedBuffer(O) {
          return false;
        }
        function ArrayBufferSlice(buffer, begin, end) {
          if (buffer.slice) {
            return buffer.slice(begin, end);
          }
          const length = end - begin;
          const slice = new ArrayBuffer(length);
          CopyDataBlockBytes(slice, 0, buffer, begin, length);
          return slice;
        }
        function IsNonNegativeNumber(v) {
          if (typeof v !== "number") {
            return false;
          }
          if (NumberIsNaN(v)) {
            return false;
          }
          if (v < 0) {
            return false;
          }
          return true;
        }
        function CloneAsUint8Array(O) {
          const buffer = ArrayBufferSlice(O.buffer, O.byteOffset, O.byteOffset + O.byteLength);
          return new Uint8Array(buffer);
        }
        function DequeueValue(container) {
          const pair = container._queue.shift();
          container._queueTotalSize -= pair.size;
          if (container._queueTotalSize < 0) {
            container._queueTotalSize = 0;
          }
          return pair.value;
        }
        function EnqueueValueWithSize(container, value, size) {
          if (!IsNonNegativeNumber(size) || size === Infinity) {
            throw new RangeError("Size must be a finite, non-NaN, non-negative number.");
          }
          container._queue.push({ value, size });
          container._queueTotalSize += size;
        }
        function PeekQueueValue(container) {
          const pair = container._queue.peek();
          return pair.value;
        }
        function ResetQueue(container) {
          container._queue = new SimpleQueue();
          container._queueTotalSize = 0;
        }
        class ReadableStreamBYOBRequest {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get view() {
            if (!IsReadableStreamBYOBRequest(this)) {
              throw byobRequestBrandCheckException("view");
            }
            return this._view;
          }
          respond(bytesWritten) {
            if (!IsReadableStreamBYOBRequest(this)) {
              throw byobRequestBrandCheckException("respond");
            }
            assertRequiredArgument(bytesWritten, 1, "respond");
            bytesWritten = convertUnsignedLongLongWithEnforceRange(bytesWritten, "First parameter");
            if (this._associatedReadableByteStreamController === void 0) {
              throw new TypeError("This BYOB request has been invalidated");
            }
            if (IsDetachedBuffer(this._view.buffer))
              ;
            ReadableByteStreamControllerRespond(this._associatedReadableByteStreamController, bytesWritten);
          }
          respondWithNewView(view) {
            if (!IsReadableStreamBYOBRequest(this)) {
              throw byobRequestBrandCheckException("respondWithNewView");
            }
            assertRequiredArgument(view, 1, "respondWithNewView");
            if (!ArrayBuffer.isView(view)) {
              throw new TypeError("You can only respond with array buffer views");
            }
            if (this._associatedReadableByteStreamController === void 0) {
              throw new TypeError("This BYOB request has been invalidated");
            }
            if (IsDetachedBuffer(view.buffer))
              ;
            ReadableByteStreamControllerRespondWithNewView(this._associatedReadableByteStreamController, view);
          }
        }
        Object.defineProperties(ReadableStreamBYOBRequest.prototype, {
          respond: { enumerable: true },
          respondWithNewView: { enumerable: true },
          view: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStreamBYOBRequest.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStreamBYOBRequest",
            configurable: true
          });
        }
        class ReadableByteStreamController {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get byobRequest() {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("byobRequest");
            }
            return ReadableByteStreamControllerGetBYOBRequest(this);
          }
          get desiredSize() {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("desiredSize");
            }
            return ReadableByteStreamControllerGetDesiredSize(this);
          }
          close() {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("close");
            }
            if (this._closeRequested) {
              throw new TypeError("The stream has already been closed; do not close it again!");
            }
            const state = this._controlledReadableByteStream._state;
            if (state !== "readable") {
              throw new TypeError(`The stream (in ${state} state) is not in the readable state and cannot be closed`);
            }
            ReadableByteStreamControllerClose(this);
          }
          enqueue(chunk) {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("enqueue");
            }
            assertRequiredArgument(chunk, 1, "enqueue");
            if (!ArrayBuffer.isView(chunk)) {
              throw new TypeError("chunk must be an array buffer view");
            }
            if (chunk.byteLength === 0) {
              throw new TypeError("chunk must have non-zero byteLength");
            }
            if (chunk.buffer.byteLength === 0) {
              throw new TypeError(`chunk's buffer must have non-zero byteLength`);
            }
            if (this._closeRequested) {
              throw new TypeError("stream is closed or draining");
            }
            const state = this._controlledReadableByteStream._state;
            if (state !== "readable") {
              throw new TypeError(`The stream (in ${state} state) is not in the readable state and cannot be enqueued to`);
            }
            ReadableByteStreamControllerEnqueue(this, chunk);
          }
          error(e = void 0) {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("error");
            }
            ReadableByteStreamControllerError(this, e);
          }
          [CancelSteps](reason) {
            ReadableByteStreamControllerClearPendingPullIntos(this);
            ResetQueue(this);
            const result = this._cancelAlgorithm(reason);
            ReadableByteStreamControllerClearAlgorithms(this);
            return result;
          }
          [PullSteps](readRequest) {
            const stream = this._controlledReadableByteStream;
            if (this._queueTotalSize > 0) {
              const entry = this._queue.shift();
              this._queueTotalSize -= entry.byteLength;
              ReadableByteStreamControllerHandleQueueDrain(this);
              const view = new Uint8Array(entry.buffer, entry.byteOffset, entry.byteLength);
              readRequest._chunkSteps(view);
              return;
            }
            const autoAllocateChunkSize = this._autoAllocateChunkSize;
            if (autoAllocateChunkSize !== void 0) {
              let buffer;
              try {
                buffer = new ArrayBuffer(autoAllocateChunkSize);
              } catch (bufferE) {
                readRequest._errorSteps(bufferE);
                return;
              }
              const pullIntoDescriptor = {
                buffer,
                bufferByteLength: autoAllocateChunkSize,
                byteOffset: 0,
                byteLength: autoAllocateChunkSize,
                bytesFilled: 0,
                elementSize: 1,
                viewConstructor: Uint8Array,
                readerType: "default"
              };
              this._pendingPullIntos.push(pullIntoDescriptor);
            }
            ReadableStreamAddReadRequest(stream, readRequest);
            ReadableByteStreamControllerCallPullIfNeeded(this);
          }
        }
        Object.defineProperties(ReadableByteStreamController.prototype, {
          close: { enumerable: true },
          enqueue: { enumerable: true },
          error: { enumerable: true },
          byobRequest: { enumerable: true },
          desiredSize: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableByteStreamController.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableByteStreamController",
            configurable: true
          });
        }
        function IsReadableByteStreamController(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_controlledReadableByteStream")) {
            return false;
          }
          return x instanceof ReadableByteStreamController;
        }
        function IsReadableStreamBYOBRequest(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_associatedReadableByteStreamController")) {
            return false;
          }
          return x instanceof ReadableStreamBYOBRequest;
        }
        function ReadableByteStreamControllerCallPullIfNeeded(controller) {
          const shouldPull = ReadableByteStreamControllerShouldCallPull(controller);
          if (!shouldPull) {
            return;
          }
          if (controller._pulling) {
            controller._pullAgain = true;
            return;
          }
          controller._pulling = true;
          const pullPromise = controller._pullAlgorithm();
          uponPromise(pullPromise, () => {
            controller._pulling = false;
            if (controller._pullAgain) {
              controller._pullAgain = false;
              ReadableByteStreamControllerCallPullIfNeeded(controller);
            }
          }, (e) => {
            ReadableByteStreamControllerError(controller, e);
          });
        }
        function ReadableByteStreamControllerClearPendingPullIntos(controller) {
          ReadableByteStreamControllerInvalidateBYOBRequest(controller);
          controller._pendingPullIntos = new SimpleQueue();
        }
        function ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor) {
          let done = false;
          if (stream._state === "closed") {
            done = true;
          }
          const filledView = ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
          if (pullIntoDescriptor.readerType === "default") {
            ReadableStreamFulfillReadRequest(stream, filledView, done);
          } else {
            ReadableStreamFulfillReadIntoRequest(stream, filledView, done);
          }
        }
        function ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor) {
          const bytesFilled = pullIntoDescriptor.bytesFilled;
          const elementSize = pullIntoDescriptor.elementSize;
          return new pullIntoDescriptor.viewConstructor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, bytesFilled / elementSize);
        }
        function ReadableByteStreamControllerEnqueueChunkToQueue(controller, buffer, byteOffset, byteLength) {
          controller._queue.push({ buffer, byteOffset, byteLength });
          controller._queueTotalSize += byteLength;
        }
        function ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor) {
          const elementSize = pullIntoDescriptor.elementSize;
          const currentAlignedBytes = pullIntoDescriptor.bytesFilled - pullIntoDescriptor.bytesFilled % elementSize;
          const maxBytesToCopy = Math.min(controller._queueTotalSize, pullIntoDescriptor.byteLength - pullIntoDescriptor.bytesFilled);
          const maxBytesFilled = pullIntoDescriptor.bytesFilled + maxBytesToCopy;
          const maxAlignedBytes = maxBytesFilled - maxBytesFilled % elementSize;
          let totalBytesToCopyRemaining = maxBytesToCopy;
          let ready = false;
          if (maxAlignedBytes > currentAlignedBytes) {
            totalBytesToCopyRemaining = maxAlignedBytes - pullIntoDescriptor.bytesFilled;
            ready = true;
          }
          const queue = controller._queue;
          while (totalBytesToCopyRemaining > 0) {
            const headOfQueue = queue.peek();
            const bytesToCopy = Math.min(totalBytesToCopyRemaining, headOfQueue.byteLength);
            const destStart = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
            CopyDataBlockBytes(pullIntoDescriptor.buffer, destStart, headOfQueue.buffer, headOfQueue.byteOffset, bytesToCopy);
            if (headOfQueue.byteLength === bytesToCopy) {
              queue.shift();
            } else {
              headOfQueue.byteOffset += bytesToCopy;
              headOfQueue.byteLength -= bytesToCopy;
            }
            controller._queueTotalSize -= bytesToCopy;
            ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, bytesToCopy, pullIntoDescriptor);
            totalBytesToCopyRemaining -= bytesToCopy;
          }
          return ready;
        }
        function ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, size, pullIntoDescriptor) {
          pullIntoDescriptor.bytesFilled += size;
        }
        function ReadableByteStreamControllerHandleQueueDrain(controller) {
          if (controller._queueTotalSize === 0 && controller._closeRequested) {
            ReadableByteStreamControllerClearAlgorithms(controller);
            ReadableStreamClose(controller._controlledReadableByteStream);
          } else {
            ReadableByteStreamControllerCallPullIfNeeded(controller);
          }
        }
        function ReadableByteStreamControllerInvalidateBYOBRequest(controller) {
          if (controller._byobRequest === null) {
            return;
          }
          controller._byobRequest._associatedReadableByteStreamController = void 0;
          controller._byobRequest._view = null;
          controller._byobRequest = null;
        }
        function ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller) {
          while (controller._pendingPullIntos.length > 0) {
            if (controller._queueTotalSize === 0) {
              return;
            }
            const pullIntoDescriptor = controller._pendingPullIntos.peek();
            if (ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor)) {
              ReadableByteStreamControllerShiftPendingPullInto(controller);
              ReadableByteStreamControllerCommitPullIntoDescriptor(controller._controlledReadableByteStream, pullIntoDescriptor);
            }
          }
        }
        function ReadableByteStreamControllerPullInto(controller, view, readIntoRequest) {
          const stream = controller._controlledReadableByteStream;
          let elementSize = 1;
          if (view.constructor !== DataView) {
            elementSize = view.constructor.BYTES_PER_ELEMENT;
          }
          const ctor = view.constructor;
          const buffer = TransferArrayBuffer(view.buffer);
          const pullIntoDescriptor = {
            buffer,
            bufferByteLength: buffer.byteLength,
            byteOffset: view.byteOffset,
            byteLength: view.byteLength,
            bytesFilled: 0,
            elementSize,
            viewConstructor: ctor,
            readerType: "byob"
          };
          if (controller._pendingPullIntos.length > 0) {
            controller._pendingPullIntos.push(pullIntoDescriptor);
            ReadableStreamAddReadIntoRequest(stream, readIntoRequest);
            return;
          }
          if (stream._state === "closed") {
            const emptyView = new ctor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, 0);
            readIntoRequest._closeSteps(emptyView);
            return;
          }
          if (controller._queueTotalSize > 0) {
            if (ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor)) {
              const filledView = ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
              ReadableByteStreamControllerHandleQueueDrain(controller);
              readIntoRequest._chunkSteps(filledView);
              return;
            }
            if (controller._closeRequested) {
              const e = new TypeError("Insufficient bytes to fill elements in the given buffer");
              ReadableByteStreamControllerError(controller, e);
              readIntoRequest._errorSteps(e);
              return;
            }
          }
          controller._pendingPullIntos.push(pullIntoDescriptor);
          ReadableStreamAddReadIntoRequest(stream, readIntoRequest);
          ReadableByteStreamControllerCallPullIfNeeded(controller);
        }
        function ReadableByteStreamControllerRespondInClosedState(controller, firstDescriptor) {
          const stream = controller._controlledReadableByteStream;
          if (ReadableStreamHasBYOBReader(stream)) {
            while (ReadableStreamGetNumReadIntoRequests(stream) > 0) {
              const pullIntoDescriptor = ReadableByteStreamControllerShiftPendingPullInto(controller);
              ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor);
            }
          }
        }
        function ReadableByteStreamControllerRespondInReadableState(controller, bytesWritten, pullIntoDescriptor) {
          ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, bytesWritten, pullIntoDescriptor);
          if (pullIntoDescriptor.bytesFilled < pullIntoDescriptor.elementSize) {
            return;
          }
          ReadableByteStreamControllerShiftPendingPullInto(controller);
          const remainderSize = pullIntoDescriptor.bytesFilled % pullIntoDescriptor.elementSize;
          if (remainderSize > 0) {
            const end = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
            const remainder = ArrayBufferSlice(pullIntoDescriptor.buffer, end - remainderSize, end);
            ReadableByteStreamControllerEnqueueChunkToQueue(controller, remainder, 0, remainder.byteLength);
          }
          pullIntoDescriptor.bytesFilled -= remainderSize;
          ReadableByteStreamControllerCommitPullIntoDescriptor(controller._controlledReadableByteStream, pullIntoDescriptor);
          ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
        }
        function ReadableByteStreamControllerRespondInternal(controller, bytesWritten) {
          const firstDescriptor = controller._pendingPullIntos.peek();
          ReadableByteStreamControllerInvalidateBYOBRequest(controller);
          const state = controller._controlledReadableByteStream._state;
          if (state === "closed") {
            ReadableByteStreamControllerRespondInClosedState(controller);
          } else {
            ReadableByteStreamControllerRespondInReadableState(controller, bytesWritten, firstDescriptor);
          }
          ReadableByteStreamControllerCallPullIfNeeded(controller);
        }
        function ReadableByteStreamControllerShiftPendingPullInto(controller) {
          const descriptor = controller._pendingPullIntos.shift();
          return descriptor;
        }
        function ReadableByteStreamControllerShouldCallPull(controller) {
          const stream = controller._controlledReadableByteStream;
          if (stream._state !== "readable") {
            return false;
          }
          if (controller._closeRequested) {
            return false;
          }
          if (!controller._started) {
            return false;
          }
          if (ReadableStreamHasDefaultReader(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
            return true;
          }
          if (ReadableStreamHasBYOBReader(stream) && ReadableStreamGetNumReadIntoRequests(stream) > 0) {
            return true;
          }
          const desiredSize = ReadableByteStreamControllerGetDesiredSize(controller);
          if (desiredSize > 0) {
            return true;
          }
          return false;
        }
        function ReadableByteStreamControllerClearAlgorithms(controller) {
          controller._pullAlgorithm = void 0;
          controller._cancelAlgorithm = void 0;
        }
        function ReadableByteStreamControllerClose(controller) {
          const stream = controller._controlledReadableByteStream;
          if (controller._closeRequested || stream._state !== "readable") {
            return;
          }
          if (controller._queueTotalSize > 0) {
            controller._closeRequested = true;
            return;
          }
          if (controller._pendingPullIntos.length > 0) {
            const firstPendingPullInto = controller._pendingPullIntos.peek();
            if (firstPendingPullInto.bytesFilled > 0) {
              const e = new TypeError("Insufficient bytes to fill elements in the given buffer");
              ReadableByteStreamControllerError(controller, e);
              throw e;
            }
          }
          ReadableByteStreamControllerClearAlgorithms(controller);
          ReadableStreamClose(stream);
        }
        function ReadableByteStreamControllerEnqueue(controller, chunk) {
          const stream = controller._controlledReadableByteStream;
          if (controller._closeRequested || stream._state !== "readable") {
            return;
          }
          const buffer = chunk.buffer;
          const byteOffset = chunk.byteOffset;
          const byteLength = chunk.byteLength;
          const transferredBuffer = TransferArrayBuffer(buffer);
          if (controller._pendingPullIntos.length > 0) {
            const firstPendingPullInto = controller._pendingPullIntos.peek();
            if (IsDetachedBuffer(firstPendingPullInto.buffer))
              ;
            firstPendingPullInto.buffer = TransferArrayBuffer(firstPendingPullInto.buffer);
          }
          ReadableByteStreamControllerInvalidateBYOBRequest(controller);
          if (ReadableStreamHasDefaultReader(stream)) {
            if (ReadableStreamGetNumReadRequests(stream) === 0) {
              ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
            } else {
              const transferredView = new Uint8Array(transferredBuffer, byteOffset, byteLength);
              ReadableStreamFulfillReadRequest(stream, transferredView, false);
            }
          } else if (ReadableStreamHasBYOBReader(stream)) {
            ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
            ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
          } else {
            ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
          }
          ReadableByteStreamControllerCallPullIfNeeded(controller);
        }
        function ReadableByteStreamControllerError(controller, e) {
          const stream = controller._controlledReadableByteStream;
          if (stream._state !== "readable") {
            return;
          }
          ReadableByteStreamControllerClearPendingPullIntos(controller);
          ResetQueue(controller);
          ReadableByteStreamControllerClearAlgorithms(controller);
          ReadableStreamError(stream, e);
        }
        function ReadableByteStreamControllerGetBYOBRequest(controller) {
          if (controller._byobRequest === null && controller._pendingPullIntos.length > 0) {
            const firstDescriptor = controller._pendingPullIntos.peek();
            const view = new Uint8Array(firstDescriptor.buffer, firstDescriptor.byteOffset + firstDescriptor.bytesFilled, firstDescriptor.byteLength - firstDescriptor.bytesFilled);
            const byobRequest = Object.create(ReadableStreamBYOBRequest.prototype);
            SetUpReadableStreamBYOBRequest(byobRequest, controller, view);
            controller._byobRequest = byobRequest;
          }
          return controller._byobRequest;
        }
        function ReadableByteStreamControllerGetDesiredSize(controller) {
          const state = controller._controlledReadableByteStream._state;
          if (state === "errored") {
            return null;
          }
          if (state === "closed") {
            return 0;
          }
          return controller._strategyHWM - controller._queueTotalSize;
        }
        function ReadableByteStreamControllerRespond(controller, bytesWritten) {
          const firstDescriptor = controller._pendingPullIntos.peek();
          const state = controller._controlledReadableByteStream._state;
          if (state === "closed") {
            if (bytesWritten !== 0) {
              throw new TypeError("bytesWritten must be 0 when calling respond() on a closed stream");
            }
          } else {
            if (bytesWritten === 0) {
              throw new TypeError("bytesWritten must be greater than 0 when calling respond() on a readable stream");
            }
            if (firstDescriptor.bytesFilled + bytesWritten > firstDescriptor.byteLength) {
              throw new RangeError("bytesWritten out of range");
            }
          }
          firstDescriptor.buffer = TransferArrayBuffer(firstDescriptor.buffer);
          ReadableByteStreamControllerRespondInternal(controller, bytesWritten);
        }
        function ReadableByteStreamControllerRespondWithNewView(controller, view) {
          const firstDescriptor = controller._pendingPullIntos.peek();
          const state = controller._controlledReadableByteStream._state;
          if (state === "closed") {
            if (view.byteLength !== 0) {
              throw new TypeError("The view's length must be 0 when calling respondWithNewView() on a closed stream");
            }
          } else {
            if (view.byteLength === 0) {
              throw new TypeError("The view's length must be greater than 0 when calling respondWithNewView() on a readable stream");
            }
          }
          if (firstDescriptor.byteOffset + firstDescriptor.bytesFilled !== view.byteOffset) {
            throw new RangeError("The region specified by view does not match byobRequest");
          }
          if (firstDescriptor.bufferByteLength !== view.buffer.byteLength) {
            throw new RangeError("The buffer of view has different capacity than byobRequest");
          }
          if (firstDescriptor.bytesFilled + view.byteLength > firstDescriptor.byteLength) {
            throw new RangeError("The region specified by view is larger than byobRequest");
          }
          firstDescriptor.buffer = TransferArrayBuffer(view.buffer);
          ReadableByteStreamControllerRespondInternal(controller, view.byteLength);
        }
        function SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, autoAllocateChunkSize) {
          controller._controlledReadableByteStream = stream;
          controller._pullAgain = false;
          controller._pulling = false;
          controller._byobRequest = null;
          controller._queue = controller._queueTotalSize = void 0;
          ResetQueue(controller);
          controller._closeRequested = false;
          controller._started = false;
          controller._strategyHWM = highWaterMark;
          controller._pullAlgorithm = pullAlgorithm;
          controller._cancelAlgorithm = cancelAlgorithm;
          controller._autoAllocateChunkSize = autoAllocateChunkSize;
          controller._pendingPullIntos = new SimpleQueue();
          stream._readableStreamController = controller;
          const startResult = startAlgorithm();
          uponPromise(promiseResolvedWith(startResult), () => {
            controller._started = true;
            ReadableByteStreamControllerCallPullIfNeeded(controller);
          }, (r) => {
            ReadableByteStreamControllerError(controller, r);
          });
        }
        function SetUpReadableByteStreamControllerFromUnderlyingSource(stream, underlyingByteSource, highWaterMark) {
          const controller = Object.create(ReadableByteStreamController.prototype);
          let startAlgorithm = () => void 0;
          let pullAlgorithm = () => promiseResolvedWith(void 0);
          let cancelAlgorithm = () => promiseResolvedWith(void 0);
          if (underlyingByteSource.start !== void 0) {
            startAlgorithm = () => underlyingByteSource.start(controller);
          }
          if (underlyingByteSource.pull !== void 0) {
            pullAlgorithm = () => underlyingByteSource.pull(controller);
          }
          if (underlyingByteSource.cancel !== void 0) {
            cancelAlgorithm = (reason) => underlyingByteSource.cancel(reason);
          }
          const autoAllocateChunkSize = underlyingByteSource.autoAllocateChunkSize;
          if (autoAllocateChunkSize === 0) {
            throw new TypeError("autoAllocateChunkSize must be greater than 0");
          }
          SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, autoAllocateChunkSize);
        }
        function SetUpReadableStreamBYOBRequest(request, controller, view) {
          request._associatedReadableByteStreamController = controller;
          request._view = view;
        }
        function byobRequestBrandCheckException(name) {
          return new TypeError(`ReadableStreamBYOBRequest.prototype.${name} can only be used on a ReadableStreamBYOBRequest`);
        }
        function byteStreamControllerBrandCheckException(name) {
          return new TypeError(`ReadableByteStreamController.prototype.${name} can only be used on a ReadableByteStreamController`);
        }
        function AcquireReadableStreamBYOBReader(stream) {
          return new ReadableStreamBYOBReader(stream);
        }
        function ReadableStreamAddReadIntoRequest(stream, readIntoRequest) {
          stream._reader._readIntoRequests.push(readIntoRequest);
        }
        function ReadableStreamFulfillReadIntoRequest(stream, chunk, done) {
          const reader = stream._reader;
          const readIntoRequest = reader._readIntoRequests.shift();
          if (done) {
            readIntoRequest._closeSteps(chunk);
          } else {
            readIntoRequest._chunkSteps(chunk);
          }
        }
        function ReadableStreamGetNumReadIntoRequests(stream) {
          return stream._reader._readIntoRequests.length;
        }
        function ReadableStreamHasBYOBReader(stream) {
          const reader = stream._reader;
          if (reader === void 0) {
            return false;
          }
          if (!IsReadableStreamBYOBReader(reader)) {
            return false;
          }
          return true;
        }
        class ReadableStreamBYOBReader {
          constructor(stream) {
            assertRequiredArgument(stream, 1, "ReadableStreamBYOBReader");
            assertReadableStream(stream, "First parameter");
            if (IsReadableStreamLocked(stream)) {
              throw new TypeError("This stream has already been locked for exclusive reading by another reader");
            }
            if (!IsReadableByteStreamController(stream._readableStreamController)) {
              throw new TypeError("Cannot construct a ReadableStreamBYOBReader for a stream not constructed with a byte source");
            }
            ReadableStreamReaderGenericInitialize(this, stream);
            this._readIntoRequests = new SimpleQueue();
          }
          get closed() {
            if (!IsReadableStreamBYOBReader(this)) {
              return promiseRejectedWith(byobReaderBrandCheckException("closed"));
            }
            return this._closedPromise;
          }
          cancel(reason = void 0) {
            if (!IsReadableStreamBYOBReader(this)) {
              return promiseRejectedWith(byobReaderBrandCheckException("cancel"));
            }
            if (this._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("cancel"));
            }
            return ReadableStreamReaderGenericCancel(this, reason);
          }
          read(view) {
            if (!IsReadableStreamBYOBReader(this)) {
              return promiseRejectedWith(byobReaderBrandCheckException("read"));
            }
            if (!ArrayBuffer.isView(view)) {
              return promiseRejectedWith(new TypeError("view must be an array buffer view"));
            }
            if (view.byteLength === 0) {
              return promiseRejectedWith(new TypeError("view must have non-zero byteLength"));
            }
            if (view.buffer.byteLength === 0) {
              return promiseRejectedWith(new TypeError(`view's buffer must have non-zero byteLength`));
            }
            if (IsDetachedBuffer(view.buffer))
              ;
            if (this._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("read from"));
            }
            let resolvePromise;
            let rejectPromise;
            const promise = newPromise((resolve2, reject) => {
              resolvePromise = resolve2;
              rejectPromise = reject;
            });
            const readIntoRequest = {
              _chunkSteps: (chunk) => resolvePromise({ value: chunk, done: false }),
              _closeSteps: (chunk) => resolvePromise({ value: chunk, done: true }),
              _errorSteps: (e) => rejectPromise(e)
            };
            ReadableStreamBYOBReaderRead(this, view, readIntoRequest);
            return promise;
          }
          releaseLock() {
            if (!IsReadableStreamBYOBReader(this)) {
              throw byobReaderBrandCheckException("releaseLock");
            }
            if (this._ownerReadableStream === void 0) {
              return;
            }
            if (this._readIntoRequests.length > 0) {
              throw new TypeError("Tried to release a reader lock when that reader has pending read() calls un-settled");
            }
            ReadableStreamReaderGenericRelease(this);
          }
        }
        Object.defineProperties(ReadableStreamBYOBReader.prototype, {
          cancel: { enumerable: true },
          read: { enumerable: true },
          releaseLock: { enumerable: true },
          closed: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStreamBYOBReader.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStreamBYOBReader",
            configurable: true
          });
        }
        function IsReadableStreamBYOBReader(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_readIntoRequests")) {
            return false;
          }
          return x instanceof ReadableStreamBYOBReader;
        }
        function ReadableStreamBYOBReaderRead(reader, view, readIntoRequest) {
          const stream = reader._ownerReadableStream;
          stream._disturbed = true;
          if (stream._state === "errored") {
            readIntoRequest._errorSteps(stream._storedError);
          } else {
            ReadableByteStreamControllerPullInto(stream._readableStreamController, view, readIntoRequest);
          }
        }
        function byobReaderBrandCheckException(name) {
          return new TypeError(`ReadableStreamBYOBReader.prototype.${name} can only be used on a ReadableStreamBYOBReader`);
        }
        function ExtractHighWaterMark(strategy, defaultHWM) {
          const { highWaterMark } = strategy;
          if (highWaterMark === void 0) {
            return defaultHWM;
          }
          if (NumberIsNaN(highWaterMark) || highWaterMark < 0) {
            throw new RangeError("Invalid highWaterMark");
          }
          return highWaterMark;
        }
        function ExtractSizeAlgorithm(strategy) {
          const { size } = strategy;
          if (!size) {
            return () => 1;
          }
          return size;
        }
        function convertQueuingStrategy(init2, context) {
          assertDictionary(init2, context);
          const highWaterMark = init2 === null || init2 === void 0 ? void 0 : init2.highWaterMark;
          const size = init2 === null || init2 === void 0 ? void 0 : init2.size;
          return {
            highWaterMark: highWaterMark === void 0 ? void 0 : convertUnrestrictedDouble(highWaterMark),
            size: size === void 0 ? void 0 : convertQueuingStrategySize(size, `${context} has member 'size' that`)
          };
        }
        function convertQueuingStrategySize(fn, context) {
          assertFunction(fn, context);
          return (chunk) => convertUnrestrictedDouble(fn(chunk));
        }
        function convertUnderlyingSink(original, context) {
          assertDictionary(original, context);
          const abort = original === null || original === void 0 ? void 0 : original.abort;
          const close = original === null || original === void 0 ? void 0 : original.close;
          const start = original === null || original === void 0 ? void 0 : original.start;
          const type = original === null || original === void 0 ? void 0 : original.type;
          const write = original === null || original === void 0 ? void 0 : original.write;
          return {
            abort: abort === void 0 ? void 0 : convertUnderlyingSinkAbortCallback(abort, original, `${context} has member 'abort' that`),
            close: close === void 0 ? void 0 : convertUnderlyingSinkCloseCallback(close, original, `${context} has member 'close' that`),
            start: start === void 0 ? void 0 : convertUnderlyingSinkStartCallback(start, original, `${context} has member 'start' that`),
            write: write === void 0 ? void 0 : convertUnderlyingSinkWriteCallback(write, original, `${context} has member 'write' that`),
            type
          };
        }
        function convertUnderlyingSinkAbortCallback(fn, original, context) {
          assertFunction(fn, context);
          return (reason) => promiseCall(fn, original, [reason]);
        }
        function convertUnderlyingSinkCloseCallback(fn, original, context) {
          assertFunction(fn, context);
          return () => promiseCall(fn, original, []);
        }
        function convertUnderlyingSinkStartCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => reflectCall(fn, original, [controller]);
        }
        function convertUnderlyingSinkWriteCallback(fn, original, context) {
          assertFunction(fn, context);
          return (chunk, controller) => promiseCall(fn, original, [chunk, controller]);
        }
        function assertWritableStream(x, context) {
          if (!IsWritableStream(x)) {
            throw new TypeError(`${context} is not a WritableStream.`);
          }
        }
        function isAbortSignal2(value) {
          if (typeof value !== "object" || value === null) {
            return false;
          }
          try {
            return typeof value.aborted === "boolean";
          } catch (_a) {
            return false;
          }
        }
        const supportsAbortController = typeof AbortController === "function";
        function createAbortController() {
          if (supportsAbortController) {
            return new AbortController();
          }
          return void 0;
        }
        class WritableStream {
          constructor(rawUnderlyingSink = {}, rawStrategy = {}) {
            if (rawUnderlyingSink === void 0) {
              rawUnderlyingSink = null;
            } else {
              assertObject(rawUnderlyingSink, "First parameter");
            }
            const strategy = convertQueuingStrategy(rawStrategy, "Second parameter");
            const underlyingSink = convertUnderlyingSink(rawUnderlyingSink, "First parameter");
            InitializeWritableStream(this);
            const type = underlyingSink.type;
            if (type !== void 0) {
              throw new RangeError("Invalid type is specified");
            }
            const sizeAlgorithm = ExtractSizeAlgorithm(strategy);
            const highWaterMark = ExtractHighWaterMark(strategy, 1);
            SetUpWritableStreamDefaultControllerFromUnderlyingSink(this, underlyingSink, highWaterMark, sizeAlgorithm);
          }
          get locked() {
            if (!IsWritableStream(this)) {
              throw streamBrandCheckException$2("locked");
            }
            return IsWritableStreamLocked(this);
          }
          abort(reason = void 0) {
            if (!IsWritableStream(this)) {
              return promiseRejectedWith(streamBrandCheckException$2("abort"));
            }
            if (IsWritableStreamLocked(this)) {
              return promiseRejectedWith(new TypeError("Cannot abort a stream that already has a writer"));
            }
            return WritableStreamAbort(this, reason);
          }
          close() {
            if (!IsWritableStream(this)) {
              return promiseRejectedWith(streamBrandCheckException$2("close"));
            }
            if (IsWritableStreamLocked(this)) {
              return promiseRejectedWith(new TypeError("Cannot close a stream that already has a writer"));
            }
            if (WritableStreamCloseQueuedOrInFlight(this)) {
              return promiseRejectedWith(new TypeError("Cannot close an already-closing stream"));
            }
            return WritableStreamClose(this);
          }
          getWriter() {
            if (!IsWritableStream(this)) {
              throw streamBrandCheckException$2("getWriter");
            }
            return AcquireWritableStreamDefaultWriter(this);
          }
        }
        Object.defineProperties(WritableStream.prototype, {
          abort: { enumerable: true },
          close: { enumerable: true },
          getWriter: { enumerable: true },
          locked: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(WritableStream.prototype, SymbolPolyfill.toStringTag, {
            value: "WritableStream",
            configurable: true
          });
        }
        function AcquireWritableStreamDefaultWriter(stream) {
          return new WritableStreamDefaultWriter(stream);
        }
        function CreateWritableStream(startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark = 1, sizeAlgorithm = () => 1) {
          const stream = Object.create(WritableStream.prototype);
          InitializeWritableStream(stream);
          const controller = Object.create(WritableStreamDefaultController.prototype);
          SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
          return stream;
        }
        function InitializeWritableStream(stream) {
          stream._state = "writable";
          stream._storedError = void 0;
          stream._writer = void 0;
          stream._writableStreamController = void 0;
          stream._writeRequests = new SimpleQueue();
          stream._inFlightWriteRequest = void 0;
          stream._closeRequest = void 0;
          stream._inFlightCloseRequest = void 0;
          stream._pendingAbortRequest = void 0;
          stream._backpressure = false;
        }
        function IsWritableStream(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_writableStreamController")) {
            return false;
          }
          return x instanceof WritableStream;
        }
        function IsWritableStreamLocked(stream) {
          if (stream._writer === void 0) {
            return false;
          }
          return true;
        }
        function WritableStreamAbort(stream, reason) {
          var _a;
          if (stream._state === "closed" || stream._state === "errored") {
            return promiseResolvedWith(void 0);
          }
          stream._writableStreamController._abortReason = reason;
          (_a = stream._writableStreamController._abortController) === null || _a === void 0 ? void 0 : _a.abort();
          const state = stream._state;
          if (state === "closed" || state === "errored") {
            return promiseResolvedWith(void 0);
          }
          if (stream._pendingAbortRequest !== void 0) {
            return stream._pendingAbortRequest._promise;
          }
          let wasAlreadyErroring = false;
          if (state === "erroring") {
            wasAlreadyErroring = true;
            reason = void 0;
          }
          const promise = newPromise((resolve2, reject) => {
            stream._pendingAbortRequest = {
              _promise: void 0,
              _resolve: resolve2,
              _reject: reject,
              _reason: reason,
              _wasAlreadyErroring: wasAlreadyErroring
            };
          });
          stream._pendingAbortRequest._promise = promise;
          if (!wasAlreadyErroring) {
            WritableStreamStartErroring(stream, reason);
          }
          return promise;
        }
        function WritableStreamClose(stream) {
          const state = stream._state;
          if (state === "closed" || state === "errored") {
            return promiseRejectedWith(new TypeError(`The stream (in ${state} state) is not in the writable state and cannot be closed`));
          }
          const promise = newPromise((resolve2, reject) => {
            const closeRequest = {
              _resolve: resolve2,
              _reject: reject
            };
            stream._closeRequest = closeRequest;
          });
          const writer = stream._writer;
          if (writer !== void 0 && stream._backpressure && state === "writable") {
            defaultWriterReadyPromiseResolve(writer);
          }
          WritableStreamDefaultControllerClose(stream._writableStreamController);
          return promise;
        }
        function WritableStreamAddWriteRequest(stream) {
          const promise = newPromise((resolve2, reject) => {
            const writeRequest = {
              _resolve: resolve2,
              _reject: reject
            };
            stream._writeRequests.push(writeRequest);
          });
          return promise;
        }
        function WritableStreamDealWithRejection(stream, error2) {
          const state = stream._state;
          if (state === "writable") {
            WritableStreamStartErroring(stream, error2);
            return;
          }
          WritableStreamFinishErroring(stream);
        }
        function WritableStreamStartErroring(stream, reason) {
          const controller = stream._writableStreamController;
          stream._state = "erroring";
          stream._storedError = reason;
          const writer = stream._writer;
          if (writer !== void 0) {
            WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, reason);
          }
          if (!WritableStreamHasOperationMarkedInFlight(stream) && controller._started) {
            WritableStreamFinishErroring(stream);
          }
        }
        function WritableStreamFinishErroring(stream) {
          stream._state = "errored";
          stream._writableStreamController[ErrorSteps]();
          const storedError = stream._storedError;
          stream._writeRequests.forEach((writeRequest) => {
            writeRequest._reject(storedError);
          });
          stream._writeRequests = new SimpleQueue();
          if (stream._pendingAbortRequest === void 0) {
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
            return;
          }
          const abortRequest = stream._pendingAbortRequest;
          stream._pendingAbortRequest = void 0;
          if (abortRequest._wasAlreadyErroring) {
            abortRequest._reject(storedError);
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
            return;
          }
          const promise = stream._writableStreamController[AbortSteps](abortRequest._reason);
          uponPromise(promise, () => {
            abortRequest._resolve();
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
          }, (reason) => {
            abortRequest._reject(reason);
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
          });
        }
        function WritableStreamFinishInFlightWrite(stream) {
          stream._inFlightWriteRequest._resolve(void 0);
          stream._inFlightWriteRequest = void 0;
        }
        function WritableStreamFinishInFlightWriteWithError(stream, error2) {
          stream._inFlightWriteRequest._reject(error2);
          stream._inFlightWriteRequest = void 0;
          WritableStreamDealWithRejection(stream, error2);
        }
        function WritableStreamFinishInFlightClose(stream) {
          stream._inFlightCloseRequest._resolve(void 0);
          stream._inFlightCloseRequest = void 0;
          const state = stream._state;
          if (state === "erroring") {
            stream._storedError = void 0;
            if (stream._pendingAbortRequest !== void 0) {
              stream._pendingAbortRequest._resolve();
              stream._pendingAbortRequest = void 0;
            }
          }
          stream._state = "closed";
          const writer = stream._writer;
          if (writer !== void 0) {
            defaultWriterClosedPromiseResolve(writer);
          }
        }
        function WritableStreamFinishInFlightCloseWithError(stream, error2) {
          stream._inFlightCloseRequest._reject(error2);
          stream._inFlightCloseRequest = void 0;
          if (stream._pendingAbortRequest !== void 0) {
            stream._pendingAbortRequest._reject(error2);
            stream._pendingAbortRequest = void 0;
          }
          WritableStreamDealWithRejection(stream, error2);
        }
        function WritableStreamCloseQueuedOrInFlight(stream) {
          if (stream._closeRequest === void 0 && stream._inFlightCloseRequest === void 0) {
            return false;
          }
          return true;
        }
        function WritableStreamHasOperationMarkedInFlight(stream) {
          if (stream._inFlightWriteRequest === void 0 && stream._inFlightCloseRequest === void 0) {
            return false;
          }
          return true;
        }
        function WritableStreamMarkCloseRequestInFlight(stream) {
          stream._inFlightCloseRequest = stream._closeRequest;
          stream._closeRequest = void 0;
        }
        function WritableStreamMarkFirstWriteRequestInFlight(stream) {
          stream._inFlightWriteRequest = stream._writeRequests.shift();
        }
        function WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream) {
          if (stream._closeRequest !== void 0) {
            stream._closeRequest._reject(stream._storedError);
            stream._closeRequest = void 0;
          }
          const writer = stream._writer;
          if (writer !== void 0) {
            defaultWriterClosedPromiseReject(writer, stream._storedError);
          }
        }
        function WritableStreamUpdateBackpressure(stream, backpressure) {
          const writer = stream._writer;
          if (writer !== void 0 && backpressure !== stream._backpressure) {
            if (backpressure) {
              defaultWriterReadyPromiseReset(writer);
            } else {
              defaultWriterReadyPromiseResolve(writer);
            }
          }
          stream._backpressure = backpressure;
        }
        class WritableStreamDefaultWriter {
          constructor(stream) {
            assertRequiredArgument(stream, 1, "WritableStreamDefaultWriter");
            assertWritableStream(stream, "First parameter");
            if (IsWritableStreamLocked(stream)) {
              throw new TypeError("This stream has already been locked for exclusive writing by another writer");
            }
            this._ownerWritableStream = stream;
            stream._writer = this;
            const state = stream._state;
            if (state === "writable") {
              if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._backpressure) {
                defaultWriterReadyPromiseInitialize(this);
              } else {
                defaultWriterReadyPromiseInitializeAsResolved(this);
              }
              defaultWriterClosedPromiseInitialize(this);
            } else if (state === "erroring") {
              defaultWriterReadyPromiseInitializeAsRejected(this, stream._storedError);
              defaultWriterClosedPromiseInitialize(this);
            } else if (state === "closed") {
              defaultWriterReadyPromiseInitializeAsResolved(this);
              defaultWriterClosedPromiseInitializeAsResolved(this);
            } else {
              const storedError = stream._storedError;
              defaultWriterReadyPromiseInitializeAsRejected(this, storedError);
              defaultWriterClosedPromiseInitializeAsRejected(this, storedError);
            }
          }
          get closed() {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("closed"));
            }
            return this._closedPromise;
          }
          get desiredSize() {
            if (!IsWritableStreamDefaultWriter(this)) {
              throw defaultWriterBrandCheckException("desiredSize");
            }
            if (this._ownerWritableStream === void 0) {
              throw defaultWriterLockException("desiredSize");
            }
            return WritableStreamDefaultWriterGetDesiredSize(this);
          }
          get ready() {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("ready"));
            }
            return this._readyPromise;
          }
          abort(reason = void 0) {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("abort"));
            }
            if (this._ownerWritableStream === void 0) {
              return promiseRejectedWith(defaultWriterLockException("abort"));
            }
            return WritableStreamDefaultWriterAbort(this, reason);
          }
          close() {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("close"));
            }
            const stream = this._ownerWritableStream;
            if (stream === void 0) {
              return promiseRejectedWith(defaultWriterLockException("close"));
            }
            if (WritableStreamCloseQueuedOrInFlight(stream)) {
              return promiseRejectedWith(new TypeError("Cannot close an already-closing stream"));
            }
            return WritableStreamDefaultWriterClose(this);
          }
          releaseLock() {
            if (!IsWritableStreamDefaultWriter(this)) {
              throw defaultWriterBrandCheckException("releaseLock");
            }
            const stream = this._ownerWritableStream;
            if (stream === void 0) {
              return;
            }
            WritableStreamDefaultWriterRelease(this);
          }
          write(chunk = void 0) {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("write"));
            }
            if (this._ownerWritableStream === void 0) {
              return promiseRejectedWith(defaultWriterLockException("write to"));
            }
            return WritableStreamDefaultWriterWrite(this, chunk);
          }
        }
        Object.defineProperties(WritableStreamDefaultWriter.prototype, {
          abort: { enumerable: true },
          close: { enumerable: true },
          releaseLock: { enumerable: true },
          write: { enumerable: true },
          closed: { enumerable: true },
          desiredSize: { enumerable: true },
          ready: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(WritableStreamDefaultWriter.prototype, SymbolPolyfill.toStringTag, {
            value: "WritableStreamDefaultWriter",
            configurable: true
          });
        }
        function IsWritableStreamDefaultWriter(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_ownerWritableStream")) {
            return false;
          }
          return x instanceof WritableStreamDefaultWriter;
        }
        function WritableStreamDefaultWriterAbort(writer, reason) {
          const stream = writer._ownerWritableStream;
          return WritableStreamAbort(stream, reason);
        }
        function WritableStreamDefaultWriterClose(writer) {
          const stream = writer._ownerWritableStream;
          return WritableStreamClose(stream);
        }
        function WritableStreamDefaultWriterCloseWithErrorPropagation(writer) {
          const stream = writer._ownerWritableStream;
          const state = stream._state;
          if (WritableStreamCloseQueuedOrInFlight(stream) || state === "closed") {
            return promiseResolvedWith(void 0);
          }
          if (state === "errored") {
            return promiseRejectedWith(stream._storedError);
          }
          return WritableStreamDefaultWriterClose(writer);
        }
        function WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, error2) {
          if (writer._closedPromiseState === "pending") {
            defaultWriterClosedPromiseReject(writer, error2);
          } else {
            defaultWriterClosedPromiseResetToRejected(writer, error2);
          }
        }
        function WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, error2) {
          if (writer._readyPromiseState === "pending") {
            defaultWriterReadyPromiseReject(writer, error2);
          } else {
            defaultWriterReadyPromiseResetToRejected(writer, error2);
          }
        }
        function WritableStreamDefaultWriterGetDesiredSize(writer) {
          const stream = writer._ownerWritableStream;
          const state = stream._state;
          if (state === "errored" || state === "erroring") {
            return null;
          }
          if (state === "closed") {
            return 0;
          }
          return WritableStreamDefaultControllerGetDesiredSize(stream._writableStreamController);
        }
        function WritableStreamDefaultWriterRelease(writer) {
          const stream = writer._ownerWritableStream;
          const releasedError = new TypeError(`Writer was released and can no longer be used to monitor the stream's closedness`);
          WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, releasedError);
          WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, releasedError);
          stream._writer = void 0;
          writer._ownerWritableStream = void 0;
        }
        function WritableStreamDefaultWriterWrite(writer, chunk) {
          const stream = writer._ownerWritableStream;
          const controller = stream._writableStreamController;
          const chunkSize = WritableStreamDefaultControllerGetChunkSize(controller, chunk);
          if (stream !== writer._ownerWritableStream) {
            return promiseRejectedWith(defaultWriterLockException("write to"));
          }
          const state = stream._state;
          if (state === "errored") {
            return promiseRejectedWith(stream._storedError);
          }
          if (WritableStreamCloseQueuedOrInFlight(stream) || state === "closed") {
            return promiseRejectedWith(new TypeError("The stream is closing or closed and cannot be written to"));
          }
          if (state === "erroring") {
            return promiseRejectedWith(stream._storedError);
          }
          const promise = WritableStreamAddWriteRequest(stream);
          WritableStreamDefaultControllerWrite(controller, chunk, chunkSize);
          return promise;
        }
        const closeSentinel = {};
        class WritableStreamDefaultController {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get abortReason() {
            if (!IsWritableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$2("abortReason");
            }
            return this._abortReason;
          }
          get signal() {
            if (!IsWritableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$2("signal");
            }
            if (this._abortController === void 0) {
              throw new TypeError("WritableStreamDefaultController.prototype.signal is not supported");
            }
            return this._abortController.signal;
          }
          error(e = void 0) {
            if (!IsWritableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$2("error");
            }
            const state = this._controlledWritableStream._state;
            if (state !== "writable") {
              return;
            }
            WritableStreamDefaultControllerError(this, e);
          }
          [AbortSteps](reason) {
            const result = this._abortAlgorithm(reason);
            WritableStreamDefaultControllerClearAlgorithms(this);
            return result;
          }
          [ErrorSteps]() {
            ResetQueue(this);
          }
        }
        Object.defineProperties(WritableStreamDefaultController.prototype, {
          error: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(WritableStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
            value: "WritableStreamDefaultController",
            configurable: true
          });
        }
        function IsWritableStreamDefaultController(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_controlledWritableStream")) {
            return false;
          }
          return x instanceof WritableStreamDefaultController;
        }
        function SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm) {
          controller._controlledWritableStream = stream;
          stream._writableStreamController = controller;
          controller._queue = void 0;
          controller._queueTotalSize = void 0;
          ResetQueue(controller);
          controller._abortReason = void 0;
          controller._abortController = createAbortController();
          controller._started = false;
          controller._strategySizeAlgorithm = sizeAlgorithm;
          controller._strategyHWM = highWaterMark;
          controller._writeAlgorithm = writeAlgorithm;
          controller._closeAlgorithm = closeAlgorithm;
          controller._abortAlgorithm = abortAlgorithm;
          const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
          WritableStreamUpdateBackpressure(stream, backpressure);
          const startResult = startAlgorithm();
          const startPromise = promiseResolvedWith(startResult);
          uponPromise(startPromise, () => {
            controller._started = true;
            WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
          }, (r) => {
            controller._started = true;
            WritableStreamDealWithRejection(stream, r);
          });
        }
        function SetUpWritableStreamDefaultControllerFromUnderlyingSink(stream, underlyingSink, highWaterMark, sizeAlgorithm) {
          const controller = Object.create(WritableStreamDefaultController.prototype);
          let startAlgorithm = () => void 0;
          let writeAlgorithm = () => promiseResolvedWith(void 0);
          let closeAlgorithm = () => promiseResolvedWith(void 0);
          let abortAlgorithm = () => promiseResolvedWith(void 0);
          if (underlyingSink.start !== void 0) {
            startAlgorithm = () => underlyingSink.start(controller);
          }
          if (underlyingSink.write !== void 0) {
            writeAlgorithm = (chunk) => underlyingSink.write(chunk, controller);
          }
          if (underlyingSink.close !== void 0) {
            closeAlgorithm = () => underlyingSink.close();
          }
          if (underlyingSink.abort !== void 0) {
            abortAlgorithm = (reason) => underlyingSink.abort(reason);
          }
          SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
        }
        function WritableStreamDefaultControllerClearAlgorithms(controller) {
          controller._writeAlgorithm = void 0;
          controller._closeAlgorithm = void 0;
          controller._abortAlgorithm = void 0;
          controller._strategySizeAlgorithm = void 0;
        }
        function WritableStreamDefaultControllerClose(controller) {
          EnqueueValueWithSize(controller, closeSentinel, 0);
          WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
        }
        function WritableStreamDefaultControllerGetChunkSize(controller, chunk) {
          try {
            return controller._strategySizeAlgorithm(chunk);
          } catch (chunkSizeE) {
            WritableStreamDefaultControllerErrorIfNeeded(controller, chunkSizeE);
            return 1;
          }
        }
        function WritableStreamDefaultControllerGetDesiredSize(controller) {
          return controller._strategyHWM - controller._queueTotalSize;
        }
        function WritableStreamDefaultControllerWrite(controller, chunk, chunkSize) {
          try {
            EnqueueValueWithSize(controller, chunk, chunkSize);
          } catch (enqueueE) {
            WritableStreamDefaultControllerErrorIfNeeded(controller, enqueueE);
            return;
          }
          const stream = controller._controlledWritableStream;
          if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._state === "writable") {
            const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
            WritableStreamUpdateBackpressure(stream, backpressure);
          }
          WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
        }
        function WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller) {
          const stream = controller._controlledWritableStream;
          if (!controller._started) {
            return;
          }
          if (stream._inFlightWriteRequest !== void 0) {
            return;
          }
          const state = stream._state;
          if (state === "erroring") {
            WritableStreamFinishErroring(stream);
            return;
          }
          if (controller._queue.length === 0) {
            return;
          }
          const value = PeekQueueValue(controller);
          if (value === closeSentinel) {
            WritableStreamDefaultControllerProcessClose(controller);
          } else {
            WritableStreamDefaultControllerProcessWrite(controller, value);
          }
        }
        function WritableStreamDefaultControllerErrorIfNeeded(controller, error2) {
          if (controller._controlledWritableStream._state === "writable") {
            WritableStreamDefaultControllerError(controller, error2);
          }
        }
        function WritableStreamDefaultControllerProcessClose(controller) {
          const stream = controller._controlledWritableStream;
          WritableStreamMarkCloseRequestInFlight(stream);
          DequeueValue(controller);
          const sinkClosePromise = controller._closeAlgorithm();
          WritableStreamDefaultControllerClearAlgorithms(controller);
          uponPromise(sinkClosePromise, () => {
            WritableStreamFinishInFlightClose(stream);
          }, (reason) => {
            WritableStreamFinishInFlightCloseWithError(stream, reason);
          });
        }
        function WritableStreamDefaultControllerProcessWrite(controller, chunk) {
          const stream = controller._controlledWritableStream;
          WritableStreamMarkFirstWriteRequestInFlight(stream);
          const sinkWritePromise = controller._writeAlgorithm(chunk);
          uponPromise(sinkWritePromise, () => {
            WritableStreamFinishInFlightWrite(stream);
            const state = stream._state;
            DequeueValue(controller);
            if (!WritableStreamCloseQueuedOrInFlight(stream) && state === "writable") {
              const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
              WritableStreamUpdateBackpressure(stream, backpressure);
            }
            WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
          }, (reason) => {
            if (stream._state === "writable") {
              WritableStreamDefaultControllerClearAlgorithms(controller);
            }
            WritableStreamFinishInFlightWriteWithError(stream, reason);
          });
        }
        function WritableStreamDefaultControllerGetBackpressure(controller) {
          const desiredSize = WritableStreamDefaultControllerGetDesiredSize(controller);
          return desiredSize <= 0;
        }
        function WritableStreamDefaultControllerError(controller, error2) {
          const stream = controller._controlledWritableStream;
          WritableStreamDefaultControllerClearAlgorithms(controller);
          WritableStreamStartErroring(stream, error2);
        }
        function streamBrandCheckException$2(name) {
          return new TypeError(`WritableStream.prototype.${name} can only be used on a WritableStream`);
        }
        function defaultControllerBrandCheckException$2(name) {
          return new TypeError(`WritableStreamDefaultController.prototype.${name} can only be used on a WritableStreamDefaultController`);
        }
        function defaultWriterBrandCheckException(name) {
          return new TypeError(`WritableStreamDefaultWriter.prototype.${name} can only be used on a WritableStreamDefaultWriter`);
        }
        function defaultWriterLockException(name) {
          return new TypeError("Cannot " + name + " a stream using a released writer");
        }
        function defaultWriterClosedPromiseInitialize(writer) {
          writer._closedPromise = newPromise((resolve2, reject) => {
            writer._closedPromise_resolve = resolve2;
            writer._closedPromise_reject = reject;
            writer._closedPromiseState = "pending";
          });
        }
        function defaultWriterClosedPromiseInitializeAsRejected(writer, reason) {
          defaultWriterClosedPromiseInitialize(writer);
          defaultWriterClosedPromiseReject(writer, reason);
        }
        function defaultWriterClosedPromiseInitializeAsResolved(writer) {
          defaultWriterClosedPromiseInitialize(writer);
          defaultWriterClosedPromiseResolve(writer);
        }
        function defaultWriterClosedPromiseReject(writer, reason) {
          if (writer._closedPromise_reject === void 0) {
            return;
          }
          setPromiseIsHandledToTrue(writer._closedPromise);
          writer._closedPromise_reject(reason);
          writer._closedPromise_resolve = void 0;
          writer._closedPromise_reject = void 0;
          writer._closedPromiseState = "rejected";
        }
        function defaultWriterClosedPromiseResetToRejected(writer, reason) {
          defaultWriterClosedPromiseInitializeAsRejected(writer, reason);
        }
        function defaultWriterClosedPromiseResolve(writer) {
          if (writer._closedPromise_resolve === void 0) {
            return;
          }
          writer._closedPromise_resolve(void 0);
          writer._closedPromise_resolve = void 0;
          writer._closedPromise_reject = void 0;
          writer._closedPromiseState = "resolved";
        }
        function defaultWriterReadyPromiseInitialize(writer) {
          writer._readyPromise = newPromise((resolve2, reject) => {
            writer._readyPromise_resolve = resolve2;
            writer._readyPromise_reject = reject;
          });
          writer._readyPromiseState = "pending";
        }
        function defaultWriterReadyPromiseInitializeAsRejected(writer, reason) {
          defaultWriterReadyPromiseInitialize(writer);
          defaultWriterReadyPromiseReject(writer, reason);
        }
        function defaultWriterReadyPromiseInitializeAsResolved(writer) {
          defaultWriterReadyPromiseInitialize(writer);
          defaultWriterReadyPromiseResolve(writer);
        }
        function defaultWriterReadyPromiseReject(writer, reason) {
          if (writer._readyPromise_reject === void 0) {
            return;
          }
          setPromiseIsHandledToTrue(writer._readyPromise);
          writer._readyPromise_reject(reason);
          writer._readyPromise_resolve = void 0;
          writer._readyPromise_reject = void 0;
          writer._readyPromiseState = "rejected";
        }
        function defaultWriterReadyPromiseReset(writer) {
          defaultWriterReadyPromiseInitialize(writer);
        }
        function defaultWriterReadyPromiseResetToRejected(writer, reason) {
          defaultWriterReadyPromiseInitializeAsRejected(writer, reason);
        }
        function defaultWriterReadyPromiseResolve(writer) {
          if (writer._readyPromise_resolve === void 0) {
            return;
          }
          writer._readyPromise_resolve(void 0);
          writer._readyPromise_resolve = void 0;
          writer._readyPromise_reject = void 0;
          writer._readyPromiseState = "fulfilled";
        }
        const NativeDOMException = typeof DOMException !== "undefined" ? DOMException : void 0;
        function isDOMExceptionConstructor(ctor) {
          if (!(typeof ctor === "function" || typeof ctor === "object")) {
            return false;
          }
          try {
            new ctor();
            return true;
          } catch (_a) {
            return false;
          }
        }
        function createDOMExceptionPolyfill() {
          const ctor = function DOMException2(message, name) {
            this.message = message || "";
            this.name = name || "Error";
            if (Error.captureStackTrace) {
              Error.captureStackTrace(this, this.constructor);
            }
          };
          ctor.prototype = Object.create(Error.prototype);
          Object.defineProperty(ctor.prototype, "constructor", { value: ctor, writable: true, configurable: true });
          return ctor;
        }
        const DOMException$1 = isDOMExceptionConstructor(NativeDOMException) ? NativeDOMException : createDOMExceptionPolyfill();
        function ReadableStreamPipeTo(source, dest, preventClose, preventAbort, preventCancel, signal) {
          const reader = AcquireReadableStreamDefaultReader(source);
          const writer = AcquireWritableStreamDefaultWriter(dest);
          source._disturbed = true;
          let shuttingDown = false;
          let currentWrite = promiseResolvedWith(void 0);
          return newPromise((resolve2, reject) => {
            let abortAlgorithm;
            if (signal !== void 0) {
              abortAlgorithm = () => {
                const error2 = new DOMException$1("Aborted", "AbortError");
                const actions = [];
                if (!preventAbort) {
                  actions.push(() => {
                    if (dest._state === "writable") {
                      return WritableStreamAbort(dest, error2);
                    }
                    return promiseResolvedWith(void 0);
                  });
                }
                if (!preventCancel) {
                  actions.push(() => {
                    if (source._state === "readable") {
                      return ReadableStreamCancel(source, error2);
                    }
                    return promiseResolvedWith(void 0);
                  });
                }
                shutdownWithAction(() => Promise.all(actions.map((action) => action())), true, error2);
              };
              if (signal.aborted) {
                abortAlgorithm();
                return;
              }
              signal.addEventListener("abort", abortAlgorithm);
            }
            function pipeLoop() {
              return newPromise((resolveLoop, rejectLoop) => {
                function next(done) {
                  if (done) {
                    resolveLoop();
                  } else {
                    PerformPromiseThen(pipeStep(), next, rejectLoop);
                  }
                }
                next(false);
              });
            }
            function pipeStep() {
              if (shuttingDown) {
                return promiseResolvedWith(true);
              }
              return PerformPromiseThen(writer._readyPromise, () => {
                return newPromise((resolveRead, rejectRead) => {
                  ReadableStreamDefaultReaderRead(reader, {
                    _chunkSteps: (chunk) => {
                      currentWrite = PerformPromiseThen(WritableStreamDefaultWriterWrite(writer, chunk), void 0, noop2);
                      resolveRead(false);
                    },
                    _closeSteps: () => resolveRead(true),
                    _errorSteps: rejectRead
                  });
                });
              });
            }
            isOrBecomesErrored(source, reader._closedPromise, (storedError) => {
              if (!preventAbort) {
                shutdownWithAction(() => WritableStreamAbort(dest, storedError), true, storedError);
              } else {
                shutdown(true, storedError);
              }
            });
            isOrBecomesErrored(dest, writer._closedPromise, (storedError) => {
              if (!preventCancel) {
                shutdownWithAction(() => ReadableStreamCancel(source, storedError), true, storedError);
              } else {
                shutdown(true, storedError);
              }
            });
            isOrBecomesClosed(source, reader._closedPromise, () => {
              if (!preventClose) {
                shutdownWithAction(() => WritableStreamDefaultWriterCloseWithErrorPropagation(writer));
              } else {
                shutdown();
              }
            });
            if (WritableStreamCloseQueuedOrInFlight(dest) || dest._state === "closed") {
              const destClosed = new TypeError("the destination writable stream closed before all data could be piped to it");
              if (!preventCancel) {
                shutdownWithAction(() => ReadableStreamCancel(source, destClosed), true, destClosed);
              } else {
                shutdown(true, destClosed);
              }
            }
            setPromiseIsHandledToTrue(pipeLoop());
            function waitForWritesToFinish() {
              const oldCurrentWrite = currentWrite;
              return PerformPromiseThen(currentWrite, () => oldCurrentWrite !== currentWrite ? waitForWritesToFinish() : void 0);
            }
            function isOrBecomesErrored(stream, promise, action) {
              if (stream._state === "errored") {
                action(stream._storedError);
              } else {
                uponRejection(promise, action);
              }
            }
            function isOrBecomesClosed(stream, promise, action) {
              if (stream._state === "closed") {
                action();
              } else {
                uponFulfillment(promise, action);
              }
            }
            function shutdownWithAction(action, originalIsError, originalError) {
              if (shuttingDown) {
                return;
              }
              shuttingDown = true;
              if (dest._state === "writable" && !WritableStreamCloseQueuedOrInFlight(dest)) {
                uponFulfillment(waitForWritesToFinish(), doTheRest);
              } else {
                doTheRest();
              }
              function doTheRest() {
                uponPromise(action(), () => finalize(originalIsError, originalError), (newError) => finalize(true, newError));
              }
            }
            function shutdown(isError, error2) {
              if (shuttingDown) {
                return;
              }
              shuttingDown = true;
              if (dest._state === "writable" && !WritableStreamCloseQueuedOrInFlight(dest)) {
                uponFulfillment(waitForWritesToFinish(), () => finalize(isError, error2));
              } else {
                finalize(isError, error2);
              }
            }
            function finalize(isError, error2) {
              WritableStreamDefaultWriterRelease(writer);
              ReadableStreamReaderGenericRelease(reader);
              if (signal !== void 0) {
                signal.removeEventListener("abort", abortAlgorithm);
              }
              if (isError) {
                reject(error2);
              } else {
                resolve2(void 0);
              }
            }
          });
        }
        class ReadableStreamDefaultController {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get desiredSize() {
            if (!IsReadableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$1("desiredSize");
            }
            return ReadableStreamDefaultControllerGetDesiredSize(this);
          }
          close() {
            if (!IsReadableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$1("close");
            }
            if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
              throw new TypeError("The stream is not in a state that permits close");
            }
            ReadableStreamDefaultControllerClose(this);
          }
          enqueue(chunk = void 0) {
            if (!IsReadableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$1("enqueue");
            }
            if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
              throw new TypeError("The stream is not in a state that permits enqueue");
            }
            return ReadableStreamDefaultControllerEnqueue(this, chunk);
          }
          error(e = void 0) {
            if (!IsReadableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$1("error");
            }
            ReadableStreamDefaultControllerError(this, e);
          }
          [CancelSteps](reason) {
            ResetQueue(this);
            const result = this._cancelAlgorithm(reason);
            ReadableStreamDefaultControllerClearAlgorithms(this);
            return result;
          }
          [PullSteps](readRequest) {
            const stream = this._controlledReadableStream;
            if (this._queue.length > 0) {
              const chunk = DequeueValue(this);
              if (this._closeRequested && this._queue.length === 0) {
                ReadableStreamDefaultControllerClearAlgorithms(this);
                ReadableStreamClose(stream);
              } else {
                ReadableStreamDefaultControllerCallPullIfNeeded(this);
              }
              readRequest._chunkSteps(chunk);
            } else {
              ReadableStreamAddReadRequest(stream, readRequest);
              ReadableStreamDefaultControllerCallPullIfNeeded(this);
            }
          }
        }
        Object.defineProperties(ReadableStreamDefaultController.prototype, {
          close: { enumerable: true },
          enqueue: { enumerable: true },
          error: { enumerable: true },
          desiredSize: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStreamDefaultController",
            configurable: true
          });
        }
        function IsReadableStreamDefaultController(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_controlledReadableStream")) {
            return false;
          }
          return x instanceof ReadableStreamDefaultController;
        }
        function ReadableStreamDefaultControllerCallPullIfNeeded(controller) {
          const shouldPull = ReadableStreamDefaultControllerShouldCallPull(controller);
          if (!shouldPull) {
            return;
          }
          if (controller._pulling) {
            controller._pullAgain = true;
            return;
          }
          controller._pulling = true;
          const pullPromise = controller._pullAlgorithm();
          uponPromise(pullPromise, () => {
            controller._pulling = false;
            if (controller._pullAgain) {
              controller._pullAgain = false;
              ReadableStreamDefaultControllerCallPullIfNeeded(controller);
            }
          }, (e) => {
            ReadableStreamDefaultControllerError(controller, e);
          });
        }
        function ReadableStreamDefaultControllerShouldCallPull(controller) {
          const stream = controller._controlledReadableStream;
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
            return false;
          }
          if (!controller._started) {
            return false;
          }
          if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
            return true;
          }
          const desiredSize = ReadableStreamDefaultControllerGetDesiredSize(controller);
          if (desiredSize > 0) {
            return true;
          }
          return false;
        }
        function ReadableStreamDefaultControllerClearAlgorithms(controller) {
          controller._pullAlgorithm = void 0;
          controller._cancelAlgorithm = void 0;
          controller._strategySizeAlgorithm = void 0;
        }
        function ReadableStreamDefaultControllerClose(controller) {
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
            return;
          }
          const stream = controller._controlledReadableStream;
          controller._closeRequested = true;
          if (controller._queue.length === 0) {
            ReadableStreamDefaultControllerClearAlgorithms(controller);
            ReadableStreamClose(stream);
          }
        }
        function ReadableStreamDefaultControllerEnqueue(controller, chunk) {
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
            return;
          }
          const stream = controller._controlledReadableStream;
          if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
            ReadableStreamFulfillReadRequest(stream, chunk, false);
          } else {
            let chunkSize;
            try {
              chunkSize = controller._strategySizeAlgorithm(chunk);
            } catch (chunkSizeE) {
              ReadableStreamDefaultControllerError(controller, chunkSizeE);
              throw chunkSizeE;
            }
            try {
              EnqueueValueWithSize(controller, chunk, chunkSize);
            } catch (enqueueE) {
              ReadableStreamDefaultControllerError(controller, enqueueE);
              throw enqueueE;
            }
          }
          ReadableStreamDefaultControllerCallPullIfNeeded(controller);
        }
        function ReadableStreamDefaultControllerError(controller, e) {
          const stream = controller._controlledReadableStream;
          if (stream._state !== "readable") {
            return;
          }
          ResetQueue(controller);
          ReadableStreamDefaultControllerClearAlgorithms(controller);
          ReadableStreamError(stream, e);
        }
        function ReadableStreamDefaultControllerGetDesiredSize(controller) {
          const state = controller._controlledReadableStream._state;
          if (state === "errored") {
            return null;
          }
          if (state === "closed") {
            return 0;
          }
          return controller._strategyHWM - controller._queueTotalSize;
        }
        function ReadableStreamDefaultControllerHasBackpressure(controller) {
          if (ReadableStreamDefaultControllerShouldCallPull(controller)) {
            return false;
          }
          return true;
        }
        function ReadableStreamDefaultControllerCanCloseOrEnqueue(controller) {
          const state = controller._controlledReadableStream._state;
          if (!controller._closeRequested && state === "readable") {
            return true;
          }
          return false;
        }
        function SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm) {
          controller._controlledReadableStream = stream;
          controller._queue = void 0;
          controller._queueTotalSize = void 0;
          ResetQueue(controller);
          controller._started = false;
          controller._closeRequested = false;
          controller._pullAgain = false;
          controller._pulling = false;
          controller._strategySizeAlgorithm = sizeAlgorithm;
          controller._strategyHWM = highWaterMark;
          controller._pullAlgorithm = pullAlgorithm;
          controller._cancelAlgorithm = cancelAlgorithm;
          stream._readableStreamController = controller;
          const startResult = startAlgorithm();
          uponPromise(promiseResolvedWith(startResult), () => {
            controller._started = true;
            ReadableStreamDefaultControllerCallPullIfNeeded(controller);
          }, (r) => {
            ReadableStreamDefaultControllerError(controller, r);
          });
        }
        function SetUpReadableStreamDefaultControllerFromUnderlyingSource(stream, underlyingSource, highWaterMark, sizeAlgorithm) {
          const controller = Object.create(ReadableStreamDefaultController.prototype);
          let startAlgorithm = () => void 0;
          let pullAlgorithm = () => promiseResolvedWith(void 0);
          let cancelAlgorithm = () => promiseResolvedWith(void 0);
          if (underlyingSource.start !== void 0) {
            startAlgorithm = () => underlyingSource.start(controller);
          }
          if (underlyingSource.pull !== void 0) {
            pullAlgorithm = () => underlyingSource.pull(controller);
          }
          if (underlyingSource.cancel !== void 0) {
            cancelAlgorithm = (reason) => underlyingSource.cancel(reason);
          }
          SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
        }
        function defaultControllerBrandCheckException$1(name) {
          return new TypeError(`ReadableStreamDefaultController.prototype.${name} can only be used on a ReadableStreamDefaultController`);
        }
        function ReadableStreamTee(stream, cloneForBranch2) {
          if (IsReadableByteStreamController(stream._readableStreamController)) {
            return ReadableByteStreamTee(stream);
          }
          return ReadableStreamDefaultTee(stream);
        }
        function ReadableStreamDefaultTee(stream, cloneForBranch2) {
          const reader = AcquireReadableStreamDefaultReader(stream);
          let reading = false;
          let canceled1 = false;
          let canceled2 = false;
          let reason1;
          let reason2;
          let branch1;
          let branch2;
          let resolveCancelPromise;
          const cancelPromise = newPromise((resolve2) => {
            resolveCancelPromise = resolve2;
          });
          function pullAlgorithm() {
            if (reading) {
              return promiseResolvedWith(void 0);
            }
            reading = true;
            const readRequest = {
              _chunkSteps: (chunk) => {
                queueMicrotask(() => {
                  reading = false;
                  const chunk1 = chunk;
                  const chunk2 = chunk;
                  if (!canceled1) {
                    ReadableStreamDefaultControllerEnqueue(branch1._readableStreamController, chunk1);
                  }
                  if (!canceled2) {
                    ReadableStreamDefaultControllerEnqueue(branch2._readableStreamController, chunk2);
                  }
                });
              },
              _closeSteps: () => {
                reading = false;
                if (!canceled1) {
                  ReadableStreamDefaultControllerClose(branch1._readableStreamController);
                }
                if (!canceled2) {
                  ReadableStreamDefaultControllerClose(branch2._readableStreamController);
                }
                if (!canceled1 || !canceled2) {
                  resolveCancelPromise(void 0);
                }
              },
              _errorSteps: () => {
                reading = false;
              }
            };
            ReadableStreamDefaultReaderRead(reader, readRequest);
            return promiseResolvedWith(void 0);
          }
          function cancel1Algorithm(reason) {
            canceled1 = true;
            reason1 = reason;
            if (canceled2) {
              const compositeReason = CreateArrayFromList([reason1, reason2]);
              const cancelResult = ReadableStreamCancel(stream, compositeReason);
              resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
          }
          function cancel2Algorithm(reason) {
            canceled2 = true;
            reason2 = reason;
            if (canceled1) {
              const compositeReason = CreateArrayFromList([reason1, reason2]);
              const cancelResult = ReadableStreamCancel(stream, compositeReason);
              resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
          }
          function startAlgorithm() {
          }
          branch1 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel1Algorithm);
          branch2 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel2Algorithm);
          uponRejection(reader._closedPromise, (r) => {
            ReadableStreamDefaultControllerError(branch1._readableStreamController, r);
            ReadableStreamDefaultControllerError(branch2._readableStreamController, r);
            if (!canceled1 || !canceled2) {
              resolveCancelPromise(void 0);
            }
          });
          return [branch1, branch2];
        }
        function ReadableByteStreamTee(stream) {
          let reader = AcquireReadableStreamDefaultReader(stream);
          let reading = false;
          let canceled1 = false;
          let canceled2 = false;
          let reason1;
          let reason2;
          let branch1;
          let branch2;
          let resolveCancelPromise;
          const cancelPromise = newPromise((resolve2) => {
            resolveCancelPromise = resolve2;
          });
          function forwardReaderError(thisReader) {
            uponRejection(thisReader._closedPromise, (r) => {
              if (thisReader !== reader) {
                return;
              }
              ReadableByteStreamControllerError(branch1._readableStreamController, r);
              ReadableByteStreamControllerError(branch2._readableStreamController, r);
              if (!canceled1 || !canceled2) {
                resolveCancelPromise(void 0);
              }
            });
          }
          function pullWithDefaultReader() {
            if (IsReadableStreamBYOBReader(reader)) {
              ReadableStreamReaderGenericRelease(reader);
              reader = AcquireReadableStreamDefaultReader(stream);
              forwardReaderError(reader);
            }
            const readRequest = {
              _chunkSteps: (chunk) => {
                queueMicrotask(() => {
                  reading = false;
                  const chunk1 = chunk;
                  let chunk2 = chunk;
                  if (!canceled1 && !canceled2) {
                    try {
                      chunk2 = CloneAsUint8Array(chunk);
                    } catch (cloneE) {
                      ReadableByteStreamControllerError(branch1._readableStreamController, cloneE);
                      ReadableByteStreamControllerError(branch2._readableStreamController, cloneE);
                      resolveCancelPromise(ReadableStreamCancel(stream, cloneE));
                      return;
                    }
                  }
                  if (!canceled1) {
                    ReadableByteStreamControllerEnqueue(branch1._readableStreamController, chunk1);
                  }
                  if (!canceled2) {
                    ReadableByteStreamControllerEnqueue(branch2._readableStreamController, chunk2);
                  }
                });
              },
              _closeSteps: () => {
                reading = false;
                if (!canceled1) {
                  ReadableByteStreamControllerClose(branch1._readableStreamController);
                }
                if (!canceled2) {
                  ReadableByteStreamControllerClose(branch2._readableStreamController);
                }
                if (branch1._readableStreamController._pendingPullIntos.length > 0) {
                  ReadableByteStreamControllerRespond(branch1._readableStreamController, 0);
                }
                if (branch2._readableStreamController._pendingPullIntos.length > 0) {
                  ReadableByteStreamControllerRespond(branch2._readableStreamController, 0);
                }
                if (!canceled1 || !canceled2) {
                  resolveCancelPromise(void 0);
                }
              },
              _errorSteps: () => {
                reading = false;
              }
            };
            ReadableStreamDefaultReaderRead(reader, readRequest);
          }
          function pullWithBYOBReader(view, forBranch2) {
            if (IsReadableStreamDefaultReader(reader)) {
              ReadableStreamReaderGenericRelease(reader);
              reader = AcquireReadableStreamBYOBReader(stream);
              forwardReaderError(reader);
            }
            const byobBranch = forBranch2 ? branch2 : branch1;
            const otherBranch = forBranch2 ? branch1 : branch2;
            const readIntoRequest = {
              _chunkSteps: (chunk) => {
                queueMicrotask(() => {
                  reading = false;
                  const byobCanceled = forBranch2 ? canceled2 : canceled1;
                  const otherCanceled = forBranch2 ? canceled1 : canceled2;
                  if (!otherCanceled) {
                    let clonedChunk;
                    try {
                      clonedChunk = CloneAsUint8Array(chunk);
                    } catch (cloneE) {
                      ReadableByteStreamControllerError(byobBranch._readableStreamController, cloneE);
                      ReadableByteStreamControllerError(otherBranch._readableStreamController, cloneE);
                      resolveCancelPromise(ReadableStreamCancel(stream, cloneE));
                      return;
                    }
                    if (!byobCanceled) {
                      ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                    }
                    ReadableByteStreamControllerEnqueue(otherBranch._readableStreamController, clonedChunk);
                  } else if (!byobCanceled) {
                    ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                  }
                });
              },
              _closeSteps: (chunk) => {
                reading = false;
                const byobCanceled = forBranch2 ? canceled2 : canceled1;
                const otherCanceled = forBranch2 ? canceled1 : canceled2;
                if (!byobCanceled) {
                  ReadableByteStreamControllerClose(byobBranch._readableStreamController);
                }
                if (!otherCanceled) {
                  ReadableByteStreamControllerClose(otherBranch._readableStreamController);
                }
                if (chunk !== void 0) {
                  if (!byobCanceled) {
                    ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                  }
                  if (!otherCanceled && otherBranch._readableStreamController._pendingPullIntos.length > 0) {
                    ReadableByteStreamControllerRespond(otherBranch._readableStreamController, 0);
                  }
                }
                if (!byobCanceled || !otherCanceled) {
                  resolveCancelPromise(void 0);
                }
              },
              _errorSteps: () => {
                reading = false;
              }
            };
            ReadableStreamBYOBReaderRead(reader, view, readIntoRequest);
          }
          function pull1Algorithm() {
            if (reading) {
              return promiseResolvedWith(void 0);
            }
            reading = true;
            const byobRequest = ReadableByteStreamControllerGetBYOBRequest(branch1._readableStreamController);
            if (byobRequest === null) {
              pullWithDefaultReader();
            } else {
              pullWithBYOBReader(byobRequest._view, false);
            }
            return promiseResolvedWith(void 0);
          }
          function pull2Algorithm() {
            if (reading) {
              return promiseResolvedWith(void 0);
            }
            reading = true;
            const byobRequest = ReadableByteStreamControllerGetBYOBRequest(branch2._readableStreamController);
            if (byobRequest === null) {
              pullWithDefaultReader();
            } else {
              pullWithBYOBReader(byobRequest._view, true);
            }
            return promiseResolvedWith(void 0);
          }
          function cancel1Algorithm(reason) {
            canceled1 = true;
            reason1 = reason;
            if (canceled2) {
              const compositeReason = CreateArrayFromList([reason1, reason2]);
              const cancelResult = ReadableStreamCancel(stream, compositeReason);
              resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
          }
          function cancel2Algorithm(reason) {
            canceled2 = true;
            reason2 = reason;
            if (canceled1) {
              const compositeReason = CreateArrayFromList([reason1, reason2]);
              const cancelResult = ReadableStreamCancel(stream, compositeReason);
              resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
          }
          function startAlgorithm() {
            return;
          }
          branch1 = CreateReadableByteStream(startAlgorithm, pull1Algorithm, cancel1Algorithm);
          branch2 = CreateReadableByteStream(startAlgorithm, pull2Algorithm, cancel2Algorithm);
          forwardReaderError(reader);
          return [branch1, branch2];
        }
        function convertUnderlyingDefaultOrByteSource(source, context) {
          assertDictionary(source, context);
          const original = source;
          const autoAllocateChunkSize = original === null || original === void 0 ? void 0 : original.autoAllocateChunkSize;
          const cancel = original === null || original === void 0 ? void 0 : original.cancel;
          const pull = original === null || original === void 0 ? void 0 : original.pull;
          const start = original === null || original === void 0 ? void 0 : original.start;
          const type = original === null || original === void 0 ? void 0 : original.type;
          return {
            autoAllocateChunkSize: autoAllocateChunkSize === void 0 ? void 0 : convertUnsignedLongLongWithEnforceRange(autoAllocateChunkSize, `${context} has member 'autoAllocateChunkSize' that`),
            cancel: cancel === void 0 ? void 0 : convertUnderlyingSourceCancelCallback(cancel, original, `${context} has member 'cancel' that`),
            pull: pull === void 0 ? void 0 : convertUnderlyingSourcePullCallback(pull, original, `${context} has member 'pull' that`),
            start: start === void 0 ? void 0 : convertUnderlyingSourceStartCallback(start, original, `${context} has member 'start' that`),
            type: type === void 0 ? void 0 : convertReadableStreamType(type, `${context} has member 'type' that`)
          };
        }
        function convertUnderlyingSourceCancelCallback(fn, original, context) {
          assertFunction(fn, context);
          return (reason) => promiseCall(fn, original, [reason]);
        }
        function convertUnderlyingSourcePullCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => promiseCall(fn, original, [controller]);
        }
        function convertUnderlyingSourceStartCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => reflectCall(fn, original, [controller]);
        }
        function convertReadableStreamType(type, context) {
          type = `${type}`;
          if (type !== "bytes") {
            throw new TypeError(`${context} '${type}' is not a valid enumeration value for ReadableStreamType`);
          }
          return type;
        }
        function convertReaderOptions(options2, context) {
          assertDictionary(options2, context);
          const mode = options2 === null || options2 === void 0 ? void 0 : options2.mode;
          return {
            mode: mode === void 0 ? void 0 : convertReadableStreamReaderMode(mode, `${context} has member 'mode' that`)
          };
        }
        function convertReadableStreamReaderMode(mode, context) {
          mode = `${mode}`;
          if (mode !== "byob") {
            throw new TypeError(`${context} '${mode}' is not a valid enumeration value for ReadableStreamReaderMode`);
          }
          return mode;
        }
        function convertIteratorOptions(options2, context) {
          assertDictionary(options2, context);
          const preventCancel = options2 === null || options2 === void 0 ? void 0 : options2.preventCancel;
          return { preventCancel: Boolean(preventCancel) };
        }
        function convertPipeOptions(options2, context) {
          assertDictionary(options2, context);
          const preventAbort = options2 === null || options2 === void 0 ? void 0 : options2.preventAbort;
          const preventCancel = options2 === null || options2 === void 0 ? void 0 : options2.preventCancel;
          const preventClose = options2 === null || options2 === void 0 ? void 0 : options2.preventClose;
          const signal = options2 === null || options2 === void 0 ? void 0 : options2.signal;
          if (signal !== void 0) {
            assertAbortSignal(signal, `${context} has member 'signal' that`);
          }
          return {
            preventAbort: Boolean(preventAbort),
            preventCancel: Boolean(preventCancel),
            preventClose: Boolean(preventClose),
            signal
          };
        }
        function assertAbortSignal(signal, context) {
          if (!isAbortSignal2(signal)) {
            throw new TypeError(`${context} is not an AbortSignal.`);
          }
        }
        function convertReadableWritablePair(pair, context) {
          assertDictionary(pair, context);
          const readable = pair === null || pair === void 0 ? void 0 : pair.readable;
          assertRequiredField(readable, "readable", "ReadableWritablePair");
          assertReadableStream(readable, `${context} has member 'readable' that`);
          const writable2 = pair === null || pair === void 0 ? void 0 : pair.writable;
          assertRequiredField(writable2, "writable", "ReadableWritablePair");
          assertWritableStream(writable2, `${context} has member 'writable' that`);
          return { readable, writable: writable2 };
        }
        class ReadableStream2 {
          constructor(rawUnderlyingSource = {}, rawStrategy = {}) {
            if (rawUnderlyingSource === void 0) {
              rawUnderlyingSource = null;
            } else {
              assertObject(rawUnderlyingSource, "First parameter");
            }
            const strategy = convertQueuingStrategy(rawStrategy, "Second parameter");
            const underlyingSource = convertUnderlyingDefaultOrByteSource(rawUnderlyingSource, "First parameter");
            InitializeReadableStream(this);
            if (underlyingSource.type === "bytes") {
              if (strategy.size !== void 0) {
                throw new RangeError("The strategy for a byte stream cannot have a size function");
              }
              const highWaterMark = ExtractHighWaterMark(strategy, 0);
              SetUpReadableByteStreamControllerFromUnderlyingSource(this, underlyingSource, highWaterMark);
            } else {
              const sizeAlgorithm = ExtractSizeAlgorithm(strategy);
              const highWaterMark = ExtractHighWaterMark(strategy, 1);
              SetUpReadableStreamDefaultControllerFromUnderlyingSource(this, underlyingSource, highWaterMark, sizeAlgorithm);
            }
          }
          get locked() {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("locked");
            }
            return IsReadableStreamLocked(this);
          }
          cancel(reason = void 0) {
            if (!IsReadableStream(this)) {
              return promiseRejectedWith(streamBrandCheckException$1("cancel"));
            }
            if (IsReadableStreamLocked(this)) {
              return promiseRejectedWith(new TypeError("Cannot cancel a stream that already has a reader"));
            }
            return ReadableStreamCancel(this, reason);
          }
          getReader(rawOptions = void 0) {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("getReader");
            }
            const options2 = convertReaderOptions(rawOptions, "First parameter");
            if (options2.mode === void 0) {
              return AcquireReadableStreamDefaultReader(this);
            }
            return AcquireReadableStreamBYOBReader(this);
          }
          pipeThrough(rawTransform, rawOptions = {}) {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("pipeThrough");
            }
            assertRequiredArgument(rawTransform, 1, "pipeThrough");
            const transform = convertReadableWritablePair(rawTransform, "First parameter");
            const options2 = convertPipeOptions(rawOptions, "Second parameter");
            if (IsReadableStreamLocked(this)) {
              throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked ReadableStream");
            }
            if (IsWritableStreamLocked(transform.writable)) {
              throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked WritableStream");
            }
            const promise = ReadableStreamPipeTo(this, transform.writable, options2.preventClose, options2.preventAbort, options2.preventCancel, options2.signal);
            setPromiseIsHandledToTrue(promise);
            return transform.readable;
          }
          pipeTo(destination, rawOptions = {}) {
            if (!IsReadableStream(this)) {
              return promiseRejectedWith(streamBrandCheckException$1("pipeTo"));
            }
            if (destination === void 0) {
              return promiseRejectedWith(`Parameter 1 is required in 'pipeTo'.`);
            }
            if (!IsWritableStream(destination)) {
              return promiseRejectedWith(new TypeError(`ReadableStream.prototype.pipeTo's first argument must be a WritableStream`));
            }
            let options2;
            try {
              options2 = convertPipeOptions(rawOptions, "Second parameter");
            } catch (e) {
              return promiseRejectedWith(e);
            }
            if (IsReadableStreamLocked(this)) {
              return promiseRejectedWith(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked ReadableStream"));
            }
            if (IsWritableStreamLocked(destination)) {
              return promiseRejectedWith(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked WritableStream"));
            }
            return ReadableStreamPipeTo(this, destination, options2.preventClose, options2.preventAbort, options2.preventCancel, options2.signal);
          }
          tee() {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("tee");
            }
            const branches = ReadableStreamTee(this);
            return CreateArrayFromList(branches);
          }
          values(rawOptions = void 0) {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("values");
            }
            const options2 = convertIteratorOptions(rawOptions, "First parameter");
            return AcquireReadableStreamAsyncIterator(this, options2.preventCancel);
          }
        }
        Object.defineProperties(ReadableStream2.prototype, {
          cancel: { enumerable: true },
          getReader: { enumerable: true },
          pipeThrough: { enumerable: true },
          pipeTo: { enumerable: true },
          tee: { enumerable: true },
          values: { enumerable: true },
          locked: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStream2.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStream",
            configurable: true
          });
        }
        if (typeof SymbolPolyfill.asyncIterator === "symbol") {
          Object.defineProperty(ReadableStream2.prototype, SymbolPolyfill.asyncIterator, {
            value: ReadableStream2.prototype.values,
            writable: true,
            configurable: true
          });
        }
        function CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark = 1, sizeAlgorithm = () => 1) {
          const stream = Object.create(ReadableStream2.prototype);
          InitializeReadableStream(stream);
          const controller = Object.create(ReadableStreamDefaultController.prototype);
          SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
          return stream;
        }
        function CreateReadableByteStream(startAlgorithm, pullAlgorithm, cancelAlgorithm) {
          const stream = Object.create(ReadableStream2.prototype);
          InitializeReadableStream(stream);
          const controller = Object.create(ReadableByteStreamController.prototype);
          SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, 0, void 0);
          return stream;
        }
        function InitializeReadableStream(stream) {
          stream._state = "readable";
          stream._reader = void 0;
          stream._storedError = void 0;
          stream._disturbed = false;
        }
        function IsReadableStream(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_readableStreamController")) {
            return false;
          }
          return x instanceof ReadableStream2;
        }
        function IsReadableStreamLocked(stream) {
          if (stream._reader === void 0) {
            return false;
          }
          return true;
        }
        function ReadableStreamCancel(stream, reason) {
          stream._disturbed = true;
          if (stream._state === "closed") {
            return promiseResolvedWith(void 0);
          }
          if (stream._state === "errored") {
            return promiseRejectedWith(stream._storedError);
          }
          ReadableStreamClose(stream);
          const reader = stream._reader;
          if (reader !== void 0 && IsReadableStreamBYOBReader(reader)) {
            reader._readIntoRequests.forEach((readIntoRequest) => {
              readIntoRequest._closeSteps(void 0);
            });
            reader._readIntoRequests = new SimpleQueue();
          }
          const sourceCancelPromise = stream._readableStreamController[CancelSteps](reason);
          return transformPromiseWith(sourceCancelPromise, noop2);
        }
        function ReadableStreamClose(stream) {
          stream._state = "closed";
          const reader = stream._reader;
          if (reader === void 0) {
            return;
          }
          defaultReaderClosedPromiseResolve(reader);
          if (IsReadableStreamDefaultReader(reader)) {
            reader._readRequests.forEach((readRequest) => {
              readRequest._closeSteps();
            });
            reader._readRequests = new SimpleQueue();
          }
        }
        function ReadableStreamError(stream, e) {
          stream._state = "errored";
          stream._storedError = e;
          const reader = stream._reader;
          if (reader === void 0) {
            return;
          }
          defaultReaderClosedPromiseReject(reader, e);
          if (IsReadableStreamDefaultReader(reader)) {
            reader._readRequests.forEach((readRequest) => {
              readRequest._errorSteps(e);
            });
            reader._readRequests = new SimpleQueue();
          } else {
            reader._readIntoRequests.forEach((readIntoRequest) => {
              readIntoRequest._errorSteps(e);
            });
            reader._readIntoRequests = new SimpleQueue();
          }
        }
        function streamBrandCheckException$1(name) {
          return new TypeError(`ReadableStream.prototype.${name} can only be used on a ReadableStream`);
        }
        function convertQueuingStrategyInit(init2, context) {
          assertDictionary(init2, context);
          const highWaterMark = init2 === null || init2 === void 0 ? void 0 : init2.highWaterMark;
          assertRequiredField(highWaterMark, "highWaterMark", "QueuingStrategyInit");
          return {
            highWaterMark: convertUnrestrictedDouble(highWaterMark)
          };
        }
        const byteLengthSizeFunction = (chunk) => {
          return chunk.byteLength;
        };
        Object.defineProperty(byteLengthSizeFunction, "name", {
          value: "size",
          configurable: true
        });
        class ByteLengthQueuingStrategy {
          constructor(options2) {
            assertRequiredArgument(options2, 1, "ByteLengthQueuingStrategy");
            options2 = convertQueuingStrategyInit(options2, "First parameter");
            this._byteLengthQueuingStrategyHighWaterMark = options2.highWaterMark;
          }
          get highWaterMark() {
            if (!IsByteLengthQueuingStrategy(this)) {
              throw byteLengthBrandCheckException("highWaterMark");
            }
            return this._byteLengthQueuingStrategyHighWaterMark;
          }
          get size() {
            if (!IsByteLengthQueuingStrategy(this)) {
              throw byteLengthBrandCheckException("size");
            }
            return byteLengthSizeFunction;
          }
        }
        Object.defineProperties(ByteLengthQueuingStrategy.prototype, {
          highWaterMark: { enumerable: true },
          size: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ByteLengthQueuingStrategy.prototype, SymbolPolyfill.toStringTag, {
            value: "ByteLengthQueuingStrategy",
            configurable: true
          });
        }
        function byteLengthBrandCheckException(name) {
          return new TypeError(`ByteLengthQueuingStrategy.prototype.${name} can only be used on a ByteLengthQueuingStrategy`);
        }
        function IsByteLengthQueuingStrategy(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_byteLengthQueuingStrategyHighWaterMark")) {
            return false;
          }
          return x instanceof ByteLengthQueuingStrategy;
        }
        const countSizeFunction = () => {
          return 1;
        };
        Object.defineProperty(countSizeFunction, "name", {
          value: "size",
          configurable: true
        });
        class CountQueuingStrategy {
          constructor(options2) {
            assertRequiredArgument(options2, 1, "CountQueuingStrategy");
            options2 = convertQueuingStrategyInit(options2, "First parameter");
            this._countQueuingStrategyHighWaterMark = options2.highWaterMark;
          }
          get highWaterMark() {
            if (!IsCountQueuingStrategy(this)) {
              throw countBrandCheckException("highWaterMark");
            }
            return this._countQueuingStrategyHighWaterMark;
          }
          get size() {
            if (!IsCountQueuingStrategy(this)) {
              throw countBrandCheckException("size");
            }
            return countSizeFunction;
          }
        }
        Object.defineProperties(CountQueuingStrategy.prototype, {
          highWaterMark: { enumerable: true },
          size: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(CountQueuingStrategy.prototype, SymbolPolyfill.toStringTag, {
            value: "CountQueuingStrategy",
            configurable: true
          });
        }
        function countBrandCheckException(name) {
          return new TypeError(`CountQueuingStrategy.prototype.${name} can only be used on a CountQueuingStrategy`);
        }
        function IsCountQueuingStrategy(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_countQueuingStrategyHighWaterMark")) {
            return false;
          }
          return x instanceof CountQueuingStrategy;
        }
        function convertTransformer(original, context) {
          assertDictionary(original, context);
          const flush = original === null || original === void 0 ? void 0 : original.flush;
          const readableType = original === null || original === void 0 ? void 0 : original.readableType;
          const start = original === null || original === void 0 ? void 0 : original.start;
          const transform = original === null || original === void 0 ? void 0 : original.transform;
          const writableType = original === null || original === void 0 ? void 0 : original.writableType;
          return {
            flush: flush === void 0 ? void 0 : convertTransformerFlushCallback(flush, original, `${context} has member 'flush' that`),
            readableType,
            start: start === void 0 ? void 0 : convertTransformerStartCallback(start, original, `${context} has member 'start' that`),
            transform: transform === void 0 ? void 0 : convertTransformerTransformCallback(transform, original, `${context} has member 'transform' that`),
            writableType
          };
        }
        function convertTransformerFlushCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => promiseCall(fn, original, [controller]);
        }
        function convertTransformerStartCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => reflectCall(fn, original, [controller]);
        }
        function convertTransformerTransformCallback(fn, original, context) {
          assertFunction(fn, context);
          return (chunk, controller) => promiseCall(fn, original, [chunk, controller]);
        }
        class TransformStream {
          constructor(rawTransformer = {}, rawWritableStrategy = {}, rawReadableStrategy = {}) {
            if (rawTransformer === void 0) {
              rawTransformer = null;
            }
            const writableStrategy = convertQueuingStrategy(rawWritableStrategy, "Second parameter");
            const readableStrategy = convertQueuingStrategy(rawReadableStrategy, "Third parameter");
            const transformer = convertTransformer(rawTransformer, "First parameter");
            if (transformer.readableType !== void 0) {
              throw new RangeError("Invalid readableType specified");
            }
            if (transformer.writableType !== void 0) {
              throw new RangeError("Invalid writableType specified");
            }
            const readableHighWaterMark = ExtractHighWaterMark(readableStrategy, 0);
            const readableSizeAlgorithm = ExtractSizeAlgorithm(readableStrategy);
            const writableHighWaterMark = ExtractHighWaterMark(writableStrategy, 1);
            const writableSizeAlgorithm = ExtractSizeAlgorithm(writableStrategy);
            let startPromise_resolve;
            const startPromise = newPromise((resolve2) => {
              startPromise_resolve = resolve2;
            });
            InitializeTransformStream(this, startPromise, writableHighWaterMark, writableSizeAlgorithm, readableHighWaterMark, readableSizeAlgorithm);
            SetUpTransformStreamDefaultControllerFromTransformer(this, transformer);
            if (transformer.start !== void 0) {
              startPromise_resolve(transformer.start(this._transformStreamController));
            } else {
              startPromise_resolve(void 0);
            }
          }
          get readable() {
            if (!IsTransformStream(this)) {
              throw streamBrandCheckException("readable");
            }
            return this._readable;
          }
          get writable() {
            if (!IsTransformStream(this)) {
              throw streamBrandCheckException("writable");
            }
            return this._writable;
          }
        }
        Object.defineProperties(TransformStream.prototype, {
          readable: { enumerable: true },
          writable: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(TransformStream.prototype, SymbolPolyfill.toStringTag, {
            value: "TransformStream",
            configurable: true
          });
        }
        function InitializeTransformStream(stream, startPromise, writableHighWaterMark, writableSizeAlgorithm, readableHighWaterMark, readableSizeAlgorithm) {
          function startAlgorithm() {
            return startPromise;
          }
          function writeAlgorithm(chunk) {
            return TransformStreamDefaultSinkWriteAlgorithm(stream, chunk);
          }
          function abortAlgorithm(reason) {
            return TransformStreamDefaultSinkAbortAlgorithm(stream, reason);
          }
          function closeAlgorithm() {
            return TransformStreamDefaultSinkCloseAlgorithm(stream);
          }
          stream._writable = CreateWritableStream(startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, writableHighWaterMark, writableSizeAlgorithm);
          function pullAlgorithm() {
            return TransformStreamDefaultSourcePullAlgorithm(stream);
          }
          function cancelAlgorithm(reason) {
            TransformStreamErrorWritableAndUnblockWrite(stream, reason);
            return promiseResolvedWith(void 0);
          }
          stream._readable = CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, readableHighWaterMark, readableSizeAlgorithm);
          stream._backpressure = void 0;
          stream._backpressureChangePromise = void 0;
          stream._backpressureChangePromise_resolve = void 0;
          TransformStreamSetBackpressure(stream, true);
          stream._transformStreamController = void 0;
        }
        function IsTransformStream(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_transformStreamController")) {
            return false;
          }
          return x instanceof TransformStream;
        }
        function TransformStreamError(stream, e) {
          ReadableStreamDefaultControllerError(stream._readable._readableStreamController, e);
          TransformStreamErrorWritableAndUnblockWrite(stream, e);
        }
        function TransformStreamErrorWritableAndUnblockWrite(stream, e) {
          TransformStreamDefaultControllerClearAlgorithms(stream._transformStreamController);
          WritableStreamDefaultControllerErrorIfNeeded(stream._writable._writableStreamController, e);
          if (stream._backpressure) {
            TransformStreamSetBackpressure(stream, false);
          }
        }
        function TransformStreamSetBackpressure(stream, backpressure) {
          if (stream._backpressureChangePromise !== void 0) {
            stream._backpressureChangePromise_resolve();
          }
          stream._backpressureChangePromise = newPromise((resolve2) => {
            stream._backpressureChangePromise_resolve = resolve2;
          });
          stream._backpressure = backpressure;
        }
        class TransformStreamDefaultController {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get desiredSize() {
            if (!IsTransformStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException("desiredSize");
            }
            const readableController = this._controlledTransformStream._readable._readableStreamController;
            return ReadableStreamDefaultControllerGetDesiredSize(readableController);
          }
          enqueue(chunk = void 0) {
            if (!IsTransformStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException("enqueue");
            }
            TransformStreamDefaultControllerEnqueue(this, chunk);
          }
          error(reason = void 0) {
            if (!IsTransformStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException("error");
            }
            TransformStreamDefaultControllerError(this, reason);
          }
          terminate() {
            if (!IsTransformStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException("terminate");
            }
            TransformStreamDefaultControllerTerminate(this);
          }
        }
        Object.defineProperties(TransformStreamDefaultController.prototype, {
          enqueue: { enumerable: true },
          error: { enumerable: true },
          terminate: { enumerable: true },
          desiredSize: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(TransformStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
            value: "TransformStreamDefaultController",
            configurable: true
          });
        }
        function IsTransformStreamDefaultController(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_controlledTransformStream")) {
            return false;
          }
          return x instanceof TransformStreamDefaultController;
        }
        function SetUpTransformStreamDefaultController(stream, controller, transformAlgorithm, flushAlgorithm) {
          controller._controlledTransformStream = stream;
          stream._transformStreamController = controller;
          controller._transformAlgorithm = transformAlgorithm;
          controller._flushAlgorithm = flushAlgorithm;
        }
        function SetUpTransformStreamDefaultControllerFromTransformer(stream, transformer) {
          const controller = Object.create(TransformStreamDefaultController.prototype);
          let transformAlgorithm = (chunk) => {
            try {
              TransformStreamDefaultControllerEnqueue(controller, chunk);
              return promiseResolvedWith(void 0);
            } catch (transformResultE) {
              return promiseRejectedWith(transformResultE);
            }
          };
          let flushAlgorithm = () => promiseResolvedWith(void 0);
          if (transformer.transform !== void 0) {
            transformAlgorithm = (chunk) => transformer.transform(chunk, controller);
          }
          if (transformer.flush !== void 0) {
            flushAlgorithm = () => transformer.flush(controller);
          }
          SetUpTransformStreamDefaultController(stream, controller, transformAlgorithm, flushAlgorithm);
        }
        function TransformStreamDefaultControllerClearAlgorithms(controller) {
          controller._transformAlgorithm = void 0;
          controller._flushAlgorithm = void 0;
        }
        function TransformStreamDefaultControllerEnqueue(controller, chunk) {
          const stream = controller._controlledTransformStream;
          const readableController = stream._readable._readableStreamController;
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(readableController)) {
            throw new TypeError("Readable side is not in a state that permits enqueue");
          }
          try {
            ReadableStreamDefaultControllerEnqueue(readableController, chunk);
          } catch (e) {
            TransformStreamErrorWritableAndUnblockWrite(stream, e);
            throw stream._readable._storedError;
          }
          const backpressure = ReadableStreamDefaultControllerHasBackpressure(readableController);
          if (backpressure !== stream._backpressure) {
            TransformStreamSetBackpressure(stream, true);
          }
        }
        function TransformStreamDefaultControllerError(controller, e) {
          TransformStreamError(controller._controlledTransformStream, e);
        }
        function TransformStreamDefaultControllerPerformTransform(controller, chunk) {
          const transformPromise = controller._transformAlgorithm(chunk);
          return transformPromiseWith(transformPromise, void 0, (r) => {
            TransformStreamError(controller._controlledTransformStream, r);
            throw r;
          });
        }
        function TransformStreamDefaultControllerTerminate(controller) {
          const stream = controller._controlledTransformStream;
          const readableController = stream._readable._readableStreamController;
          ReadableStreamDefaultControllerClose(readableController);
          const error2 = new TypeError("TransformStream terminated");
          TransformStreamErrorWritableAndUnblockWrite(stream, error2);
        }
        function TransformStreamDefaultSinkWriteAlgorithm(stream, chunk) {
          const controller = stream._transformStreamController;
          if (stream._backpressure) {
            const backpressureChangePromise = stream._backpressureChangePromise;
            return transformPromiseWith(backpressureChangePromise, () => {
              const writable2 = stream._writable;
              const state = writable2._state;
              if (state === "erroring") {
                throw writable2._storedError;
              }
              return TransformStreamDefaultControllerPerformTransform(controller, chunk);
            });
          }
          return TransformStreamDefaultControllerPerformTransform(controller, chunk);
        }
        function TransformStreamDefaultSinkAbortAlgorithm(stream, reason) {
          TransformStreamError(stream, reason);
          return promiseResolvedWith(void 0);
        }
        function TransformStreamDefaultSinkCloseAlgorithm(stream) {
          const readable = stream._readable;
          const controller = stream._transformStreamController;
          const flushPromise = controller._flushAlgorithm();
          TransformStreamDefaultControllerClearAlgorithms(controller);
          return transformPromiseWith(flushPromise, () => {
            if (readable._state === "errored") {
              throw readable._storedError;
            }
            ReadableStreamDefaultControllerClose(readable._readableStreamController);
          }, (r) => {
            TransformStreamError(stream, r);
            throw readable._storedError;
          });
        }
        function TransformStreamDefaultSourcePullAlgorithm(stream) {
          TransformStreamSetBackpressure(stream, false);
          return stream._backpressureChangePromise;
        }
        function defaultControllerBrandCheckException(name) {
          return new TypeError(`TransformStreamDefaultController.prototype.${name} can only be used on a TransformStreamDefaultController`);
        }
        function streamBrandCheckException(name) {
          return new TypeError(`TransformStream.prototype.${name} can only be used on a TransformStream`);
        }
        exports2.ByteLengthQueuingStrategy = ByteLengthQueuingStrategy;
        exports2.CountQueuingStrategy = CountQueuingStrategy;
        exports2.ReadableByteStreamController = ReadableByteStreamController;
        exports2.ReadableStream = ReadableStream2;
        exports2.ReadableStreamBYOBReader = ReadableStreamBYOBReader;
        exports2.ReadableStreamBYOBRequest = ReadableStreamBYOBRequest;
        exports2.ReadableStreamDefaultController = ReadableStreamDefaultController;
        exports2.ReadableStreamDefaultReader = ReadableStreamDefaultReader;
        exports2.TransformStream = TransformStream;
        exports2.TransformStreamDefaultController = TransformStreamDefaultController;
        exports2.WritableStream = WritableStream;
        exports2.WritableStreamDefaultController = WritableStreamDefaultController;
        exports2.WritableStreamDefaultWriter = WritableStreamDefaultWriter;
        Object.defineProperty(exports2, "__esModule", { value: true });
      });
    })(ponyfill_es2018, ponyfill_es2018.exports);
    POOL_SIZE$1 = 65536;
    if (!globalThis.ReadableStream) {
      try {
        const process2 = require("node:process");
        const { emitWarning } = process2;
        try {
          process2.emitWarning = () => {
          };
          Object.assign(globalThis, require("node:stream/web"));
          process2.emitWarning = emitWarning;
        } catch (error2) {
          process2.emitWarning = emitWarning;
          throw error2;
        }
      } catch (error2) {
        Object.assign(globalThis, ponyfill_es2018.exports);
      }
    }
    try {
      const { Blob: Blob3 } = require("buffer");
      if (Blob3 && !Blob3.prototype.stream) {
        Blob3.prototype.stream = function name(params) {
          let position = 0;
          const blob = this;
          return new ReadableStream({
            type: "bytes",
            async pull(ctrl) {
              const chunk = blob.slice(position, Math.min(blob.size, position + POOL_SIZE$1));
              const buffer = await chunk.arrayBuffer();
              position += buffer.byteLength;
              ctrl.enqueue(new Uint8Array(buffer));
              if (position === blob.size) {
                ctrl.close();
              }
            }
          });
        };
      }
    } catch (error2) {
    }
    POOL_SIZE = 65536;
    _Blob = class Blob {
      #parts = [];
      #type = "";
      #size = 0;
      constructor(blobParts = [], options2 = {}) {
        if (typeof blobParts !== "object" || blobParts === null) {
          throw new TypeError("Failed to construct 'Blob': The provided value cannot be converted to a sequence.");
        }
        if (typeof blobParts[Symbol.iterator] !== "function") {
          throw new TypeError("Failed to construct 'Blob': The object must have a callable @@iterator property.");
        }
        if (typeof options2 !== "object" && typeof options2 !== "function") {
          throw new TypeError("Failed to construct 'Blob': parameter 2 cannot convert to dictionary.");
        }
        if (options2 === null)
          options2 = {};
        const encoder = new TextEncoder();
        for (const element of blobParts) {
          let part;
          if (ArrayBuffer.isView(element)) {
            part = new Uint8Array(element.buffer.slice(element.byteOffset, element.byteOffset + element.byteLength));
          } else if (element instanceof ArrayBuffer) {
            part = new Uint8Array(element.slice(0));
          } else if (element instanceof Blob) {
            part = element;
          } else {
            part = encoder.encode(element);
          }
          this.#size += ArrayBuffer.isView(part) ? part.byteLength : part.size;
          this.#parts.push(part);
        }
        const type = options2.type === void 0 ? "" : String(options2.type);
        this.#type = /^[\x20-\x7E]*$/.test(type) ? type : "";
      }
      get size() {
        return this.#size;
      }
      get type() {
        return this.#type;
      }
      async text() {
        const decoder = new TextDecoder();
        let str = "";
        for await (const part of toIterator(this.#parts, false)) {
          str += decoder.decode(part, { stream: true });
        }
        str += decoder.decode();
        return str;
      }
      async arrayBuffer() {
        const data = new Uint8Array(this.size);
        let offset = 0;
        for await (const chunk of toIterator(this.#parts, false)) {
          data.set(chunk, offset);
          offset += chunk.length;
        }
        return data.buffer;
      }
      stream() {
        const it = toIterator(this.#parts, true);
        return new globalThis.ReadableStream({
          type: "bytes",
          async pull(ctrl) {
            const chunk = await it.next();
            chunk.done ? ctrl.close() : ctrl.enqueue(chunk.value);
          },
          async cancel() {
            await it.return();
          }
        });
      }
      slice(start = 0, end = this.size, type = "") {
        const { size } = this;
        let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
        let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
        const span = Math.max(relativeEnd - relativeStart, 0);
        const parts = this.#parts;
        const blobParts = [];
        let added = 0;
        for (const part of parts) {
          if (added >= span) {
            break;
          }
          const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
          if (relativeStart && size2 <= relativeStart) {
            relativeStart -= size2;
            relativeEnd -= size2;
          } else {
            let chunk;
            if (ArrayBuffer.isView(part)) {
              chunk = part.subarray(relativeStart, Math.min(size2, relativeEnd));
              added += chunk.byteLength;
            } else {
              chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
              added += chunk.size;
            }
            relativeEnd -= size2;
            blobParts.push(chunk);
            relativeStart = 0;
          }
        }
        const blob = new Blob([], { type: String(type).toLowerCase() });
        blob.#size = span;
        blob.#parts = blobParts;
        return blob;
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
      static [Symbol.hasInstance](object) {
        return object && typeof object === "object" && typeof object.constructor === "function" && (typeof object.stream === "function" || typeof object.arrayBuffer === "function") && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
      }
    };
    Object.defineProperties(_Blob.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    Blob2 = _Blob;
    Blob$1 = Blob2;
    FetchBaseError = class extends Error {
      constructor(message, type) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.type = type;
      }
      get name() {
        return this.constructor.name;
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
    };
    FetchError = class extends FetchBaseError {
      constructor(message, type, systemError) {
        super(message, type);
        if (systemError) {
          this.code = this.errno = systemError.code;
          this.erroredSysCall = systemError.syscall;
        }
      }
    };
    NAME = Symbol.toStringTag;
    isURLSearchParameters = (object) => {
      return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
    };
    isBlob = (object) => {
      return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
    };
    isAbortSignal = (object) => {
      return typeof object === "object" && (object[NAME] === "AbortSignal" || object[NAME] === "EventTarget");
    };
    carriage = "\r\n";
    dashes = "-".repeat(2);
    carriageLength = Buffer.byteLength(carriage);
    getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
    getBoundary = () => (0, import_crypto.randomBytes)(8).toString("hex");
    INTERNALS$2 = Symbol("Body internals");
    Body = class {
      constructor(body4, {
        size = 0
      } = {}) {
        let boundary = null;
        if (body4 === null) {
          body4 = null;
        } else if (isURLSearchParameters(body4)) {
          body4 = Buffer.from(body4.toString());
        } else if (isBlob(body4))
          ;
        else if (Buffer.isBuffer(body4))
          ;
        else if (import_util.types.isAnyArrayBuffer(body4)) {
          body4 = Buffer.from(body4);
        } else if (ArrayBuffer.isView(body4)) {
          body4 = Buffer.from(body4.buffer, body4.byteOffset, body4.byteLength);
        } else if (body4 instanceof import_stream.default)
          ;
        else if (isFormData(body4)) {
          boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
          body4 = import_stream.default.Readable.from(formDataIterator(body4, boundary));
        } else {
          body4 = Buffer.from(String(body4));
        }
        this[INTERNALS$2] = {
          body: body4,
          boundary,
          disturbed: false,
          error: null
        };
        this.size = size;
        if (body4 instanceof import_stream.default) {
          body4.on("error", (error_) => {
            const error2 = error_ instanceof FetchBaseError ? error_ : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${error_.message}`, "system", error_);
            this[INTERNALS$2].error = error2;
          });
        }
      }
      get body() {
        return this[INTERNALS$2].body;
      }
      get bodyUsed() {
        return this[INTERNALS$2].disturbed;
      }
      async arrayBuffer() {
        const { buffer, byteOffset, byteLength } = await consumeBody(this);
        return buffer.slice(byteOffset, byteOffset + byteLength);
      }
      async blob() {
        const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
        const buf = await this.buffer();
        return new Blob$1([buf], {
          type: ct
        });
      }
      async json() {
        const buffer = await consumeBody(this);
        return JSON.parse(buffer.toString());
      }
      async text() {
        const buffer = await consumeBody(this);
        return buffer.toString();
      }
      buffer() {
        return consumeBody(this);
      }
    };
    Object.defineProperties(Body.prototype, {
      body: { enumerable: true },
      bodyUsed: { enumerable: true },
      arrayBuffer: { enumerable: true },
      blob: { enumerable: true },
      json: { enumerable: true },
      text: { enumerable: true }
    });
    clone = (instance, highWaterMark) => {
      let p1;
      let p2;
      let { body: body4 } = instance;
      if (instance.bodyUsed) {
        throw new Error("cannot clone body after it is used");
      }
      if (body4 instanceof import_stream.default && typeof body4.getBoundary !== "function") {
        p1 = new import_stream.PassThrough({ highWaterMark });
        p2 = new import_stream.PassThrough({ highWaterMark });
        body4.pipe(p1);
        body4.pipe(p2);
        instance[INTERNALS$2].body = p1;
        body4 = p2;
      }
      return body4;
    };
    extractContentType = (body4, request) => {
      if (body4 === null) {
        return null;
      }
      if (typeof body4 === "string") {
        return "text/plain;charset=UTF-8";
      }
      if (isURLSearchParameters(body4)) {
        return "application/x-www-form-urlencoded;charset=UTF-8";
      }
      if (isBlob(body4)) {
        return body4.type || null;
      }
      if (Buffer.isBuffer(body4) || import_util.types.isAnyArrayBuffer(body4) || ArrayBuffer.isView(body4)) {
        return null;
      }
      if (body4 && typeof body4.getBoundary === "function") {
        return `multipart/form-data;boundary=${body4.getBoundary()}`;
      }
      if (isFormData(body4)) {
        return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
      }
      if (body4 instanceof import_stream.default) {
        return null;
      }
      return "text/plain;charset=UTF-8";
    };
    getTotalBytes = (request) => {
      const { body: body4 } = request;
      if (body4 === null) {
        return 0;
      }
      if (isBlob(body4)) {
        return body4.size;
      }
      if (Buffer.isBuffer(body4)) {
        return body4.length;
      }
      if (body4 && typeof body4.getLengthSync === "function") {
        return body4.hasKnownLength && body4.hasKnownLength() ? body4.getLengthSync() : null;
      }
      if (isFormData(body4)) {
        return getFormDataLength(request[INTERNALS$2].boundary);
      }
      return null;
    };
    writeToStream = (dest, { body: body4 }) => {
      if (body4 === null) {
        dest.end();
      } else if (isBlob(body4)) {
        import_stream.default.Readable.from(body4.stream()).pipe(dest);
      } else if (Buffer.isBuffer(body4)) {
        dest.write(body4);
        dest.end();
      } else {
        body4.pipe(dest);
      }
    };
    validateHeaderName = typeof import_http.default.validateHeaderName === "function" ? import_http.default.validateHeaderName : (name) => {
      if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
        const error2 = new TypeError(`Header name must be a valid HTTP token [${name}]`);
        Object.defineProperty(error2, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
        throw error2;
      }
    };
    validateHeaderValue = typeof import_http.default.validateHeaderValue === "function" ? import_http.default.validateHeaderValue : (name, value) => {
      if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
        const error2 = new TypeError(`Invalid character in header content ["${name}"]`);
        Object.defineProperty(error2, "code", { value: "ERR_INVALID_CHAR" });
        throw error2;
      }
    };
    Headers = class extends URLSearchParams {
      constructor(init2) {
        let result = [];
        if (init2 instanceof Headers) {
          const raw = init2.raw();
          for (const [name, values] of Object.entries(raw)) {
            result.push(...values.map((value) => [name, value]));
          }
        } else if (init2 == null)
          ;
        else if (typeof init2 === "object" && !import_util.types.isBoxedPrimitive(init2)) {
          const method = init2[Symbol.iterator];
          if (method == null) {
            result.push(...Object.entries(init2));
          } else {
            if (typeof method !== "function") {
              throw new TypeError("Header pairs must be iterable");
            }
            result = [...init2].map((pair) => {
              if (typeof pair !== "object" || import_util.types.isBoxedPrimitive(pair)) {
                throw new TypeError("Each header pair must be an iterable object");
              }
              return [...pair];
            }).map((pair) => {
              if (pair.length !== 2) {
                throw new TypeError("Each header pair must be a name/value tuple");
              }
              return [...pair];
            });
          }
        } else {
          throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
        }
        result = result.length > 0 ? result.map(([name, value]) => {
          validateHeaderName(name);
          validateHeaderValue(name, String(value));
          return [String(name).toLowerCase(), String(value)];
        }) : void 0;
        super(result);
        return new Proxy(this, {
          get(target, p, receiver) {
            switch (p) {
              case "append":
              case "set":
                return (name, value) => {
                  validateHeaderName(name);
                  validateHeaderValue(name, String(value));
                  return URLSearchParams.prototype[p].call(target, String(name).toLowerCase(), String(value));
                };
              case "delete":
              case "has":
              case "getAll":
                return (name) => {
                  validateHeaderName(name);
                  return URLSearchParams.prototype[p].call(target, String(name).toLowerCase());
                };
              case "keys":
                return () => {
                  target.sort();
                  return new Set(URLSearchParams.prototype.keys.call(target)).keys();
                };
              default:
                return Reflect.get(target, p, receiver);
            }
          }
        });
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
      toString() {
        return Object.prototype.toString.call(this);
      }
      get(name) {
        const values = this.getAll(name);
        if (values.length === 0) {
          return null;
        }
        let value = values.join(", ");
        if (/^content-encoding$/i.test(name)) {
          value = value.toLowerCase();
        }
        return value;
      }
      forEach(callback, thisArg = void 0) {
        for (const name of this.keys()) {
          Reflect.apply(callback, thisArg, [this.get(name), name, this]);
        }
      }
      *values() {
        for (const name of this.keys()) {
          yield this.get(name);
        }
      }
      *entries() {
        for (const name of this.keys()) {
          yield [name, this.get(name)];
        }
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      raw() {
        return [...this.keys()].reduce((result, key) => {
          result[key] = this.getAll(key);
          return result;
        }, {});
      }
      [Symbol.for("nodejs.util.inspect.custom")]() {
        return [...this.keys()].reduce((result, key) => {
          const values = this.getAll(key);
          if (key === "host") {
            result[key] = values[0];
          } else {
            result[key] = values.length > 1 ? values : values[0];
          }
          return result;
        }, {});
      }
    };
    Object.defineProperties(Headers.prototype, ["get", "entries", "forEach", "values"].reduce((result, property) => {
      result[property] = { enumerable: true };
      return result;
    }, {}));
    redirectStatus = new Set([301, 302, 303, 307, 308]);
    isRedirect = (code) => {
      return redirectStatus.has(code);
    };
    INTERNALS$1 = Symbol("Response internals");
    Response = class extends Body {
      constructor(body4 = null, options2 = {}) {
        super(body4, options2);
        const status = options2.status != null ? options2.status : 200;
        const headers = new Headers(options2.headers);
        if (body4 !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(body4);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        this[INTERNALS$1] = {
          type: "default",
          url: options2.url,
          status,
          statusText: options2.statusText || "",
          headers,
          counter: options2.counter,
          highWaterMark: options2.highWaterMark
        };
      }
      get type() {
        return this[INTERNALS$1].type;
      }
      get url() {
        return this[INTERNALS$1].url || "";
      }
      get status() {
        return this[INTERNALS$1].status;
      }
      get ok() {
        return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
      }
      get redirected() {
        return this[INTERNALS$1].counter > 0;
      }
      get statusText() {
        return this[INTERNALS$1].statusText;
      }
      get headers() {
        return this[INTERNALS$1].headers;
      }
      get highWaterMark() {
        return this[INTERNALS$1].highWaterMark;
      }
      clone() {
        return new Response(clone(this, this.highWaterMark), {
          type: this.type,
          url: this.url,
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          ok: this.ok,
          redirected: this.redirected,
          size: this.size
        });
      }
      static redirect(url, status = 302) {
        if (!isRedirect(status)) {
          throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
        }
        return new Response(null, {
          headers: {
            location: new URL(url).toString()
          },
          status
        });
      }
      static error() {
        const response = new Response(null, { status: 0, statusText: "" });
        response[INTERNALS$1].type = "error";
        return response;
      }
      get [Symbol.toStringTag]() {
        return "Response";
      }
    };
    Object.defineProperties(Response.prototype, {
      type: { enumerable: true },
      url: { enumerable: true },
      status: { enumerable: true },
      ok: { enumerable: true },
      redirected: { enumerable: true },
      statusText: { enumerable: true },
      headers: { enumerable: true },
      clone: { enumerable: true }
    });
    getSearch = (parsedURL) => {
      if (parsedURL.search) {
        return parsedURL.search;
      }
      const lastOffset = parsedURL.href.length - 1;
      const hash2 = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
      return parsedURL.href[lastOffset - hash2.length] === "?" ? "?" : "";
    };
    INTERNALS = Symbol("Request internals");
    isRequest = (object) => {
      return typeof object === "object" && typeof object[INTERNALS] === "object";
    };
    Request = class extends Body {
      constructor(input, init2 = {}) {
        let parsedURL;
        if (isRequest(input)) {
          parsedURL = new URL(input.url);
        } else {
          parsedURL = new URL(input);
          input = {};
        }
        let method = init2.method || input.method || "GET";
        method = method.toUpperCase();
        if ((init2.body != null || isRequest(input)) && input.body !== null && (method === "GET" || method === "HEAD")) {
          throw new TypeError("Request with GET/HEAD method cannot have body");
        }
        const inputBody = init2.body ? init2.body : isRequest(input) && input.body !== null ? clone(input) : null;
        super(inputBody, {
          size: init2.size || input.size || 0
        });
        const headers = new Headers(init2.headers || input.headers || {});
        if (inputBody !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(inputBody, this);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        let signal = isRequest(input) ? input.signal : null;
        if ("signal" in init2) {
          signal = init2.signal;
        }
        if (signal != null && !isAbortSignal(signal)) {
          throw new TypeError("Expected signal to be an instanceof AbortSignal or EventTarget");
        }
        this[INTERNALS] = {
          method,
          redirect: init2.redirect || input.redirect || "follow",
          headers,
          parsedURL,
          signal
        };
        this.follow = init2.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init2.follow;
        this.compress = init2.compress === void 0 ? input.compress === void 0 ? true : input.compress : init2.compress;
        this.counter = init2.counter || input.counter || 0;
        this.agent = init2.agent || input.agent;
        this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
        this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
      }
      get method() {
        return this[INTERNALS].method;
      }
      get url() {
        return (0, import_url.format)(this[INTERNALS].parsedURL);
      }
      get headers() {
        return this[INTERNALS].headers;
      }
      get redirect() {
        return this[INTERNALS].redirect;
      }
      get signal() {
        return this[INTERNALS].signal;
      }
      clone() {
        return new Request(this);
      }
      get [Symbol.toStringTag]() {
        return "Request";
      }
    };
    Object.defineProperties(Request.prototype, {
      method: { enumerable: true },
      url: { enumerable: true },
      headers: { enumerable: true },
      redirect: { enumerable: true },
      clone: { enumerable: true },
      signal: { enumerable: true }
    });
    getNodeRequestOptions = (request) => {
      const { parsedURL } = request[INTERNALS];
      const headers = new Headers(request[INTERNALS].headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      let contentLengthValue = null;
      if (request.body === null && /^(post|put)$/i.test(request.method)) {
        contentLengthValue = "0";
      }
      if (request.body !== null) {
        const totalBytes = getTotalBytes(request);
        if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
          contentLengthValue = String(totalBytes);
        }
      }
      if (contentLengthValue) {
        headers.set("Content-Length", contentLengthValue);
      }
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "node-fetch");
      }
      if (request.compress && !headers.has("Accept-Encoding")) {
        headers.set("Accept-Encoding", "gzip,deflate,br");
      }
      let { agent } = request;
      if (typeof agent === "function") {
        agent = agent(parsedURL);
      }
      if (!headers.has("Connection") && !agent) {
        headers.set("Connection", "close");
      }
      const search = getSearch(parsedURL);
      const requestOptions = {
        path: parsedURL.pathname + search,
        pathname: parsedURL.pathname,
        hostname: parsedURL.hostname,
        protocol: parsedURL.protocol,
        port: parsedURL.port,
        hash: parsedURL.hash,
        search: parsedURL.search,
        query: parsedURL.query,
        href: parsedURL.href,
        method: request.method,
        headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
        insecureHTTPParser: request.insecureHTTPParser,
        agent
      };
      return requestOptions;
    };
    AbortError = class extends FetchBaseError {
      constructor(message, type = "aborted") {
        super(message, type);
      }
    };
    supportedSchemas = new Set(["data:", "http:", "https:"]);
  }
});

// node_modules/@sveltejs/adapter-vercel/files/shims.js
var init_shims = __esm({
  "node_modules/@sveltejs/adapter-vercel/files/shims.js"() {
    init_install_fetch();
  }
});

// .svelte-kit/output/server/chunks/_notes-e57ee9a1.js
var import_path, metadata$4, Constitution_and_commitment, __glob_1_0, metadata$3, Political_foundation_democracy, __glob_1_1, metadata$2, Tying_kings_hands, __glob_1_2, metadata$1, Violence_social_orders, __glob_1_3, metadata, Violence_trap, __glob_1_4, modules, notes;
var init_notes_e57ee9a1 = __esm({
  ".svelte-kit/output/server/chunks/_notes-e57ee9a1.js"() {
    init_shims();
    init_app_e9883c9f();
    import_path = __toModule(require("path"));
    metadata$4 = {
      "title": "\u5BAA\u6CD5\u548C\u627F\u8BFA",
      "date": "2011-11-26T00:00:00.000Z",
      "book": "Constitutions and Commitment: The Evolution of Institutions Governing Public Choice in Seventeenth-Century England",
      "authors": ["Douglass C. North", "Barry R. Weingast"],
      "publisher": "The Journal of Economic History, Vol 49, No. 4, 803-832",
      "year": 1989,
      "category": "\u653F\u6CBB\u5B66",
      "draft": false
    };
    Constitution_and_commitment = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `<p>The article studies the evolution of the constitutional arrangements in seventeenth-century England following the Glorious Revolution of 1688. It focuses on the relationship between institutions and the behavior of the government and interprets the institutional changes on the basis of the goals of the winners-secure property rights, protection of their wealth, and the elimination of confiscatory government. We argue that the new institutions allowed the government to commit credibly to upholding property rights. Their success was remarkable, as the evidence from capital markets shows.</p>`;
    });
    __glob_1_0 = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      [Symbol.toStringTag]: "Module",
      "default": Constitution_and_commitment,
      metadata: metadata$4
    });
    metadata$3 = {
      "title": "\u6C11\u4E3B\u4E0E\u6CD5\u6CBB\u7684\u653F\u6CBB\u57FA\u7840",
      "date": "2011-11-26T00:00:00.000Z",
      "book": "The Political Foundations of Democracy and the Rule of Law",
      "authors": ["Barry R. Weingast"],
      "publisher": "The American Political Science Review, Vol 91, No. 2, 245-263",
      "year": 1997,
      "category": "\u653F\u6CBB\u5B66",
      "draft": false
    };
    Political_foundation_democracy = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `<p>This paper develops a game-theoretic approach to the problem of political officials\u2019 respect for political and economic rights of citizens. It models the policing of rights as a coordination problem among citizens, but one with asymmetries difficult to resolve in a decentralized manner. The paper shows that democratic stability depends on a self-enforcing equilibrium: It must be in the interests of political officials to respect democracy\u2019s limits on their behavior. The concept of self-enforcing limits on the state illuminates a diverse set of problems and thus serves as a potential basis for integrating the literature. The framework is applied to a range of topics, such as democratic stability, plural societies, and elite pacts. The paper also applies its lessons to the case of the Glorious Revolution in seventeenth-century England.</p>`;
    });
    __glob_1_1 = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      [Symbol.toStringTag]: "Module",
      "default": Political_foundation_democracy,
      metadata: metadata$3
    });
    metadata$2 = {
      "title": "\u7F1A\u4F4F\u56FD\u738B\u7684\u624B",
      "date": "2011-11-26T00:00:00.000Z",
      "book": "Tying the King's hands: Credible commitments and royal fiscal policy during the old regime",
      "authors": ["Hilton L. Root"],
      "publisher": "Rationality and Society, Vol 1, Issue 2, 240-258",
      "year": 1989,
      "category": "\u653F\u6CBB\u5B66",
      "draft": false
    };
    Tying_kings_hands = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `<p>Conclusion: \u201CThe irony of absolutism\u201D:</p>
<ul><li>\u201Cin sum, because the king claimed full discretion, he had less real power\u201D (253). He had to pay higher interest on loans because he claimed to be above the law</li>
<li>So he supported the growth and strengthening of intermediaries that could act as bankers for the king, taking loans from the public to make loans to the king. This included the traditional corporations: village communities, guilds, provincial estates.</li>
<li>Later, though, the many concessions granted to these groups made tax collection difficult. The king wanted to dissolve these corporations, but found that he couldn\u2019t. (He didn\u2019t have the resources to absorb their debt, thus risked financial crisis by just absorbing them and leaving their debts to the public unpaid).</li>
<li>So the corporations had gained the power to \u201Cimpose their terms on the crown and to block efforts to overhaul the fiscal system\u201D (253)</li></ul>`;
    });
    __glob_1_2 = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      [Symbol.toStringTag]: "Module",
      "default": Tying_kings_hands,
      metadata: metadata$2
    });
    metadata$1 = {
      "title": "\u66B4\u529B\u4E0E\u793E\u4F1A\u79E9\u5E8F",
      "date": "2011-11-26T00:00:00.000Z",
      "book": "Violence and Social Orders: A Conceptual Framework for Interpreting Recorded Human History",
      "authors": ["Douglass C. Morth", "John Joseph Wallis", "Barry R. Weingast"],
      "publisher": "Cambridge University Press",
      "year": 2009,
      "category": "\u653F\u6CBB\u5B66",
      "draft": false
    };
    Violence_social_orders = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `<p>All societies must deal with the possibility of violence, and they do so in different ways. This book integrates the problem of violence into a larger social science and historical framework, showing how economic and political behavior are closely linked. Most societies, which we call natural states, limit violence by political manipulation of the economy to create privileged interests. These privileges limit the use of violence by powerful individuals, but doing so hinders both economic and political development. In contrast, modern societies create open access to economic and political organizations, fostering political and economic competition. The book provides a framework for understanding the two types of social orders, why open access societies are both politically and economically more developed, and how some 25 countries have made the transition between the two types.</p>`;
    });
    __glob_1_3 = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      [Symbol.toStringTag]: "Module",
      "default": Violence_social_orders,
      metadata: metadata$1
    });
    metadata = {
      "title": "\u66B4\u529B\u9677\u9631",
      "date": "2011-11-26T00:00:00.000Z",
      "book": "The violence trap: a political-economic approach to the problems of development",
      "authors": ["Gary W. Cox", "Douglass C. Morth", "Barry R. Weingast"],
      "publisher": "Journal of Public Finance and Public Choices, vol. 34, no. 1, 3-19",
      "year": 2019,
      "category": "\u653F\u6CBB\u5B66",
      "draft": false
    };
    Violence_trap = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `<p>Why do developing countries fail to adopt the institutions and policies that promote development? Our answer is the violence trap. Key political reforms \u2014 opening access and reducing rents \u2014 are typically feasible only when the domestic economy reaches a given level of complexity (for reasons we specify); yet complex economies typically can emerge only when key political reforms are already in place (for standard reasons). The interdependence of political reform and economic complexity entails violence because, as we show, unreformed polities lack adaptive efficiency. The literature sparked by Lipset\u2019s modernization thesis has operationalized \u201Ceconomic development\u201D as a higher GDP per capita. Building on Steuart, we view development as creating a more complex economy whose workings will be more seriously disrupted by political violence. Empirically, we show that economic complexity (as measured by the Hidalgo-Hausmann index) strongly deters coups, even controlling for GDP per capita and level of democracy.</p>`;
    });
    __glob_1_4 = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      [Symbol.toStringTag]: "Module",
      "default": Violence_trap,
      metadata
    });
    modules = { "/notes/constitution-and-commitment/index.md": __glob_1_0, "/notes/political-foundation-democracy/index.md": __glob_1_1, "/notes/tying-kings-hands/index.md": __glob_1_2, "/notes/violence-social-orders/index.md": __glob_1_3, "/notes/violence-trap/index.md": __glob_1_4 };
    notes = Object.entries(modules).map(([filepath, module2]) => {
      const slug = (0, import_path.basename)((0, import_path.dirname)(filepath));
      const { metadata: metadata22 } = module2;
      const { html } = module2.default.render();
      return {
        slug,
        html,
        ...metadata22
      };
    });
  }
});

// .svelte-kit/output/server/chunks/index.json-474e5ef7.js
var index_json_474e5ef7_exports = {};
__export(index_json_474e5ef7_exports, {
  get: () => get
});
async function get() {
  const sortedNotes = Object.keys(notes).map((key) => notes[key]);
  sortedNotes.sort((b, a) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    if (da < db)
      return -1;
    if (da === db)
      return 0;
    if (da > db)
      return 1;
  });
  return {
    body: { notes: sortedNotes }
  };
}
var import_path2;
var init_index_json_474e5ef7 = __esm({
  ".svelte-kit/output/server/chunks/index.json-474e5ef7.js"() {
    init_shims();
    init_notes_e57ee9a1();
    init_app_e9883c9f();
    import_path2 = __toModule(require("path"));
  }
});

// .svelte-kit/output/server/chunks/_slug_.json-2e965cca.js
var slug_json_2e965cca_exports = {};
__export(slug_json_2e965cca_exports, {
  get: () => get2
});
async function get2(req) {
  const { slug } = req.params;
  const sortedNotes = Object.keys(notes).map((key) => notes[key]);
  const note = sortedNotes.find((note2) => note2.slug === slug);
  return {
    body: { note }
  };
}
var import_path3;
var init_slug_json_2e965cca = __esm({
  ".svelte-kit/output/server/chunks/_slug_.json-2e965cca.js"() {
    init_shims();
    init_notes_e57ee9a1();
    init_app_e9883c9f();
    import_path3 = __toModule(require("path"));
  }
});

// .svelte-kit/output/server/chunks/__layout-cc84681e.js
var layout_cc84681e_exports = {};
__export(layout_cc84681e_exports, {
  default: () => _layout
});
var getStores, page, Src, MenuRightOutline, Contact, css, _layout;
var init_layout_cc84681e = __esm({
  ".svelte-kit/output/server/chunks/__layout-cc84681e.js"() {
    init_shims();
    init_app_e9883c9f();
    getStores = () => {
      const stores = getContext("__svelte__");
      return {
        page: {
          subscribe: stores.page.subscribe
        },
        navigating: {
          subscribe: stores.navigating.subscribe
        },
        get preloading() {
          console.error("stores.preloading is deprecated; use stores.navigating instead");
          return {
            subscribe: stores.navigating.subscribe
          };
        },
        session: stores.session
      };
    };
    page = {
      subscribe(fn) {
        const store = getStores().page;
        return store.subscribe(fn);
      }
    };
    Src = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { exclude = [] } = $$props;
      let child;
      createEventDispatcher();
      if ($$props.exclude === void 0 && $$bindings.exclude && exclude !== void 0)
        $$bindings.exclude(exclude);
      return `
<div${add_attribute("this", child, 0)}>${slots.default ? slots.default({}) : ``}</div>`;
    });
    MenuRightOutline = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { size = "1em" } = $$props;
      let { width = size } = $$props;
      let { height = size } = $$props;
      let { color = "currentColor" } = $$props;
      let { viewBox = "0 0 24 24" } = $$props;
      if ($$props.size === void 0 && $$bindings.size && size !== void 0)
        $$bindings.size(size);
      if ($$props.width === void 0 && $$bindings.width && width !== void 0)
        $$bindings.width(width);
      if ($$props.height === void 0 && $$bindings.height && height !== void 0)
        $$bindings.height(height);
      if ($$props.color === void 0 && $$bindings.color && color !== void 0)
        $$bindings.color(color);
      if ($$props.viewBox === void 0 && $$bindings.viewBox && viewBox !== void 0)
        $$bindings.viewBox(viewBox);
      return `<svg${add_attribute("width", width, 0)}${add_attribute("height", height, 0)}${add_attribute("viewBox", viewBox, 0)}><path d="${"M9,6H10.5L16.5,12L10.5,18H9V6M13.67,12L11,9.33V14.67L13.67,12Z"}"${add_attribute("fill", color, 0)}></path></svg>`;
    });
    Contact = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `<form action="${"https://formspree.io/f/xbjqdgdd"}" method="${"POST"}" class="${"flex flex-col space-y-4"}"><input type="${"email"}" name="${"_replyto"}" placeholder="${"\u7535\u90AE"}" required class="${"bg-gray-700 text-gray-300"}">
<input type="${"text"}" name="${"name"}" placeholder="${"\u59D3\u540D"}" required class="${"bg-gray-700 text-gray-300"}">
<textarea name="${"message"}" placeholder="${"\u7559\u8A00"}" rows="${"10"}" required class="${"p-2 bg-gray-700 text-gray-300"}"></textarea>

  
  <button type="${"submit"}" class="${"px-2 py-1 bg-gray-800 text-gray-300"}">\u63D0\u4EA4</button></form>`;
    });
    css = {
      code: ".open.svelte-1esn761 .icon.svelte-1esn761{transform:rotate(-180deg)}",
      map: null
    };
    _layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let $page, $$unsubscribe_page;
      $$unsubscribe_page = subscribe(page, (value) => $page = value);
      let { size = "1.525rem" } = $$props;
      const routes = [
        { href: "/", name: "\u9996 \u9875" },
        { href: "/blog", name: "\u535A \u5BA2" },
        { href: "/notes", name: "\u7B14 \u8BB0" },
        { href: "/talks", name: "\u62A5 \u544A" },
        { href: "/recipe", name: "\u5403 \u8D27" },
        { href: "/about", name: "\u5173 \u4E8E" }
      ];
      if ($$props.size === void 0 && $$bindings.size && size !== void 0)
        $$bindings.size(size);
      $$result.css.add(css);
      $$unsubscribe_page();
      return `<div class="${"flex h-screen"}"><aside class="${[
        "flex md:flex flex-col items-center justify-evenly w-full md:w-1/5 border-r-4 border-gray-700 px-2 min-w-max",
        "hidden"
      ].join(" ").trim()}"><header class="${"text-center"}"><p class="${"text-2xl font-bold"}">\u4E00\u6307\u7985</p>
   <p class="${"text-sm text-yellow-500"}">\u60EF\u770B\u79CB\u6708\u6625\u98CE</p></header>
   <nav><ul class="${"list-none text-center m-0"}">${each(routes, (route) => `<li class="${["my-4 mx-0 border-gray-300", $page.path === route.href ? "border-b-2" : ""].join(" ").trim()}"><a sveltekit:prefetch${add_attribute("href", route.href, 0)} class="${"block text-gray-300 hover:text-gray-100"}">${escape(route.name)}</a>
        </li>`)}</ul></nav>
<footer class="${"text-sm"}"><span>\xA9 2020 - ${escape(new Date().getFullYear())}</span></footer></aside>

    <main class="${"pt-8 px-4 md:px-6 mx-auto w-full md:w-3/5 overflow-auto"}">${validate_component(Src, "ClickOutside").$$render($$result, {}, {}, {
        default: () => `<button class="${[
          "bg-gray-700 text-yellow-500 px-2.5 py-0.5 mb-6 md:hidden shadow rounded flex items-center space-x-1 svelte-1esn761",
          ""
        ].join(" ").trim()}"><div class="${"icon svelte-1esn761"}">${validate_component(MenuRightOutline, "MenuRightOutline").$$render($$result, { size }, {}, {})}</div><span class="${"text-lg font-bold"}">\u4E00\u6307\u7985</span></button>`
      })}
        ${slots.default ? slots.default({}) : ``}</main>
    <div class="${"md:grid self-center justify-self-center text-center mx-auto px-6 hidden md:w-1/5"}"><h4>\u8054\u7CFB\u6211</h4>
        ${validate_component(Contact, "Contact").$$render($$result, {}, {}, {})}</div>

</div>`;
    });
  }
});

// .svelte-kit/output/server/chunks/error-78e5edd1.js
var error_78e5edd1_exports = {};
__export(error_78e5edd1_exports, {
  default: () => Error2,
  load: () => load
});
function load({ error: error2, status }) {
  return { props: { error: error2, status } };
}
var Error2;
var init_error_78e5edd1 = __esm({
  ".svelte-kit/output/server/chunks/error-78e5edd1.js"() {
    init_shims();
    init_app_e9883c9f();
    Error2 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { status } = $$props;
      let { error: error2 } = $$props;
      if ($$props.status === void 0 && $$bindings.status && status !== void 0)
        $$bindings.status(status);
      if ($$props.error === void 0 && $$bindings.error && error2 !== void 0)
        $$bindings.error(error2);
      return `<h1>${escape(status)}</h1>

<pre>${escape(error2.message)}</pre>



${error2.frame ? `<pre>${escape(error2.frame)}</pre>` : ``}
${error2.stack ? `<pre>${escape(error2.stack)}</pre>` : ``}`;
    });
  }
});

// .svelte-kit/output/server/chunks/index-3fb453f5.js
var index_3fb453f5_exports = {};
__export(index_3fb453f5_exports, {
  default: () => Routes,
  prerender: () => prerender
});
var css2, prerender, Routes;
var init_index_3fb453f5 = __esm({
  ".svelte-kit/output/server/chunks/index-3fb453f5.js"() {
    init_shims();
    init_app_e9883c9f();
    css2 = {
      code: "@import url('https://fonts.googleapis.com/css2?family=Zhi+Mang+Xing&display=swap');.one.svelte-1jhmiaz{font-family:'Zhi Mang Xing', cursive;margin:0 auto}@media(min-width: 768px){.one.svelte-1jhmiaz{font-family:'Zhi Mang Xing', cursive;margin:0 auto;writing-mode:vertical-rl;writing-mode:tb-rl}}",
      map: null
    };
    prerender = true;
    Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { src: src2 = "/images/lanke.webp" } = $$props;
      let { alt = "lanke" } = $$props;
      if ($$props.src === void 0 && $$bindings.src && src2 !== void 0)
        $$bindings.src(src2);
      if ($$props.alt === void 0 && $$bindings.alt && alt !== void 0)
        $$bindings.alt(alt);
      $$result.css.add(css2);
      return `${$$result.head += `${$$result.title = `<title>Home</title>`, ""}`, ""}

<section class="${"grid h-full w-full"}"><div class="${"self-center justify-self-center"}"><img${add_attribute("src", src2, 0)}${add_attribute("alt", alt, 0)} width="${"1500"}" loading="${"lazy"}" class="${"max-w-full h-auto rounded object-fill mb-12"}">
		
	<div class="${"one text-3xl text-center svelte-1jhmiaz"}"><h2 class="${"md:ml-12 mb-12"}">\u4E34\u6C5F\u4ED9</h2>
		<h6 class="${"md:ml-12 mb-12"}">\u3010\u660E\u3011\u6768\u614E </h6>
				<p class="${"md:ml-4"}">\u6EDA\u6EDA\u957F\u6C5F\u4E1C\u901D\u6C34\uFF0C</p>
				<p class="${"md:ml-4"}">\u6D6A\u82B1\u6DD8\u5C3D\u82F1\u96C4\u3002</p>
				<p class="${"md:ml-4"}">\u662F\u975E\u6210\u8D25\u8F6C\u5934\u7A7A\u3002</p>
				<p class="${"md:ml-4"}">\u9752\u5C71\u4F9D\u65E7\u5728\uFF0C</p>
				<p class="${"md:ml-8"}">\u51E0\u5EA6\u5915\u9633\u7EA2\u3002</p>
                
				<p class="${"md:ml-4"}">\u767D\u53D1\u6E14\u6A35\u6C5F\u6E1A\u4E0A\uFF0C</p>
				<p class="${"md:ml-4"}">\u60EF\u770B\u79CB\u6708\u6625\u98CE\u3002</p>
				<p class="${"md:ml-4"}">\u4E00\u58F6\u6D4A\u9152\u559C\u76F8\u9022\u3002</p>
				<p class="${"md:ml-4"}">\u53E4\u4ECA\u591A\u5C11\u4E8B\uFF0C</p>
				<p class="${"md:ml-4"}">\u90FD\u4ED8\u7B11\u8C08\u4E2D\u3002</p></div></div>
	</section>`;
    });
  }
});

// .svelte-kit/output/server/chunks/index-ac111f78.js
var index_ac111f78_exports = {};
__export(index_ac111f78_exports, {
  default: () => Recipe
});
function isOutOfViewport(parent, container) {
  const parentBounding = parent.getBoundingClientRect();
  const boundingContainer = container.getBoundingClientRect();
  const out = {};
  out.top = parentBounding.top < 0;
  out.left = parentBounding.left < 0;
  out.bottom = parentBounding.bottom + boundingContainer.height > (window.innerHeight || document.documentElement.clientHeight);
  out.right = parentBounding.right > (window.innerWidth || document.documentElement.clientWidth);
  out.any = out.top || out.left || out.bottom || out.right;
  return out;
}
function isItemActive(item, value, optionIdentifier) {
  return value && value[optionIdentifier] === item[optionIdentifier];
}
function isItemFirst(itemIndex) {
  return itemIndex === 0;
}
function isItemHover(hoverItemIndex, item, itemIndex, items) {
  return isItemSelectable(item) && (hoverItemIndex === itemIndex || items.length === 1);
}
function isItemSelectable(item) {
  return item.isGroupHeader && item.isSelectable || item.selectable || !item.hasOwnProperty("selectable");
}
function debounce(func, wait, immediate) {
  let timeout;
  return function executedFunction() {
    let context = this;
    let args = arguments;
    let later = function() {
      timeout = null;
      if (!immediate)
        func.apply(context, args);
    };
    let callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow)
      func.apply(context, args);
  };
}
function convertStringItemsToObjects(_items) {
  return _items.map((item, index) => {
    return { index, value: item, label: `${item}` };
  });
}
var dishes, css$6, Item, css$5, List, css$4, Selection, css$3, MultiSelection, css$2, VirtualList, ClearIcon, Object_1, css$1, Select, css3, Recipe;
var init_index_ac111f78 = __esm({
  ".svelte-kit/output/server/chunks/index-ac111f78.js"() {
    init_shims();
    init_app_e9883c9f();
    dishes = [
      {
        name: "\u8471\u70E7\u6392\u9AA8",
        type: "\u8364\u83DC",
        taste: "\u54B8\u9C9C",
        recipe: ""
      },
      {
        name: "\u7092\u9752\u82D7",
        type: "\u7D20\u83DC",
        taste: "\u6E05\u6DE1",
        recipe: ""
      },
      {
        name: "\u6CB9\u9EA6\u83DC",
        type: "\u7D20\u83DC",
        taste: "\u6E05\u6DE1",
        recipe: ""
      },
      {
        name: "\u5C0F\u7092\u8089",
        type: "\u8364\u83DC",
        taste: "\u9999\u8FA3",
        recipe: ""
      },
      {
        name: "\u571F\u8C46\u4E1D",
        type: "\u7D20\u83DC",
        taste: "\u6E05\u6DE1",
        recipe: ""
      },
      {
        name: "\u6E05\u84B8\u5C3C\u7F57\u7EA2",
        type: "\u8364\u83DC",
        taste: "\u54B8\u9C9C",
        recipe: ""
      },
      {
        name: "\u5E72\u9505\u725B\u86D9",
        type: "\u8364\u83DC",
        taste: "\u9999\u8FA3",
        recipe: ""
      },
      {
        name: "\u9999\u8FA3\u87F9",
        type: "\u8364\u83DC",
        taste: "\u9999\u8FA3",
        recipe: ""
      },
      {
        name: "\u6ED1\u85D5\u7247",
        type: "\u7D20\u83DC",
        taste: "\u6E05\u6DE1",
        recipe: ""
      },
      {
        name: "\u7C89\u84B8\u8089",
        type: "\u8364\u83DC",
        taste: "\u54B8\u9C9C",
        recipe: ""
      },
      {
        name: "\u7C89\u84B8\u6392\u9AA8",
        type: "\u8364\u83DC",
        taste: "\u54B8\u9C9C",
        recipe: ""
      },
      {
        name: "\u7F8A\u89D2\u8C46\u7092\u8089",
        type: "\u8364\u83DC",
        taste: "\u54B8\u9C9C",
        recipe: ""
      },
      {
        name: "\u82B9\u83DC\u7092\u9999\u5E72",
        type: "\u7D20\u83DC",
        taste: "\u54B8\u9C9C",
        recipe: ""
      },
      {
        name: "\u6E05\u7092\u56DB\u5B63\u8C46",
        type: "\u7D20\u83DC",
        taste: "\u6E05\u6DE1",
        recipe: ""
      },
      {
        name: "\u8C46\u89D2\u8089\u4E01",
        type: "\u8364\u83DC",
        taste: "\u6E05\u6DE1",
        recipe: ""
      },
      {
        name: "\u9999\u83C7\u70E7\u9E21\u7FC5",
        type: "\u8364\u83DC",
        taste: "\u54B8\u9C9C",
        recipe: ""
      },
      {
        name: "\u8FA3\u6912\u8304\u5B50",
        type: "\u7D20\u83DC",
        taste: "\u54B8\u9C9C",
        recipe: ""
      },
      {
        name: "\u8C46\u89D2\u8304\u5B50",
        type: "\u7D20\u83DC",
        taste: "\u54B8\u9C9C",
        recipe: ""
      },
      {
        name: "\u869D\u6CB9\u751F\u83DC",
        type: "\u7D20\u83DC",
        taste: "\u6E05\u6DE1",
        recipe: ""
      },
      {
        name: "\u56DE\u9505\u8089",
        type: "\u8364\u83DC",
        taste: "\u54B8\u9C9C",
        recipe: ""
      },
      {
        name: "\u756A\u8304\u7092\u86CB",
        type: "\u7D20\u83DC",
        taste: "\u6E05\u6DE1",
        recipe: ""
      },
      {
        name: "\u8282\u74DC\u7092\u8089",
        type: "\u8364\u83DC",
        taste: "\u6E05\u6DE1",
        recipe: ""
      },
      {
        name: "\u5730\u4E09\u9C9C",
        type: "\u7D20\u83DC",
        taste: "\u6E05\u6DE1",
        recipe: ""
      },
      {
        name: "\u7D20\u4E09\u70E7",
        type: "\u7D20\u83DC",
        taste: "\u54B8\u9C9C",
        recipe: ""
      },
      {
        name: "\u7D20\u7092\u9999\u83C7",
        type: "\u7D20\u83DC",
        taste: "\u54B8\u9C9C",
        recipe: ""
      },
      {
        name: "\u751F\u7092\u9C88\u9C7C",
        type: "\u8364\u83DC",
        taste: "\u54B8\u9C9C",
        recipe: ""
      },
      {
        name: "\u7802\u9505\u9EC4\u9C7C",
        type: "\u8364\u83DC",
        taste: "\u54B8\u9C9C",
        recipe: ""
      },
      {
        name: "\u709D\u7092\u5927\u767D\u83DC",
        type: "\u7D20\u83DC",
        taste: "\u6E05\u6DE1",
        recipe: ""
      },
      {
        name: "\u9C9C\u867E\u7C89\u4E1D\u7172",
        type: "\u8364\u83DC",
        taste: "\u54B8\u9C9C",
        recipe: ""
      },
      {
        name: "\u751F\u7092\u9C88\u9C7C",
        type: "\u8364\u83DC",
        taste: "\u54B8\u9C9C",
        recipe: ""
      },
      {
        name: "\u8C46\u89D2\u8089\u4E01",
        type: "\u8364\u83DC",
        taste: "\u54B8\u9C9C",
        recipe: ""
      },
      {
        name: "\u8FA3\u6912\u7092\u725B\u8089",
        type: "\u8364\u83DC",
        taste: "\u54B8\u9C9C",
        recipe: ""
      },
      {
        name: "\u9999\u7092\u767D\u83DC\u6746",
        type: "\u7D20\u83DC",
        taste: "\u54B8\u9C9C",
        recipe: ""
      },
      {
        name: "\u9AD8\u82AD\u7092\u8089\u7247",
        type: "\u8364\u83DC",
        taste: "\u54B8\u9C9C",
        recipe: ""
      }
    ];
    css$6 = {
      code: ".item.svelte-3e0qet{cursor:default;height:var(--height, 42px);line-height:var(--height, 42px);padding:var(--itemPadding, 0 20px);color:var(--itemColor, inherit);text-overflow:ellipsis;overflow:hidden;white-space:nowrap}.groupHeader.svelte-3e0qet{text-transform:var(--groupTitleTextTransform, uppercase)}.groupItem.svelte-3e0qet{padding-left:var(--groupItemPaddingLeft, 40px)}.item.svelte-3e0qet:active{background:var(--itemActiveBackground, #b9daff)}.item.active.svelte-3e0qet{background:var(--itemIsActiveBG, #007aff);color:var(--itemIsActiveColor, #fff)}.item.notSelectable.svelte-3e0qet{color:var(--itemIsNotSelectableColor, #999)}.item.first.svelte-3e0qet{border-radius:var(--itemFirstBorderRadius, 4px 4px 0 0)}.item.hover.svelte-3e0qet:not(.active){background:var(--itemHoverBG, #e7f2ff);color:var(--itemHoverColor, inherit)}",
      map: null
    };
    Item = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { isActive = false } = $$props;
      let { isFirst = false } = $$props;
      let { isHover = false } = $$props;
      let { isSelectable = false } = $$props;
      let { getOptionLabel = void 0 } = $$props;
      let { item = void 0 } = $$props;
      let { filterText = "" } = $$props;
      let itemClasses = "";
      if ($$props.isActive === void 0 && $$bindings.isActive && isActive !== void 0)
        $$bindings.isActive(isActive);
      if ($$props.isFirst === void 0 && $$bindings.isFirst && isFirst !== void 0)
        $$bindings.isFirst(isFirst);
      if ($$props.isHover === void 0 && $$bindings.isHover && isHover !== void 0)
        $$bindings.isHover(isHover);
      if ($$props.isSelectable === void 0 && $$bindings.isSelectable && isSelectable !== void 0)
        $$bindings.isSelectable(isSelectable);
      if ($$props.getOptionLabel === void 0 && $$bindings.getOptionLabel && getOptionLabel !== void 0)
        $$bindings.getOptionLabel(getOptionLabel);
      if ($$props.item === void 0 && $$bindings.item && item !== void 0)
        $$bindings.item(item);
      if ($$props.filterText === void 0 && $$bindings.filterText && filterText !== void 0)
        $$bindings.filterText(filterText);
      $$result.css.add(css$6);
      {
        {
          const classes = [];
          if (isActive) {
            classes.push("active");
          }
          if (isFirst) {
            classes.push("first");
          }
          if (isHover) {
            classes.push("hover");
          }
          if (item.isGroupHeader) {
            classes.push("groupHeader");
          }
          if (item.isGroupItem) {
            classes.push("groupItem");
          }
          if (!isSelectable) {
            classes.push("notSelectable");
          }
          itemClasses = classes.join(" ");
        }
      }
      return `<div class="${"item " + escape(itemClasses) + " svelte-3e0qet"}"><!-- HTML_TAG_START -->${getOptionLabel(item, filterText)}<!-- HTML_TAG_END --></div>`;
    });
    css$5 = {
      code: ".listContainer.svelte-1uyqfml{box-shadow:var(--listShadow, 0 2px 3px 0 rgba(44, 62, 80, 0.24));border-radius:var(--listBorderRadius, 4px);max-height:var(--listMaxHeight, 250px);overflow-y:auto;background:var(--listBackground, #fff);border:var(--listBorder, none);position:var(--listPosition, absolute);z-index:var(--listZIndex, 2);width:100%;left:var(--listLeft, 0);right:var(--listRight, 0)}.virtualList.svelte-1uyqfml{height:var(--virtualListHeight, 200px)}.listGroupTitle.svelte-1uyqfml{color:var(--groupTitleColor, #8f8f8f);cursor:default;font-size:var(--groupTitleFontSize, 12px);font-weight:var(--groupTitleFontWeight, 600);height:var(--height, 42px);line-height:var(--height, 42px);padding:var(--groupTitlePadding, 0 20px);text-overflow:ellipsis;overflow-x:hidden;white-space:nowrap;text-transform:var(--groupTitleTextTransform, uppercase)}.empty.svelte-1uyqfml{text-align:var(--listEmptyTextAlign, center);padding:var(--listEmptyPadding, 20px 0);color:var(--listEmptyColor, #78848f)}",
      map: null
    };
    List = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      createEventDispatcher();
      let { container = void 0 } = $$props;
      let { VirtualList: VirtualList2 = null } = $$props;
      let { Item: Item$1 = Item } = $$props;
      let { isVirtualList = false } = $$props;
      let { items = [] } = $$props;
      let { labelIdentifier = "label" } = $$props;
      let { getOptionLabel = (option, filterText2) => {
        if (option)
          return option.isCreator ? `Create "${filterText2}"` : option[labelIdentifier];
      } } = $$props;
      let { getGroupHeaderLabel = null } = $$props;
      let { itemHeight = 40 } = $$props;
      let { hoverItemIndex = 0 } = $$props;
      let { value = void 0 } = $$props;
      let { optionIdentifier = "value" } = $$props;
      let { hideEmptyState = false } = $$props;
      let { noOptionsMessage = "No options" } = $$props;
      let { isMulti = false } = $$props;
      let { activeItemIndex = 0 } = $$props;
      let { filterText = "" } = $$props;
      let { parent = null } = $$props;
      let { listPlacement = null } = $$props;
      let { listAutoWidth = null } = $$props;
      let { listOffset = 5 } = $$props;
      let listStyle;
      function computePlacement() {
        const { height, width } = parent.getBoundingClientRect();
        listStyle = "";
        listStyle += `min-width:${width}px;width:${listAutoWidth ? "auto" : "100%"};`;
        if (listPlacement === "top" || listPlacement === "auto" && isOutOfViewport(parent, container).bottom) {
          listStyle += `bottom:${height + listOffset}px;`;
        } else {
          listStyle += `top:${height + listOffset}px;`;
        }
      }
      if ($$props.container === void 0 && $$bindings.container && container !== void 0)
        $$bindings.container(container);
      if ($$props.VirtualList === void 0 && $$bindings.VirtualList && VirtualList2 !== void 0)
        $$bindings.VirtualList(VirtualList2);
      if ($$props.Item === void 0 && $$bindings.Item && Item$1 !== void 0)
        $$bindings.Item(Item$1);
      if ($$props.isVirtualList === void 0 && $$bindings.isVirtualList && isVirtualList !== void 0)
        $$bindings.isVirtualList(isVirtualList);
      if ($$props.items === void 0 && $$bindings.items && items !== void 0)
        $$bindings.items(items);
      if ($$props.labelIdentifier === void 0 && $$bindings.labelIdentifier && labelIdentifier !== void 0)
        $$bindings.labelIdentifier(labelIdentifier);
      if ($$props.getOptionLabel === void 0 && $$bindings.getOptionLabel && getOptionLabel !== void 0)
        $$bindings.getOptionLabel(getOptionLabel);
      if ($$props.getGroupHeaderLabel === void 0 && $$bindings.getGroupHeaderLabel && getGroupHeaderLabel !== void 0)
        $$bindings.getGroupHeaderLabel(getGroupHeaderLabel);
      if ($$props.itemHeight === void 0 && $$bindings.itemHeight && itemHeight !== void 0)
        $$bindings.itemHeight(itemHeight);
      if ($$props.hoverItemIndex === void 0 && $$bindings.hoverItemIndex && hoverItemIndex !== void 0)
        $$bindings.hoverItemIndex(hoverItemIndex);
      if ($$props.value === void 0 && $$bindings.value && value !== void 0)
        $$bindings.value(value);
      if ($$props.optionIdentifier === void 0 && $$bindings.optionIdentifier && optionIdentifier !== void 0)
        $$bindings.optionIdentifier(optionIdentifier);
      if ($$props.hideEmptyState === void 0 && $$bindings.hideEmptyState && hideEmptyState !== void 0)
        $$bindings.hideEmptyState(hideEmptyState);
      if ($$props.noOptionsMessage === void 0 && $$bindings.noOptionsMessage && noOptionsMessage !== void 0)
        $$bindings.noOptionsMessage(noOptionsMessage);
      if ($$props.isMulti === void 0 && $$bindings.isMulti && isMulti !== void 0)
        $$bindings.isMulti(isMulti);
      if ($$props.activeItemIndex === void 0 && $$bindings.activeItemIndex && activeItemIndex !== void 0)
        $$bindings.activeItemIndex(activeItemIndex);
      if ($$props.filterText === void 0 && $$bindings.filterText && filterText !== void 0)
        $$bindings.filterText(filterText);
      if ($$props.parent === void 0 && $$bindings.parent && parent !== void 0)
        $$bindings.parent(parent);
      if ($$props.listPlacement === void 0 && $$bindings.listPlacement && listPlacement !== void 0)
        $$bindings.listPlacement(listPlacement);
      if ($$props.listAutoWidth === void 0 && $$bindings.listAutoWidth && listAutoWidth !== void 0)
        $$bindings.listAutoWidth(listAutoWidth);
      if ($$props.listOffset === void 0 && $$bindings.listOffset && listOffset !== void 0)
        $$bindings.listOffset(listOffset);
      $$result.css.add(css$5);
      {
        {
          if (parent && container)
            computePlacement();
        }
      }
      return `

<div class="${["listContainer svelte-1uyqfml", isVirtualList ? "virtualList" : ""].join(" ").trim()}"${add_attribute("style", listStyle, 0)}${add_attribute("this", container, 0)}>${isVirtualList ? `${validate_component(VirtualList2 || missing_component, "svelte:component").$$render($$result, { items, itemHeight }, {}, {
        default: ({ item, i }) => `<div class="${"listItem"}">${validate_component(Item$1 || missing_component, "svelte:component").$$render($$result, {
          item,
          filterText,
          getOptionLabel,
          isFirst: isItemFirst(i),
          isActive: isItemActive(item, value, optionIdentifier),
          isHover: isItemHover(hoverItemIndex, item, i, items),
          isSelectable: isItemSelectable(item)
        }, {}, {})}</div>`
      })}` : `${items.length ? each(items, (item, i) => `${item.isGroupHeader && !item.isSelectable ? `<div class="${"listGroupTitle svelte-1uyqfml"}">${escape(getGroupHeaderLabel(item))}</div>` : `<div class="${"listItem"}" tabindex="${"-1"}">${validate_component(Item$1 || missing_component, "svelte:component").$$render($$result, {
        item,
        filterText,
        getOptionLabel,
        isFirst: isItemFirst(i),
        isActive: isItemActive(item, value, optionIdentifier),
        isHover: isItemHover(hoverItemIndex, item, i, items),
        isSelectable: isItemSelectable(item)
      }, {}, {})}
                </div>`}`) : `${!hideEmptyState ? `<div class="${"empty svelte-1uyqfml"}">${escape(noOptionsMessage)}</div>` : ``}`}`}</div>`;
    });
    css$4 = {
      code: ".selection.svelte-pu1q1n{text-overflow:ellipsis;overflow-x:hidden;white-space:nowrap}",
      map: null
    };
    Selection = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { getSelectionLabel = void 0 } = $$props;
      let { item = void 0 } = $$props;
      if ($$props.getSelectionLabel === void 0 && $$bindings.getSelectionLabel && getSelectionLabel !== void 0)
        $$bindings.getSelectionLabel(getSelectionLabel);
      if ($$props.item === void 0 && $$bindings.item && item !== void 0)
        $$bindings.item(item);
      $$result.css.add(css$4);
      return `<div class="${"selection svelte-pu1q1n"}"><!-- HTML_TAG_START -->${getSelectionLabel(item)}<!-- HTML_TAG_END --></div>`;
    });
    css$3 = {
      code: ".multiSelectItem.svelte-liu9pa.svelte-liu9pa{background:var(--multiItemBG, #ebedef);margin:var(--multiItemMargin, 5px 5px 0 0);border-radius:var(--multiItemBorderRadius, 16px);height:var(--multiItemHeight, 32px);line-height:var(--multiItemHeight, 32px);display:flex;cursor:default;padding:var(--multiItemPadding, 0 10px 0 15px);max-width:100%}.multiSelectItem_label.svelte-liu9pa.svelte-liu9pa{margin:var(--multiLabelMargin, 0 5px 0 0);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.multiSelectItem.svelte-liu9pa.svelte-liu9pa:hover,.multiSelectItem.active.svelte-liu9pa.svelte-liu9pa{background-color:var(--multiItemActiveBG, #006fff);color:var(--multiItemActiveColor, #fff)}.multiSelectItem.disabled.svelte-liu9pa.svelte-liu9pa:hover{background:var(--multiItemDisabledHoverBg, #ebedef);color:var(--multiItemDisabledHoverColor, #c1c6cc)}.multiSelectItem_clear.svelte-liu9pa.svelte-liu9pa{border-radius:var(--multiClearRadius, 50%);background:var(--multiClearBG, #52616f);min-width:var(--multiClearWidth, 16px);max-width:var(--multiClearWidth, 16px);height:var(--multiClearHeight, 16px);position:relative;top:var(--multiClearTop, 8px);text-align:var(--multiClearTextAlign, center);padding:var(--multiClearPadding, 1px)}.multiSelectItem_clear.svelte-liu9pa.svelte-liu9pa:hover,.active.svelte-liu9pa .multiSelectItem_clear.svelte-liu9pa{background:var(--multiClearHoverBG, #fff)}.multiSelectItem_clear.svelte-liu9pa:hover svg.svelte-liu9pa,.active.svelte-liu9pa .multiSelectItem_clear svg.svelte-liu9pa{fill:var(--multiClearHoverFill, #006fff)}.multiSelectItem_clear.svelte-liu9pa svg.svelte-liu9pa{fill:var(--multiClearFill, #ebedef);vertical-align:top}",
      map: null
    };
    MultiSelection = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      createEventDispatcher();
      let { value = [] } = $$props;
      let { activeValue = void 0 } = $$props;
      let { isDisabled = false } = $$props;
      let { multiFullItemClearable = false } = $$props;
      let { getSelectionLabel = void 0 } = $$props;
      if ($$props.value === void 0 && $$bindings.value && value !== void 0)
        $$bindings.value(value);
      if ($$props.activeValue === void 0 && $$bindings.activeValue && activeValue !== void 0)
        $$bindings.activeValue(activeValue);
      if ($$props.isDisabled === void 0 && $$bindings.isDisabled && isDisabled !== void 0)
        $$bindings.isDisabled(isDisabled);
      if ($$props.multiFullItemClearable === void 0 && $$bindings.multiFullItemClearable && multiFullItemClearable !== void 0)
        $$bindings.multiFullItemClearable(multiFullItemClearable);
      if ($$props.getSelectionLabel === void 0 && $$bindings.getSelectionLabel && getSelectionLabel !== void 0)
        $$bindings.getSelectionLabel(getSelectionLabel);
      $$result.css.add(css$3);
      return `${each(value, (item, i) => `<div class="${"multiSelectItem " + escape(activeValue === i ? "active" : "") + " " + escape(isDisabled ? "disabled" : "") + " svelte-liu9pa"}"><div class="${"multiSelectItem_label svelte-liu9pa"}"><!-- HTML_TAG_START -->${getSelectionLabel(item)}<!-- HTML_TAG_END --></div>
        ${!isDisabled && !multiFullItemClearable ? `<div class="${"multiSelectItem_clear svelte-liu9pa"}"><svg width="${"100%"}" height="${"100%"}" viewBox="${"-2 -2 50 50"}" focusable="${"false"}" aria-hidden="${"true"}" role="${"presentation"}" class="${"svelte-liu9pa"}"><path d="${"M34.923,37.251L24,26.328L13.077,37.251L9.436,33.61l10.923-10.923L9.436,11.765l3.641-3.641L24,19.047L34.923,8.124 l3.641,3.641L27.641,22.688L38.564,33.61L34.923,37.251z"}"></path></svg>
            </div>` : ``}
    </div>`)}`;
    });
    css$2 = {
      code: "svelte-virtual-list-viewport.svelte-g2cagw{position:relative;overflow-y:auto;-webkit-overflow-scrolling:touch;display:block}svelte-virtual-list-contents.svelte-g2cagw,svelte-virtual-list-row.svelte-g2cagw{display:block}svelte-virtual-list-row.svelte-g2cagw{overflow:hidden}",
      map: null
    };
    VirtualList = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { items = void 0 } = $$props;
      let { height = "100%" } = $$props;
      let { itemHeight = 40 } = $$props;
      let { hoverItemIndex = 0 } = $$props;
      let { start = 0 } = $$props;
      let { end = 0 } = $$props;
      let viewport;
      let contents;
      let visible;
      let top = 0;
      let bottom = 0;
      if ($$props.items === void 0 && $$bindings.items && items !== void 0)
        $$bindings.items(items);
      if ($$props.height === void 0 && $$bindings.height && height !== void 0)
        $$bindings.height(height);
      if ($$props.itemHeight === void 0 && $$bindings.itemHeight && itemHeight !== void 0)
        $$bindings.itemHeight(itemHeight);
      if ($$props.hoverItemIndex === void 0 && $$bindings.hoverItemIndex && hoverItemIndex !== void 0)
        $$bindings.hoverItemIndex(hoverItemIndex);
      if ($$props.start === void 0 && $$bindings.start && start !== void 0)
        $$bindings.start(start);
      if ($$props.end === void 0 && $$bindings.end && end !== void 0)
        $$bindings.end(end);
      $$result.css.add(css$2);
      visible = items.slice(start, end).map((data, i) => {
        return { index: i + start, data };
      });
      return `<svelte-virtual-list-viewport style="${"height: " + escape(height) + ";"}" class="${"svelte-g2cagw"}"${add_attribute("this", viewport, 0)}><svelte-virtual-list-contents style="${"padding-top: " + escape(top) + "px; padding-bottom: " + escape(bottom) + "px;"}" class="${"svelte-g2cagw"}"${add_attribute("this", contents, 0)}>${each(visible, (row) => `<svelte-virtual-list-row class="${"svelte-g2cagw"}">${slots.default ? slots.default({
        item: row.data,
        i: row.index,
        hoverItemIndex
      }) : `Missing template`}
            </svelte-virtual-list-row>`)}</svelte-virtual-list-contents></svelte-virtual-list-viewport>`;
    });
    ClearIcon = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `<svg width="${"100%"}" height="${"100%"}" viewBox="${"-2 -2 50 50"}" focusable="${"false"}" aria-hidden="${"true"}" role="${"presentation"}"><path fill="${"currentColor"}" d="${"M34.923,37.251L24,26.328L13.077,37.251L9.436,33.61l10.923-10.923L9.436,11.765l3.641-3.641L24,19.047L34.923,8.124\n    l3.641,3.641L27.641,22.688L38.564,33.61L34.923,37.251z"}"></path></svg>`;
    });
    ({ Object: Object_1 } = globals);
    css$1 = {
      code: ".selectContainer.svelte-17l1npl.svelte-17l1npl{--internalPadding:0 16px;border:var(--border, 1px solid #d8dbdf);border-radius:var(--borderRadius, 3px);box-sizing:border-box;height:var(--height, 42px);position:relative;display:flex;align-items:center;padding:var(--padding, var(--internalPadding));background:var(--background, #fff);margin:var(--margin, 0)}.selectContainer.svelte-17l1npl input.svelte-17l1npl{cursor:default;border:none;color:var(--inputColor, #3f4f5f);height:var(--height, 42px);line-height:var(--height, 42px);padding:var(--inputPadding, var(--padding, var(--internalPadding)));width:100%;background:transparent;font-size:var(--inputFontSize, 14px);letter-spacing:var(--inputLetterSpacing, -0.08px);position:absolute;left:var(--inputLeft, 0);margin:var(--inputMargin, 0)}.selectContainer.svelte-17l1npl input.svelte-17l1npl::placeholder{color:var(--placeholderColor, #78848f);opacity:var(--placeholderOpacity, 1)}.selectContainer.svelte-17l1npl input.svelte-17l1npl:focus{outline:none}.selectContainer.svelte-17l1npl.svelte-17l1npl:hover{border-color:var(--borderHoverColor, #b2b8bf)}.selectContainer.focused.svelte-17l1npl.svelte-17l1npl{border-color:var(--borderFocusColor, #006fe8)}.selectContainer.disabled.svelte-17l1npl.svelte-17l1npl{background:var(--disabledBackground, #ebedef);border-color:var(--disabledBorderColor, #ebedef);color:var(--disabledColor, #c1c6cc)}.selectContainer.disabled.svelte-17l1npl input.svelte-17l1npl::placeholder{color:var(--disabledPlaceholderColor, #c1c6cc);opacity:var(--disabledPlaceholderOpacity, 1)}.selectedItem.svelte-17l1npl.svelte-17l1npl{line-height:var(--height, 42px);height:var(--height, 42px);overflow-x:hidden;padding:var(--selectedItemPadding, 0 20px 0 0)}.selectedItem.svelte-17l1npl.svelte-17l1npl:focus{outline:none}.clearSelect.svelte-17l1npl.svelte-17l1npl{position:absolute;right:var(--clearSelectRight, 10px);top:var(--clearSelectTop, 11px);bottom:var(--clearSelectBottom, 11px);width:var(--clearSelectWidth, 20px);color:var(--clearSelectColor, #c5cacf);flex:none !important}.clearSelect.svelte-17l1npl.svelte-17l1npl:hover{color:var(--clearSelectHoverColor, #2c3e50)}.selectContainer.focused.svelte-17l1npl .clearSelect.svelte-17l1npl{color:var(--clearSelectFocusColor, #3f4f5f)}.indicator.svelte-17l1npl.svelte-17l1npl{position:absolute;right:var(--indicatorRight, 10px);top:var(--indicatorTop, 11px);width:var(--indicatorWidth, 20px);height:var(--indicatorHeight, 20px);color:var(--indicatorColor, #c5cacf)}.indicator.svelte-17l1npl svg.svelte-17l1npl{display:inline-block;fill:var(--indicatorFill, currentcolor);line-height:1;stroke:var(--indicatorStroke, currentcolor);stroke-width:0}.spinner.svelte-17l1npl.svelte-17l1npl{position:absolute;right:var(--spinnerRight, 10px);top:var(--spinnerLeft, 11px);width:var(--spinnerWidth, 20px);height:var(--spinnerHeight, 20px);color:var(--spinnerColor, #51ce6c);animation:svelte-17l1npl-rotate 0.75s linear infinite}.spinner_icon.svelte-17l1npl.svelte-17l1npl{display:block;height:100%;transform-origin:center center;width:100%;position:absolute;top:0;bottom:0;left:0;right:0;margin:auto;-webkit-transform:none}.spinner_path.svelte-17l1npl.svelte-17l1npl{stroke-dasharray:90;stroke-linecap:round}.multiSelect.svelte-17l1npl.svelte-17l1npl{display:flex;padding:var(--multiSelectPadding, 0 35px 0 16px);height:auto;flex-wrap:wrap;align-items:stretch}.multiSelect.svelte-17l1npl>.svelte-17l1npl{flex:1 1 50px}.selectContainer.multiSelect.svelte-17l1npl input.svelte-17l1npl{padding:var(--multiSelectInputPadding, 0);position:relative;margin:var(--multiSelectInputMargin, 0)}.hasError.svelte-17l1npl.svelte-17l1npl{border:var(--errorBorder, 1px solid #ff2d55);background:var(--errorBackground, #fff)}.a11yText.svelte-17l1npl.svelte-17l1npl{z-index:9999;border:0px;clip:rect(1px, 1px, 1px, 1px);height:1px;width:1px;position:absolute;overflow:hidden;padding:0px;white-space:nowrap}@keyframes svelte-17l1npl-rotate{100%{transform:rotate(360deg)}}",
      map: null
    };
    Select = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let filteredItems;
      let showSelectedItem;
      let showClearIcon;
      let placeholderText;
      let showMultiSelect;
      let listProps;
      let ariaSelection;
      let ariaContext;
      const dispatch = createEventDispatcher();
      let { id = null } = $$props;
      let { container = void 0 } = $$props;
      let { input = void 0 } = $$props;
      let { isMulti = false } = $$props;
      let { multiFullItemClearable = false } = $$props;
      let { isDisabled = false } = $$props;
      let { isCreatable = false } = $$props;
      let { isFocused = false } = $$props;
      let { value = null } = $$props;
      let { filterText = "" } = $$props;
      let { placeholder = "Select..." } = $$props;
      let { placeholderAlwaysShow = false } = $$props;
      let { items = null } = $$props;
      let { itemFilter = (label, filterText2, option) => `${label}`.toLowerCase().includes(filterText2.toLowerCase()) } = $$props;
      let { groupBy = void 0 } = $$props;
      let { groupFilter = (groups) => groups } = $$props;
      let { isGroupHeaderSelectable = false } = $$props;
      let { getGroupHeaderLabel = (option) => {
        return option[labelIdentifier] || option.id;
      } } = $$props;
      let { labelIdentifier = "label" } = $$props;
      let { getOptionLabel = (option, filterText2) => {
        return option.isCreator ? `Create "${filterText2}"` : option[labelIdentifier];
      } } = $$props;
      let { optionIdentifier = "value" } = $$props;
      let { loadOptions = void 0 } = $$props;
      let { hasError = false } = $$props;
      let { containerStyles = "" } = $$props;
      let { getSelectionLabel = (option) => {
        if (option)
          return option[labelIdentifier];
        else
          return null;
      } } = $$props;
      let { createGroupHeaderItem = (groupValue) => {
        return { value: groupValue, label: groupValue };
      } } = $$props;
      let { createItem = (filterText2) => {
        return { value: filterText2, label: filterText2 };
      } } = $$props;
      const getFilteredItems = () => {
        return filteredItems;
      };
      let { isSearchable = true } = $$props;
      let { inputStyles = "" } = $$props;
      let { isClearable = true } = $$props;
      let { isWaiting = false } = $$props;
      let { listPlacement = "auto" } = $$props;
      let { listOpen = false } = $$props;
      let { isVirtualList = false } = $$props;
      let { loadOptionsInterval = 300 } = $$props;
      let { noOptionsMessage = "No options" } = $$props;
      let { hideEmptyState = false } = $$props;
      let { inputAttributes = {} } = $$props;
      let { listAutoWidth = true } = $$props;
      let { itemHeight = 40 } = $$props;
      let { Icon = void 0 } = $$props;
      let { iconProps = {} } = $$props;
      let { showChevron = false } = $$props;
      let { showIndicator = false } = $$props;
      let { containerClasses = "" } = $$props;
      let { indicatorSvg = void 0 } = $$props;
      let { listOffset = 5 } = $$props;
      let { ClearIcon: ClearIcon$1 = ClearIcon } = $$props;
      let { Item: Item$1 = Item } = $$props;
      let { List: List$1 = List } = $$props;
      let { Selection: Selection$1 = Selection } = $$props;
      let { MultiSelection: MultiSelection$1 = MultiSelection } = $$props;
      let { VirtualList: VirtualList$1 = VirtualList } = $$props;
      function filterMethod(args) {
        if (args.loadOptions && args.filterText.length > 0)
          return;
        if (!args.items)
          return [];
        if (args.items && args.items.length > 0 && typeof args.items[0] !== "object") {
          args.items = convertStringItemsToObjects(args.items);
        }
        let filterResults = args.items.filter((item) => {
          let matchesFilter = itemFilter(getOptionLabel(item, args.filterText), args.filterText, item);
          if (matchesFilter && args.isMulti && args.value && Array.isArray(args.value)) {
            matchesFilter = !args.value.some((x) => {
              return x[args.optionIdentifier] === item[args.optionIdentifier];
            });
          }
          return matchesFilter;
        });
        if (args.groupBy) {
          filterResults = filterGroupedItems(filterResults);
        }
        if (args.isCreatable) {
          filterResults = addCreatableItem(filterResults, args.filterText);
        }
        return filterResults;
      }
      function addCreatableItem(_items, _filterText) {
        if (_filterText.length === 0)
          return _items;
        const itemToCreate = createItem(_filterText);
        if (_items[0] && _filterText === _items[0][labelIdentifier])
          return _items;
        itemToCreate.isCreator = true;
        return [..._items, itemToCreate];
      }
      let { selectedValue = null } = $$props;
      let activeValue;
      let prev_value;
      let prev_filterText;
      let prev_isFocused;
      let hoverItemIndex;
      const getItems = debounce(async () => {
        isWaiting = true;
        let res = await loadOptions(filterText).catch((err) => {
          console.warn("svelte-select loadOptions error :>> ", err);
          dispatch("error", { type: "loadOptions", details: err });
        });
        if (res && !res.cancelled) {
          if (res) {
            if (res && res.length > 0 && typeof res[0] !== "object") {
              res = convertStringItemsToObjects(res);
            }
            filteredItems = [...res];
            dispatch("loaded", { items: filteredItems });
          } else {
            filteredItems = [];
          }
          if (isCreatable) {
            filteredItems = addCreatableItem(filteredItems, filterText);
          }
          isWaiting = false;
          isFocused = true;
          listOpen = true;
        }
      }, loadOptionsInterval);
      function setValue() {
        if (typeof value === "string") {
          value = { [optionIdentifier]: value, label: value };
        } else if (isMulti && Array.isArray(value) && value.length > 0) {
          value = value.map((item) => typeof item === "string" ? { value: item, label: item } : item);
        }
      }
      let _inputAttributes;
      function assignInputAttributes() {
        _inputAttributes = Object.assign({
          autocapitalize: "none",
          autocomplete: "off",
          autocorrect: "off",
          spellcheck: false,
          tabindex: 0,
          type: "text",
          "aria-autocomplete": "list"
        }, inputAttributes);
        if (id) {
          _inputAttributes.id = id;
        }
        if (!isSearchable) {
          _inputAttributes.readonly = true;
        }
      }
      function filterGroupedItems(_items) {
        const groupValues = [];
        const groups = {};
        _items.forEach((item) => {
          const groupValue = groupBy(item);
          if (!groupValues.includes(groupValue)) {
            groupValues.push(groupValue);
            groups[groupValue] = [];
            if (groupValue) {
              groups[groupValue].push(Object.assign(createGroupHeaderItem(groupValue, item), {
                id: groupValue,
                isGroupHeader: true,
                isSelectable: isGroupHeaderSelectable
              }));
            }
          }
          groups[groupValue].push(Object.assign({ isGroupItem: !!groupValue }, item));
        });
        const sortedGroupedItems = [];
        groupFilter(groupValues).forEach((groupValue) => {
          sortedGroupedItems.push(...groups[groupValue]);
        });
        return sortedGroupedItems;
      }
      function dispatchSelectedItem() {
        if (isMulti) {
          if (JSON.stringify(value) !== JSON.stringify(prev_value)) {
            if (checkValueForDuplicates()) {
              dispatch("select", value);
            }
          }
          return;
        }
        {
          dispatch("select", value);
        }
      }
      function setupFocus() {
        if (isFocused || listOpen) {
          handleFocus();
        } else {
          if (input)
            input.blur();
        }
      }
      function setupMulti() {
        if (value) {
          if (Array.isArray(value)) {
            value = [...value];
          } else {
            value = [value];
          }
        }
      }
      function setupFilterText() {
        if (filterText.length === 0)
          return;
        isFocused = true;
        listOpen = true;
        if (loadOptions) {
          getItems();
        } else {
          listOpen = true;
          if (isMulti) {
            activeValue = void 0;
          }
        }
      }
      function checkValueForDuplicates() {
        let noDuplicates = true;
        if (value) {
          const ids = [];
          const uniqueValues = [];
          value.forEach((val) => {
            if (!ids.includes(val[optionIdentifier])) {
              ids.push(val[optionIdentifier]);
              uniqueValues.push(val);
            } else {
              noDuplicates = false;
            }
          });
          if (!noDuplicates)
            value = uniqueValues;
        }
        return noDuplicates;
      }
      function findItem(selection) {
        let matchTo = selection ? selection[optionIdentifier] : value[optionIdentifier];
        return items.find((item) => item[optionIdentifier] === matchTo);
      }
      function updateValueDisplay(items2) {
        if (!items2 || items2.length === 0 || items2.some((item) => typeof item !== "object"))
          return;
        if (!value || (isMulti ? value.some((selection) => !selection || !selection[optionIdentifier]) : !value[optionIdentifier]))
          return;
        if (Array.isArray(value)) {
          value = value.map((selection) => findItem(selection) || selection);
        } else {
          value = findItem() || value;
        }
      }
      function handleFocus() {
        isFocused = true;
        if (input)
          input.focus();
      }
      function handleClear() {
        value = void 0;
        listOpen = false;
        dispatch("clear", value);
        handleFocus();
      }
      let { ariaValues = (values) => {
        return `Option ${values}, selected.`;
      } } = $$props;
      let { ariaListOpen = (label, count) => {
        return `You are currently focused on option ${label}. There are ${count} results available.`;
      } } = $$props;
      let { ariaFocused = () => {
        return `Select is focused, type to refine list, press down to open the menu.`;
      } } = $$props;
      function handleAriaSelection() {
        let selected = void 0;
        if (isMulti && value.length > 0) {
          selected = value.map((v) => getSelectionLabel(v)).join(", ");
        } else {
          selected = getSelectionLabel(value);
        }
        return ariaValues(selected);
      }
      function handleAriaContent() {
        if (!isFocused || !filteredItems || filteredItems.length === 0)
          return "";
        let _item = filteredItems[hoverItemIndex];
        if (listOpen && _item) {
          let label = getSelectionLabel(_item);
          let count = filteredItems ? filteredItems.length : 0;
          return ariaListOpen(label, count);
        } else {
          return ariaFocused();
        }
      }
      if ($$props.id === void 0 && $$bindings.id && id !== void 0)
        $$bindings.id(id);
      if ($$props.container === void 0 && $$bindings.container && container !== void 0)
        $$bindings.container(container);
      if ($$props.input === void 0 && $$bindings.input && input !== void 0)
        $$bindings.input(input);
      if ($$props.isMulti === void 0 && $$bindings.isMulti && isMulti !== void 0)
        $$bindings.isMulti(isMulti);
      if ($$props.multiFullItemClearable === void 0 && $$bindings.multiFullItemClearable && multiFullItemClearable !== void 0)
        $$bindings.multiFullItemClearable(multiFullItemClearable);
      if ($$props.isDisabled === void 0 && $$bindings.isDisabled && isDisabled !== void 0)
        $$bindings.isDisabled(isDisabled);
      if ($$props.isCreatable === void 0 && $$bindings.isCreatable && isCreatable !== void 0)
        $$bindings.isCreatable(isCreatable);
      if ($$props.isFocused === void 0 && $$bindings.isFocused && isFocused !== void 0)
        $$bindings.isFocused(isFocused);
      if ($$props.value === void 0 && $$bindings.value && value !== void 0)
        $$bindings.value(value);
      if ($$props.filterText === void 0 && $$bindings.filterText && filterText !== void 0)
        $$bindings.filterText(filterText);
      if ($$props.placeholder === void 0 && $$bindings.placeholder && placeholder !== void 0)
        $$bindings.placeholder(placeholder);
      if ($$props.placeholderAlwaysShow === void 0 && $$bindings.placeholderAlwaysShow && placeholderAlwaysShow !== void 0)
        $$bindings.placeholderAlwaysShow(placeholderAlwaysShow);
      if ($$props.items === void 0 && $$bindings.items && items !== void 0)
        $$bindings.items(items);
      if ($$props.itemFilter === void 0 && $$bindings.itemFilter && itemFilter !== void 0)
        $$bindings.itemFilter(itemFilter);
      if ($$props.groupBy === void 0 && $$bindings.groupBy && groupBy !== void 0)
        $$bindings.groupBy(groupBy);
      if ($$props.groupFilter === void 0 && $$bindings.groupFilter && groupFilter !== void 0)
        $$bindings.groupFilter(groupFilter);
      if ($$props.isGroupHeaderSelectable === void 0 && $$bindings.isGroupHeaderSelectable && isGroupHeaderSelectable !== void 0)
        $$bindings.isGroupHeaderSelectable(isGroupHeaderSelectable);
      if ($$props.getGroupHeaderLabel === void 0 && $$bindings.getGroupHeaderLabel && getGroupHeaderLabel !== void 0)
        $$bindings.getGroupHeaderLabel(getGroupHeaderLabel);
      if ($$props.labelIdentifier === void 0 && $$bindings.labelIdentifier && labelIdentifier !== void 0)
        $$bindings.labelIdentifier(labelIdentifier);
      if ($$props.getOptionLabel === void 0 && $$bindings.getOptionLabel && getOptionLabel !== void 0)
        $$bindings.getOptionLabel(getOptionLabel);
      if ($$props.optionIdentifier === void 0 && $$bindings.optionIdentifier && optionIdentifier !== void 0)
        $$bindings.optionIdentifier(optionIdentifier);
      if ($$props.loadOptions === void 0 && $$bindings.loadOptions && loadOptions !== void 0)
        $$bindings.loadOptions(loadOptions);
      if ($$props.hasError === void 0 && $$bindings.hasError && hasError !== void 0)
        $$bindings.hasError(hasError);
      if ($$props.containerStyles === void 0 && $$bindings.containerStyles && containerStyles !== void 0)
        $$bindings.containerStyles(containerStyles);
      if ($$props.getSelectionLabel === void 0 && $$bindings.getSelectionLabel && getSelectionLabel !== void 0)
        $$bindings.getSelectionLabel(getSelectionLabel);
      if ($$props.createGroupHeaderItem === void 0 && $$bindings.createGroupHeaderItem && createGroupHeaderItem !== void 0)
        $$bindings.createGroupHeaderItem(createGroupHeaderItem);
      if ($$props.createItem === void 0 && $$bindings.createItem && createItem !== void 0)
        $$bindings.createItem(createItem);
      if ($$props.getFilteredItems === void 0 && $$bindings.getFilteredItems && getFilteredItems !== void 0)
        $$bindings.getFilteredItems(getFilteredItems);
      if ($$props.isSearchable === void 0 && $$bindings.isSearchable && isSearchable !== void 0)
        $$bindings.isSearchable(isSearchable);
      if ($$props.inputStyles === void 0 && $$bindings.inputStyles && inputStyles !== void 0)
        $$bindings.inputStyles(inputStyles);
      if ($$props.isClearable === void 0 && $$bindings.isClearable && isClearable !== void 0)
        $$bindings.isClearable(isClearable);
      if ($$props.isWaiting === void 0 && $$bindings.isWaiting && isWaiting !== void 0)
        $$bindings.isWaiting(isWaiting);
      if ($$props.listPlacement === void 0 && $$bindings.listPlacement && listPlacement !== void 0)
        $$bindings.listPlacement(listPlacement);
      if ($$props.listOpen === void 0 && $$bindings.listOpen && listOpen !== void 0)
        $$bindings.listOpen(listOpen);
      if ($$props.isVirtualList === void 0 && $$bindings.isVirtualList && isVirtualList !== void 0)
        $$bindings.isVirtualList(isVirtualList);
      if ($$props.loadOptionsInterval === void 0 && $$bindings.loadOptionsInterval && loadOptionsInterval !== void 0)
        $$bindings.loadOptionsInterval(loadOptionsInterval);
      if ($$props.noOptionsMessage === void 0 && $$bindings.noOptionsMessage && noOptionsMessage !== void 0)
        $$bindings.noOptionsMessage(noOptionsMessage);
      if ($$props.hideEmptyState === void 0 && $$bindings.hideEmptyState && hideEmptyState !== void 0)
        $$bindings.hideEmptyState(hideEmptyState);
      if ($$props.inputAttributes === void 0 && $$bindings.inputAttributes && inputAttributes !== void 0)
        $$bindings.inputAttributes(inputAttributes);
      if ($$props.listAutoWidth === void 0 && $$bindings.listAutoWidth && listAutoWidth !== void 0)
        $$bindings.listAutoWidth(listAutoWidth);
      if ($$props.itemHeight === void 0 && $$bindings.itemHeight && itemHeight !== void 0)
        $$bindings.itemHeight(itemHeight);
      if ($$props.Icon === void 0 && $$bindings.Icon && Icon !== void 0)
        $$bindings.Icon(Icon);
      if ($$props.iconProps === void 0 && $$bindings.iconProps && iconProps !== void 0)
        $$bindings.iconProps(iconProps);
      if ($$props.showChevron === void 0 && $$bindings.showChevron && showChevron !== void 0)
        $$bindings.showChevron(showChevron);
      if ($$props.showIndicator === void 0 && $$bindings.showIndicator && showIndicator !== void 0)
        $$bindings.showIndicator(showIndicator);
      if ($$props.containerClasses === void 0 && $$bindings.containerClasses && containerClasses !== void 0)
        $$bindings.containerClasses(containerClasses);
      if ($$props.indicatorSvg === void 0 && $$bindings.indicatorSvg && indicatorSvg !== void 0)
        $$bindings.indicatorSvg(indicatorSvg);
      if ($$props.listOffset === void 0 && $$bindings.listOffset && listOffset !== void 0)
        $$bindings.listOffset(listOffset);
      if ($$props.ClearIcon === void 0 && $$bindings.ClearIcon && ClearIcon$1 !== void 0)
        $$bindings.ClearIcon(ClearIcon$1);
      if ($$props.Item === void 0 && $$bindings.Item && Item$1 !== void 0)
        $$bindings.Item(Item$1);
      if ($$props.List === void 0 && $$bindings.List && List$1 !== void 0)
        $$bindings.List(List$1);
      if ($$props.Selection === void 0 && $$bindings.Selection && Selection$1 !== void 0)
        $$bindings.Selection(Selection$1);
      if ($$props.MultiSelection === void 0 && $$bindings.MultiSelection && MultiSelection$1 !== void 0)
        $$bindings.MultiSelection(MultiSelection$1);
      if ($$props.VirtualList === void 0 && $$bindings.VirtualList && VirtualList$1 !== void 0)
        $$bindings.VirtualList(VirtualList$1);
      if ($$props.selectedValue === void 0 && $$bindings.selectedValue && selectedValue !== void 0)
        $$bindings.selectedValue(selectedValue);
      if ($$props.handleClear === void 0 && $$bindings.handleClear && handleClear !== void 0)
        $$bindings.handleClear(handleClear);
      if ($$props.ariaValues === void 0 && $$bindings.ariaValues && ariaValues !== void 0)
        $$bindings.ariaValues(ariaValues);
      if ($$props.ariaListOpen === void 0 && $$bindings.ariaListOpen && ariaListOpen !== void 0)
        $$bindings.ariaListOpen(ariaListOpen);
      if ($$props.ariaFocused === void 0 && $$bindings.ariaFocused && ariaFocused !== void 0)
        $$bindings.ariaFocused(ariaFocused);
      $$result.css.add(css$1);
      let $$settled;
      let $$rendered;
      do {
        $$settled = true;
        filteredItems = filterMethod({
          loadOptions,
          filterText,
          items,
          value,
          isMulti,
          optionIdentifier,
          groupBy,
          isCreatable
        });
        {
          {
            if (selectedValue)
              console.warn("selectedValue is no longer used. Please use value instead.");
          }
        }
        {
          updateValueDisplay(items);
        }
        {
          {
            if (value)
              setValue();
          }
        }
        {
          {
            if (inputAttributes || !isSearchable)
              assignInputAttributes();
          }
        }
        {
          {
            if (isMulti) {
              setupMulti();
            }
          }
        }
        {
          {
            if (isMulti && value && value.length > 1) {
              checkValueForDuplicates();
            }
          }
        }
        {
          {
            if (value)
              dispatchSelectedItem();
          }
        }
        {
          {
            if (!value && isMulti && prev_value) {
              dispatch("select", value);
            }
          }
        }
        {
          {
            if (isFocused !== prev_isFocused) {
              setupFocus();
            }
          }
        }
        {
          {
            if (filterText !== prev_filterText) {
              setupFilterText();
            }
          }
        }
        showSelectedItem = value && filterText.length === 0;
        showClearIcon = showSelectedItem && isClearable && !isDisabled && !isWaiting;
        placeholderText = placeholderAlwaysShow && isMulti ? placeholder : value ? "" : placeholder;
        showMultiSelect = isMulti && value && value.length > 0;
        listProps = {
          Item: Item$1,
          filterText,
          optionIdentifier,
          noOptionsMessage,
          hideEmptyState,
          isVirtualList,
          VirtualList: VirtualList$1,
          value,
          isMulti,
          getGroupHeaderLabel,
          items: filteredItems,
          itemHeight,
          getOptionLabel,
          listPlacement,
          parent: container,
          listAutoWidth,
          listOffset
        };
        ariaSelection = value ? handleAriaSelection() : "";
        ariaContext = handleAriaContent();
        $$rendered = `

<div class="${[
          "selectContainer " + escape(containerClasses) + " svelte-17l1npl",
          (hasError ? "hasError" : "") + " " + (isMulti ? "multiSelect" : "") + " " + (isDisabled ? "disabled" : "") + " " + (isFocused ? "focused" : "")
        ].join(" ").trim()}"${add_attribute("style", containerStyles, 0)}${add_attribute("this", container, 0)}><span aria-live="${"polite"}" aria-atomic="${"false"}" aria-relevant="${"additions text"}" class="${"a11yText svelte-17l1npl"}">${isFocused ? `<span id="${"aria-selection"}">${escape(ariaSelection)}</span>
            <span id="${"aria-context"}">${escape(ariaContext)}</span>` : ``}</span>

    ${Icon ? `${validate_component(Icon || missing_component, "svelte:component").$$render($$result, Object_1.assign(iconProps), {}, {})}` : ``}

    ${showMultiSelect ? `${validate_component(MultiSelection$1 || missing_component, "svelte:component").$$render($$result, {
          value,
          getSelectionLabel,
          activeValue,
          isDisabled,
          multiFullItemClearable
        }, {}, {})}` : ``}

    <input${spread([
          { readonly: !isSearchable || null },
          escape_object(_inputAttributes),
          {
            placeholder: escape_attribute_value(placeholderText)
          },
          {
            style: escape_attribute_value(inputStyles)
          },
          { disabled: isDisabled || null }
        ], "svelte-17l1npl")}${add_attribute("this", input, 0)}${add_attribute("value", filterText, 0)}>

    ${!isMulti && showSelectedItem ? `<div class="${"selectedItem svelte-17l1npl"}">${validate_component(Selection$1 || missing_component, "svelte:component").$$render($$result, { item: value, getSelectionLabel }, {}, {})}</div>` : ``}

    ${showClearIcon ? `<div class="${"clearSelect svelte-17l1npl"}" aria-hidden="${"true"}">${validate_component(ClearIcon$1 || missing_component, "svelte:component").$$render($$result, {}, {}, {})}</div>` : ``}

    ${!showClearIcon && (showIndicator || showChevron && !value || !isSearchable && !isDisabled && !isWaiting && (showSelectedItem && !isClearable || !showSelectedItem)) ? `<div class="${"indicator svelte-17l1npl"}" aria-hidden="${"true"}">${indicatorSvg ? `<!-- HTML_TAG_START -->${indicatorSvg}<!-- HTML_TAG_END -->` : `<svg width="${"100%"}" height="${"100%"}" viewBox="${"0 0 20 20"}" focusable="${"false"}" aria-hidden="${"true"}" class="${"svelte-17l1npl"}"><path d="${"M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747\n          3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0\n          1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502\n          0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0\n          0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"}"></path></svg>`}</div>` : ``}

    ${isWaiting ? `<div class="${"spinner svelte-17l1npl"}"><svg class="${"spinner_icon svelte-17l1npl"}" viewBox="${"25 25 50 50"}"><circle class="${"spinner_path svelte-17l1npl"}" cx="${"50"}" cy="${"50"}" r="${"20"}" fill="${"none"}" stroke="${"currentColor"}" stroke-width="${"5"}" stroke-miterlimit="${"10"}"></circle></svg></div>` : ``}

    ${listOpen ? `${validate_component(List$1 || missing_component, "svelte:component").$$render($$result, Object_1.assign(listProps, { hoverItemIndex }), {
          hoverItemIndex: ($$value) => {
            hoverItemIndex = $$value;
            $$settled = false;
          }
        }, {})}` : ``}

    ${!isMulti || isMulti && !showMultiSelect ? `<input${add_attribute("name", inputAttributes.name, 0)} type="${"hidden"}"${add_attribute("value", value ? getSelectionLabel(value) : null, 0)} class="${"svelte-17l1npl"}">` : ``}

    ${isMulti && showMultiSelect ? `${each(value, (item) => `<input${add_attribute("name", inputAttributes.name, 0)} type="${"hidden"}"${add_attribute("value", item ? getSelectionLabel(item) : null, 0)} class="${"svelte-17l1npl"}">`)}` : ``}</div>`;
      } while (!$$settled);
      return $$rendered;
    });
    css3 = {
      code: ".themed.svelte-1udelwi{--border:1px solid gray;--borderRadius:0.25rem;--background:rgba(55, 65, 81, var(--tw-text-opacity));--borderFocusColor:rgba(165, 180, 252, var(--tw-text-opacity));--borderHoverColor:rgba(165, 180, 252, var(--tw-text-opacity));--itemHoverBG:rgba(17, 24, 39, var(--tw-text-opacity));--multiItemBG:rgba(17, 24, 39, var(--tw-text-opacity));--multiItemActiveBG:rgba(55, 65, 81, var(--tw-text-opacity));--inputColor:rgba(6, 78, 59, var(--tw-bg-opacity));--listBackground:rgba(55, 65, 81, var(--tw-text-opacity))}table.svelte-1udelwi,td.svelte-1udelwi,th.svelte-1udelwi{border:1px solid rgba(55, 65, 81, var(--tw-text-opacity))}td.svelte-1udelwi,th.svelte-1udelwi{padding:0.5rem}",
      map: null
    };
    Recipe = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      const complexItems = dishes.map((dish) => dish.name);
      let selected = [];
      let meatList = dishes.filter((dish) => dish.type === "\u8364\u83DC");
      let vegList = dishes.filter((dish) => dish.type === "\u7D20\u83DC");
      let veg = vegList.sort(() => Math.random() - Math.random()).slice(0, 2);
      let meat = meatList.sort(() => Math.random() - Math.random()).slice(0, 2);
      let menu = meat.concat(veg);
      function change() {
        veg = vegList.sort(() => Math.random() - Math.random()).slice(0, 2);
        meat = meatList.sort(() => Math.random() - Math.random()).slice(0, 2);
        menu = meat.concat(veg);
      }
      const rts = [
        {
          href: "https://www.startaster.com.cn/phone.php/restaurant/RE000564/zh-cn?",
          title: "\u86D9\u529F\u592B"
        },
        {
          href: "https://www.startaster.com.cn/phone.php/restaurant/RE000524/zh-cn?",
          title: "\u53F2\u5BC6\u65AF\u6E58\u83DC\u9986"
        },
        {
          href: "https://www.startaster.com.cn/phone.php/restaurant/RE000042/zh-cn?",
          title: "\u8001\u6210\u90FD"
        },
        {
          href: "https://www.cqgf.com.sg/cn/",
          title: "\u91CD\u5E86\u70E4\u9C7C"
        },
        {
          href: "https://www.startaster.com.cn/restaurant/RE000020/zh-cn",
          title: "\u87F9\u8001\u5B8B"
        }
      ];
      const yts = [
        {
          href: "https://www.youtube.com/channel/UCg0m_Ah8P_MQbnn77-vYnYw",
          title: "\u7F8E\u98DF\u4F5C\u5BB6"
        },
        {
          href: "https://www.youtube.com/channel/UCBJmYv3Vf_tKcQr5_qmayXg",
          title: "\u8001\u996D\u9AA8"
        },
        {
          href: "https://www.youtube.com/channel/UCu7NhIfuD79werXU8I52oaQ",
          title: "\u5C71\u836F\u89C6\u9891"
        },
        {
          href: "https://www.youtube.com/channel/UCmCuW1RdJA471zImbT2MdBQ",
          title: "\u94C1\u9505\u89C6\u9891"
        }
      ];
      if ($$props.change === void 0 && $$bindings.change && change !== void 0)
        $$bindings.change(change);
      $$result.css.add(css3);
      return `${$$result.head += `${$$result.title = `<title>Recipe</title>`, ""}`, ""}

  <h2>\u4ECA\u5929\u5403\u4EC0\u4E48\uFF1F</h2>
  <hr>
  <img src="${"/images/crab.jpeg"}" width="${""}" alt="${"crab"}" loading="${"lazy"}" class="${"max-w-full rounded h-auto object-fill"}">
<p>\u4E0A\u9762 \u{1F446} \u8FD9\u4E2A\u95EE\u9898\u7ED9\u6211\u5E26\u6765\u4E86\u4E0D\u5C11\u56F0\u6270\u3002\u4E3A\u6B64\uFF0C\u6211\u7279\u5730\u5199\u4E86\u4E0B\u9762 \u{1F447} \u8FD9\u4E2A\u5C0F\u7A0B\u5E8F\u3002\u6709\u4E86\u8FD9\u4E2A\u7A0B\u5E8F\uFF0C\u4E0D\u5FC5\u52A8\u8111\u7B4B\u60F3\u83DC\u540D\uFF0C\u53EA\u9700\u70B9\u51FB\u6309\u94AE\u5C31\u53EF\u89E3\u51B3\u4ECA\u5929\u5403\u4EC0\u4E48\u7684\u95EE\u9898\uFF0C\u975E\u5E38\u65B9\u4FBF\u3002</p>
<h3>\u968F\u673A\u83DC\u5355</h3>
<p>\u70B9\u51FB\u4E0B\u9762\u7684\u6309\u94AE\uFF0C\u4F1A\u968F\u673A\u751F\u6210\u4E00\u4E2A\u4E24\u8364\u4E24\u7D20\u7684\u83DC\u5355\uFF0C\u53EF\u65E0\u9650\u6B21\u6570\u66F4\u65B0\u54E6\u3002</p>
<button class="${"px-1.5 py-0.5 mb-2 bg-gray-700 text-yellow-500 rounded "}">\u70B9\u6211\u66F4\u65B0</button>
  
  <table class="${"w-full md:w-1/2 text-center svelte-1udelwi"}"><tr><th class="${"svelte-1udelwi"}">\u7C7B\u522B</th>
    <th class="${"svelte-1udelwi"}">\u83DC\u540D</th>
    <th class="${"svelte-1udelwi"}">\u5473\u9053</th></tr>
    ${each(menu, (item) => `<tr><td class="${"svelte-1udelwi"}">${escape(item.type)}</td>
      <td class="${"svelte-1udelwi"}">${escape(item.name)}</td>
      <td class="${"svelte-1udelwi"}">${escape(item.taste)}</td>
    </tr>`)}</table>

<h3>\u81EA\u9009\u83DC\u5355</h3>
<p>\u5982\u679C\u4E0D\u6EE1\u610F\u968F\u673A\u751F\u6210\u7684\u83DC\u5355\uFF0C\u53EF\u4EE5\u5728\u8FD9\u91CC\u70B9\u9009\u81EA\u5DF1\u559C\u6B22\u5403\u7684\u83DC\u7EC4\u6210\u83DC\u8C31\uFF0C\u83DC\u54C1\u6570\u91CF\u4E0D\u9650\u3002</p>
<div class="${"themed svelte-1udelwi"}"><div class="${"w-full md:w-1/2 mb-4"}">${validate_component(Select, "Select").$$render($$result, {
        items: complexItems,
        isMulti: true,
        placeholder: "\u9009\u83DC"
      }, {}, {})}</div>
${selected ? `<ul>${each(selected, (se) => `<li>${escape(se.label)}</li>`)}</ul>` : ``}</div>

<h3>\u4ED6\u5C71\u4E4B\u98DF</h3>
<p>\u8FD9\u91CC\u662F\u4E00\u4E9B\u6211\u6BD4\u8F83\u559C\u6B22\u7684\u6CB9\u7BA1\u7F8E\u98DF\u9891\u9053\u548C\u5E38\u53BB\u7684\u672C\u5730\u4E2D\u9910\u9986\u3002</p>
<div><h5>\u6CB9\u7BA1</h5>
  <ul class="${"list-none flex flex-wrap"}">${each(yts, (yt) => `<li><a${add_attribute("href", yt.href, 0)} target="${"_blank"}" class="${""}">${escape(yt.title)}</a></li>`)}</ul></div>
  
  <div><h5>\u9910\u9986</h5>
    <ul class="${"flex flex-wrap list-none"}">${each(rts, (rt) => `<li><a${add_attribute("href", rt.href, 0)} target="${"_blank"}" class="${""}">${escape(rt.title)}</a></li>`)}</ul>
  </div>`;
    });
  }
});

// .svelte-kit/output/server/chunks/date-655861b7.js
var formatDate;
var init_date_655861b7 = __esm({
  ".svelte-kit/output/server/chunks/date-655861b7.js"() {
    init_shims();
    formatDate = (value) => {
      const date = new Date(value);
      return new Intl.DateTimeFormat("zh-CN", {
        dateStyle: "medium"
      }).format(date);
    };
  }
});

// .svelte-kit/output/server/chunks/test-2a289c24.js
var test_2a289c24_exports = {};
__export(test_2a289c24_exports, {
  default: () => Test,
  metadata: () => metadata2
});
var Slide, metadata2, Test;
var init_test_2a289c24 = __esm({
  ".svelte-kit/output/server/chunks/test-2a289c24.js"() {
    init_shims();
    init_app_e9883c9f();
    Slide = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `${slots.default ? slots.default({}) : ``}`;
    });
    metadata2 = {
      "title": "Demo RemarkJS Slideshow",
      "date": "2021-06-02"
    };
    Test = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `${validate_component(Slide, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign($$props, metadata2), {}, {
        default: () => `<p>class: center, middle</p>
<h1>Demo Remark Slideshow</h1>
<h2>Jony Ives \u2022 WWDC</h2>`
      })}`;
    });
  }
});

// .svelte-kit/output/server/chunks/index-fb3090d5.js
var index_fb3090d5_exports = {};
__export(index_fb3090d5_exports, {
  default: () => Slides,
  load: () => load2
});
var allTalks, body, load2, Slides;
var init_index_fb3090d5 = __esm({
  ".svelte-kit/output/server/chunks/index-fb3090d5.js"() {
    init_shims();
    init_app_e9883c9f();
    init_date_655861b7();
    allTalks = { "./test.md": () => Promise.resolve().then(() => (init_test_2a289c24(), test_2a289c24_exports)) };
    body = [];
    for (let path in allTalks) {
      body.push(allTalks[path]().then(({ metadata: metadata12 }) => {
        return { path, metadata: metadata12 };
      }));
    }
    load2 = async () => {
      const talks2 = await Promise.all(body);
      return { props: { talks: talks2 } };
    };
    Slides = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { talks: talks2 } = $$props;
      const dateSortedTalks = talks2.slice().sort((a, b) => {
        return Date.parse(b.metadata.date) - Date.parse(a.metadata.date);
      });
      if ($$props.talks === void 0 && $$bindings.talks && talks2 !== void 0)
        $$bindings.talks(talks2);
      return `${$$result.head += `${$$result.title = `<title>Slides</title>`, ""}`, ""}
   
   <h2>\u8C08 \u8BDD</h2>
   <hr>
   
   ${each(dateSortedTalks, ({ path, metadata: { title, date, draft } }) => `${!draft ? `<div class="${"mb-4"}"><span class="${"text-sm border-b border-gray-300 px-2 py-0.5 mb-3 min-w-max"}">${escape(formatDate(date))}</span> <br> <br>
       <a${add_attribute("href", `/slides/${path.replace(".md", "").replace(".svx", "")}`, 0)} class="${"text-md text-yellow-500 hover:text-yellow-300 text-left font-semibold mb-2"}">${escape(title)}</a></div>
       <hr>` : ``}`)}`;
    });
  }
});

// .svelte-kit/output/server/chunks/about-7992f477.js
var about_7992f477_exports = {};
__export(about_7992f477_exports, {
  default: () => About,
  prerender: () => prerender2
});
var prerender2, About;
var init_about_7992f477 = __esm({
  ".svelte-kit/output/server/chunks/about-7992f477.js"() {
    init_shims();
    init_app_e9883c9f();
    prerender2 = true;
    About = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `${$$result.head += `${$$result.title = `<title>About</title>`, ""}`, ""}

<h2>\u5173 \u4E8E</h2>
<hr>

<p><strong>\u55E8\uFF0C\u4F60\u597D\uFF01\u6B22\u8FCE\u6765\u6211\u7684\u5C0F\u7AD9\u505A\u5BA2\u3002 </strong></p>
    <p>\u672C\u4EBA\u5C0F\u51EF\uFF0C\u5916\u53F7\u732A\u521A\u9B23\uFF0C\u662F\u4E00\u540D\u57F9\u8BAD\u5E08\u3002</p>
    <p>\u5728\u751F\u6D3B\u4E2D\uFF0C\u6211\u662F\u4E00\u4E2A\u4E50\u5929\u6D3E\u3002\u6211\u76F8\u4FE1\u529E\u6CD5\u603B\u6BD4\u95EE\u9898\u591A\uFF0C\u76F8\u4FE1\u6CA1\u6709\u4EC0\u4E48\u8FC7\u4E0D\u53BB\u7684\u574E\u513F\uFF0C\u76F8\u4FE1\u4E8B\u60C5\u603B\u4F1A\u5411\u597D\u7684\u65B9\u9762\u8F6C\u5316\u3002\u9047\u5230\u95EE\u9898\u7684\u65F6\u5019\uFF0C\u522B\u4EBA\u6025\u5F97\u8DF3\u811A\uFF0C\u6211\u5374\u80FD\u6DE1\u5B9A\u81EA\u82E5\uFF0C\u8868\u73B0\u5F97\u8DDF\u6CA1\u4E8B\u513F\u4E00\u6837\u3002\u56E0\u4E3A\u8FD9\u6837\u7684\u6027\u683C\uFF0C\u5E38\u5E38\u88AB\u67D0\u4E2A\u4EBA\u9A82\u201C\u6CA1\u5FC3\u6CA1\u80BA\u201D\u3002\u4E0B\u9762\u8FD9\u5F20\u56FE\u753B\u51FA\u4E86\u6211\u8FD9\u79CD\u6027\u683C\u80CC\u540E\u7684\u903B\u8F91\u3002</p>
	
    <img src="${"/images/phil.jpeg"}" alt="${"attitude"}" loading="${"lazy"}" class="${"rounded w-full block h-auto mx-auto my-8"}">

     <p>\u6211\u559C\u6B22\u8BFB\u4E66\u3002\u4E66\u5E97\u662F\u5E38\u53BB\u7684\u5730\u65B9\u3002\u521A\u5F00\u59CB\u5DE5\u4F5C\u90A3\u4F1A\u513F\uFF0C\u6536\u5165\u5FAE\u8584\uFF0C\u751F\u6D3B\u6349\u895F\u89C1\u8098\uFF0C\u4F46\u6BCF\u6708\u4ECD\u4F1A\u62FF\u51FA\u4E00\u90E8\u5206\u6536\u5165\u7528\u6765\u8D2D\u4E70\u4E66\u7C4D\u3002\u5230\u6211\u8F9E\u804C\u7684\u65F6\u5019\uFF0C\u5BB6\u91CC\u7684\u4E66\u623F\u90FD\u5FEB\u5806\u6210\u4E86\u8FF7\u4F60\u56FE\u4E66\u9986\u3002\u6211\u7684\u9605\u8BFB\u8303\u56F4\u5E76\u4E0D\u5E7F\uFF0C\u4EC5\u5C40\u9650\u4E8E\u54F2\u5B66\u3001\u793E\u4F1A\u79D1\u5B66\u548C\u79D1\u666E\uFF0C\u5BF9\u5C0F\u8BF4\u5B8C\u5168\u6CA1\u6709\u5174\u8DA3\u3002\u300A\u7EA2\u697C\u68A6\u300B\u8BFB\u51E0\u884C\u5C31\u60F3\u7761\u89C9\uFF0C\u300A\u81EA\u6740\u8BBA\u300B\u5374\u53EF\u4EE5\u8BFB\u901A\u5BB5\u800C\u4E0D\u77E5\u75B2\u5026\u3002\u5F97\u76CA\u4E8E\u9605\u8BFB\uFF0C\u6211\u80FD\u6E05\u695A\u5730\u7406\u89E3\u62BD\u8C61\u7684\u54F2\u5B66\u6982\u5FF5\uFF0C\u4E5F\u80FD\u5904\u7406\u68D8\u624B\u7684\u7EC4\u7EC7\u7BA1\u7406\u95EE\u9898\uFF0C\u8FD8\u80FD\u6B23\u8D4F\u8BD7\u8BCD\u6B4C\u8D4B\u4E2D\u8574\u6DB5\u7684\u610F\u5883\u3002\u6211\u662F\u8BFB\u8005\uFF0C\u4E5F\u662F\u4F5C\u8005\uFF0C\u6709\u82E5\u5E72\u4E13\u4E1A\u6587\u7AE0\u53D1\u8868\u3002\u6211\u7684\u4F5C\u54C1\u770B\u7684\u4EBA\u4E0D\u591A\uFF0C\u4F46\u770B\u4E86\u7684\u90FD\u8BF4\u597D\u3002</p>

    <p>\u9664\u4E86\u8BFB\u4E66\u5B66\u4E60\uFF0C\u6211\u8FD8\u559C\u6B22\u8FDC\u8DB3\uFF0C\u559C\u6B22\u9A91\u811A\u8E0F\u8F66\uFF0C\u559C\u6B22\u542C\u53E4\u5178\u97F3\u4E50\uFF0C\u559C\u6B22\u54C1\u8336\uFF0C\u559C\u6B22\u505A\u7F8E\u98DF......\u3002\u6211\u6700\u5927\u7684\u55DC\u597D\u662F\u4E0B\u56F4\u68CB\uFF0C\u4ECE\u5927\u5B66\u4E00\u5E74\u7EA7\u5F00\u59CB\u4E00\u76F4\u4E0B\u5230\u73B0\u5728\uFF0C\u4ECE\u672A\u95F4\u65AD\u3002\u4F5C\u4E3A\u7B56\u7565\u6E38\u620F\uFF0C\u56F4\u68CB\u8BA9\u6211\u9886\u609F\u4E86\u4E0D\u5C11\u535A\u5F08\u4E4B\u9053\uFF0C\u8BA9\u6211\u5728\u751F\u6D3B\u7684\u535A\u5F08\u4E2D\u6E38\u5203\u6709\u4F59\u3002</p>

    <p>\u6700\u8FD1, \u56E0\u65B0\u51A0\u75AB\u60C5\u5728\u5BB6\u529E\u516C\u3002\u8D81\u8FD9\u6BB5\u65F6\u95F4\uFF0C\u6211\u5F00\u59CB\u4E86\u4E00\u6BB5\u524D\u7AEF\u5F00\u53D1\u7684\u5B66\u4E60\u4E4B\u65C5\u3002\u4F60\u73B0\u5728\u6B63\u5728\u6D4F\u89C8\u7684\u8FD9\u4E2A\u7F51\u7AD9\u5C31\u662F\u8FD9\u6B21\u5B66\u4E60\u7684\u4E00\u4E2A\u521D\u6B65\u6210\u679C\uFF0C\u5B83\u662F\u57FA\u4E8E <a href="${"https://kit.svelte.dev/"}" target="${"_blank"}" rel="${"noreferrer"}">Sveltekit</a> \u548C <a href="${"https://tailwindcss.com"}" target="${"_blank"}" rel="${"noreferrer"}">Tailwindcss</a> \u6280\u672F\u6784\u5EFA\u7684\u3002\u600E\u4E48\u6837\uFF1F\u770B\u4E0A\u53BB\u8FD8\u4E0D\u9519\u5427\uFF1F<span role="${"img"}" aria-label="${"Smile"}">\u{1F60A}</span></p>`;
    });
  }
});

// .svelte-kit/output/server/chunks/index-ba6627bf.js
var index_ba6627bf_exports = {};
__export(index_ba6627bf_exports, {
  default: () => Notes,
  load: () => load3
});
async function load3({ fetch: fetch2 }) {
  const res = await fetch2(`/notes.json`);
  if (res.ok) {
    const { notes: notes2 } = await res.json();
    return { props: { notes: notes2 } };
  }
}
var Notes;
var init_index_ba6627bf = __esm({
  ".svelte-kit/output/server/chunks/index-ba6627bf.js"() {
    init_shims();
    init_app_e9883c9f();
    Notes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { notes: notes2 } = $$props;
      if ($$props.notes === void 0 && $$bindings.notes && notes2 !== void 0)
        $$bindings.notes(notes2);
      return `${$$result.head += `${$$result.title = `<title>Blog</title>`, ""}`, ""}
  
  <div class="${"flex flex-col flex-grow"}"><h2>\u8BFB\u4E66\u7B14\u8BB0</h2>
    <hr>
    ${each(notes2, (note) => `${!note.draft ? `<li><a sveltekit:prefetch${add_attribute("href", `/notes/${note.slug}`, 0)}>${escape(note.title)}</a> </li>` : ``}`)}</div>`;
    });
  }
});

// .svelte-kit/output/server/chunks/Calendar-b6d818aa.js
var Calendar;
var init_Calendar_b6d818aa = __esm({
  ".svelte-kit/output/server/chunks/Calendar-b6d818aa.js"() {
    init_shims();
    init_app_e9883c9f();
    Calendar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { size = "1em" } = $$props;
      let { width = size } = $$props;
      let { height = size } = $$props;
      let { color = "currentColor" } = $$props;
      let { viewBox = "0 0 24 24" } = $$props;
      if ($$props.size === void 0 && $$bindings.size && size !== void 0)
        $$bindings.size(size);
      if ($$props.width === void 0 && $$bindings.width && width !== void 0)
        $$bindings.width(width);
      if ($$props.height === void 0 && $$bindings.height && height !== void 0)
        $$bindings.height(height);
      if ($$props.color === void 0 && $$bindings.color && color !== void 0)
        $$bindings.color(color);
      if ($$props.viewBox === void 0 && $$bindings.viewBox && viewBox !== void 0)
        $$bindings.viewBox(viewBox);
      return `<svg${add_attribute("width", width, 0)}${add_attribute("height", height, 0)}${add_attribute("viewBox", viewBox, 0)}><path d="${"M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z"}"${add_attribute("fill", color, 0)}></path></svg>`;
    });
  }
});

// .svelte-kit/output/server/chunks/_slug_-9fb92b07.js
var slug_9fb92b07_exports = {};
__export(slug_9fb92b07_exports, {
  default: () => U5Bslugu5D,
  load: () => load4
});
async function load4({ fetch: fetch2, page: { params } }) {
  const { slug } = params;
  const res = await fetch2(`/notes/${slug}.json`);
  if (res.ok) {
    const { note } = await res.json();
    return { props: { note } };
  }
}
var U5Bslugu5D;
var init_slug_9fb92b07 = __esm({
  ".svelte-kit/output/server/chunks/_slug_-9fb92b07.js"() {
    init_shims();
    init_app_e9883c9f();
    init_date_655861b7();
    init_Calendar_b6d818aa();
    U5Bslugu5D = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { note } = $$props;
      let { size = "1em" } = $$props;
      let { html, date, title, book, publisher, year, authors, category } = note;
      let dateDisplay = formatDate(date);
      if ($$props.note === void 0 && $$bindings.note && note !== void 0)
        $$bindings.note(note);
      if ($$props.size === void 0 && $$bindings.size && size !== void 0)
        $$bindings.size(size);
      return `<article class="${"flex flex-col flex-grow"}"><h2>${escape(title)}</h2>
    <div class="${""}"><div class="${"flex flax-wrap pl-4 justify-start items-center space-x-1"}">${validate_component(Calendar, "Calendar").$$render($$result, { size }, {}, {})} <span>${escape(dateDisplay)}</span></div>
      <hr>
      <ul><li>\u4E66\u540D\uFF1A${escape(book)}</li>
          <li><div class="${"flex flex-wrap space-x-2 md:space-y-0 space-y-2"}">\u4F5C\u8005\uFF1A${each(authors, (author) => `<span class="${"rounded max-w-max px-2.5 py-0.5 bg-gray-700"}">${escape(author)}</span>`)}</div></li>
          <li>\u51FA\u7248\u793E\uFF1A${escape(publisher)}</li>
          <li>\u51FA\u7248\u65F6\u95F4\uFF1A${escape(year)} \u5E74</li>
          <li>\u5206\u7C7B\uFF1A${escape(category)}</li></ul>
      <hr>
      <article><!-- HTML_TAG_START -->${html}<!-- HTML_TAG_END --></article>
      <hr>
      <footer><a href="${"/notes/"}" class="${"bg-gray-700 text-yellow-500 hover:text-gray-100 rounded mb-4 px-2.5 py-0.5"}">\u2190 \u8FD4\u56DE\u5217\u8868</a></footer></div></article>`;
    });
  }
});

// .svelte-kit/output/server/chunks/index-3e3b1b3e.js
var index_3e3b1b3e_exports = {};
__export(index_3e3b1b3e_exports, {
  default: () => Talks
});
var talks, FilePdfOutline, Talks;
var init_index_3e3b1b3e = __esm({
  ".svelte-kit/output/server/chunks/index-3e3b1b3e.js"() {
    init_shims();
    init_app_e9883c9f();
    init_date_655861b7();
    talks = [
      {
        title: "How to Prioritize Tasks",
        date: "2021-06-20",
        description: "Managing time effectively by prioritizing tasks.",
        slide: "/pdfs/prioritize.pdf",
        image: "/images/present.png"
      },
      {
        title: "Developing Can-Do Attitude",
        date: "2018-09-10",
        description: "How to develop can-do attitude?",
        slide: "/pdfs/facilitation.pdf",
        image: "/images/present.png"
      },
      {
        title: "Decoding Body Language",
        date: "2021-07-09",
        description: "What is body language? How to read body language?",
        slide: "/pdfs/body.pdf",
        image: "/images/present.png"
      },
      {
        title: "Combating Climate Change",
        date: "2021-07-30",
        description: "Why is it so hard to combat climate change?",
        slide: "/pdfs/climate.pdf",
        image: "/images/present.png"
      }
    ];
    FilePdfOutline = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { size = "1em" } = $$props;
      let { width = size } = $$props;
      let { height = size } = $$props;
      let { color = "currentColor" } = $$props;
      let { viewBox = "0 0 24 24" } = $$props;
      if ($$props.size === void 0 && $$bindings.size && size !== void 0)
        $$bindings.size(size);
      if ($$props.width === void 0 && $$bindings.width && width !== void 0)
        $$bindings.width(width);
      if ($$props.height === void 0 && $$bindings.height && height !== void 0)
        $$bindings.height(height);
      if ($$props.color === void 0 && $$bindings.color && color !== void 0)
        $$bindings.color(color);
      if ($$props.viewBox === void 0 && $$bindings.viewBox && viewBox !== void 0)
        $$bindings.viewBox(viewBox);
      return `<svg${add_attribute("width", width, 0)}${add_attribute("height", height, 0)}${add_attribute("viewBox", viewBox, 0)}><path d="${"M14,2L20,8V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2H14M18,20V9H13V4H6V20H18M10.92,12.31C10.68,11.54 10.15,9.08 11.55,9.04C12.95,9 12.03,12.16 12.03,12.16C12.42,13.65 14.05,14.72 14.05,14.72C14.55,14.57 17.4,14.24 17,15.72C16.57,17.2 13.5,15.81 13.5,15.81C11.55,15.95 10.09,16.47 10.09,16.47C8.96,18.58 7.64,19.5 7.1,18.61C6.43,17.5 9.23,16.07 9.23,16.07C10.68,13.72 10.9,12.35 10.92,12.31M11.57,13.15C11.17,14.45 10.37,15.84 10.37,15.84C11.22,15.5 13.08,15.11 13.08,15.11C11.94,14.11 11.59,13.16 11.57,13.15M14.71,15.32C14.71,15.32 16.46,15.97 16.5,15.71C16.57,15.44 15.17,15.2 14.71,15.32M9.05,16.81C8.28,17.11 7.54,18.39 7.72,18.39C7.9,18.4 8.63,17.79 9.05,16.81M11.57,11.26C11.57,11.21 12,9.58 11.57,9.53C11.27,9.5 11.56,11.22 11.57,11.26Z"}"${add_attribute("fill", color, 0)}></path></svg>`;
    });
    Talks = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { size = "1.15em" } = $$props;
      if ($$props.size === void 0 && $$bindings.size && size !== void 0)
        $$bindings.size(size);
      return `${$$result.head += `${$$result.title = `<title>Talks</title>`, ""}`, ""}

        <h2>\u62A5 \u544A</h2>
        <hr>
    
        ${each(talks, (talk) => `${formatDate(talk.date) ? `<div class="${"md:flex md:items-center md:space-y-6 mb-6"}"><div class="${""}"><img${add_attribute("src", talk.image, 0)} alt="${"talk1"}" loading="${"lazy"}" class="${"w-1/2 md:w-1/4 my-4 mx-auto"}"></div>
            <div class="${"w-full md:w-11/12 m-0"}"><h4>${escape(talk.title)}</h4>
            <p>${escape(talk.description)}</p>
            <a${add_attribute("href", talk.slide, 0)} target="${"_blank"}" class="${"rounded w-max px-2.5 py-1 bg-gray-700 text-yellow-500 text-sm flex items-center space-x-2"}"><span>\u8BE6 \u60C5</span>${validate_component(FilePdfOutline, "FilePdfOutline").$$render($$result, { size }, {}, {})}</a>
            </div></div>
        <hr>` : ``}`)}`;
    });
  }
});

// .svelte-kit/output/server/chunks/post-cf056f7f.js
var Disqus, TagOutline, Post;
var init_post_cf056f7f = __esm({
  ".svelte-kit/output/server/chunks/post-cf056f7f.js"() {
    init_shims();
    init_app_e9883c9f();
    init_date_655861b7();
    init_Calendar_b6d818aa();
    Disqus = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { container = "disqus_container" } = $$props;
      let { url = window.location.href } = $$props;
      let { identifier = window.location.pathname } = $$props;
      if ($$props.container === void 0 && $$bindings.container && container !== void 0)
        $$bindings.container(container);
      if ($$props.url === void 0 && $$bindings.url && url !== void 0)
        $$bindings.url(url);
      if ($$props.identifier === void 0 && $$bindings.identifier && identifier !== void 0)
        $$bindings.identifier(identifier);
      return `<div${add_attribute("class", container, 0)}></div>`;
    });
    TagOutline = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { size = "1em" } = $$props;
      let { width = size } = $$props;
      let { height = size } = $$props;
      let { color = "currentColor" } = $$props;
      let { viewBox = "0 0 24 24" } = $$props;
      if ($$props.size === void 0 && $$bindings.size && size !== void 0)
        $$bindings.size(size);
      if ($$props.width === void 0 && $$bindings.width && width !== void 0)
        $$bindings.width(width);
      if ($$props.height === void 0 && $$bindings.height && height !== void 0)
        $$bindings.height(height);
      if ($$props.color === void 0 && $$bindings.color && color !== void 0)
        $$bindings.color(color);
      if ($$props.viewBox === void 0 && $$bindings.viewBox && viewBox !== void 0)
        $$bindings.viewBox(viewBox);
      return `<svg${add_attribute("width", width, 0)}${add_attribute("height", height, 0)}${add_attribute("viewBox", viewBox, 0)}><path d="${"M21.41 11.58L12.41 2.58A2 2 0 0 0 11 2H4A2 2 0 0 0 2 4V11A2 2 0 0 0 2.59 12.42L11.59 21.42A2 2 0 0 0 13 22A2 2 0 0 0 14.41 21.41L21.41 14.41A2 2 0 0 0 22 13A2 2 0 0 0 21.41 11.58M13 20L4 11V4H11L20 13M6.5 5A1.5 1.5 0 1 1 5 6.5A1.5 1.5 0 0 1 6.5 5Z"}"${add_attribute("fill", color, 0)}></path></svg>`;
    });
    Post = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { title } = $$props;
      let { date } = $$props;
      let { tags } = $$props;
      let { size = "1em" } = $$props;
      let dateDisplay = formatDate(date);
      if ($$props.title === void 0 && $$bindings.title && title !== void 0)
        $$bindings.title(title);
      if ($$props.date === void 0 && $$bindings.date && date !== void 0)
        $$bindings.date(date);
      if ($$props.tags === void 0 && $$bindings.tags && tags !== void 0)
        $$bindings.tags(tags);
      if ($$props.size === void 0 && $$bindings.size && size !== void 0)
        $$bindings.size(size);
      return `${$$result.head += `${$$result.title = `<title>${escape(title)} - \u4E00\u6307\u7985</title>`, ""}`, ""}

<div class="${"prose prose-sm sm:prose page max-w-none sm:max-w-none"}"><div class="${"py-4 sm:py-6 text-center"}"><div class="${"font-bold text-2xl sm:text-3xl mb-4"}">${escape(title)}</div>
		<div class="${"text-sm flex flax-wrap justify-center items-center space-x-1"}">${validate_component(Calendar, "Calendar").$$render($$result, { size }, {}, {})} <span>${escape(dateDisplay)}</span></div>
		<div class="${"mt-3 flex flex-wrap justify-center items-center"}">${each(tags, (tag) => `<a sveltekit:prefetch class="${"flex justify-center items-center space-x-1 rounded bg-gray-700 px-2.5 py-0.5 mx-1.5 my-1 text-sm text-yellow-500 hover:text-yellow-300"}" href="${"/tags/" + escape(tag)}">${validate_component(TagOutline, "TagOutline").$$render($$result, { size }, {}, {})}<span>${escape(tag)}</span></a>`)}</div></div>
	<hr>
	${slots.default ? slots.default({}) : ``}
	<hr>
	<a href="${"/blog/"}" class="${"bg-gray-700 text-yellow-500 hover:text-gray-100 rounded px-2.5 py-0.5"}">\u2190 \u8FD4\u56DE\u5217\u8868</a>
<div class="${"mt-6"}">${validate_component(Disqus, "Comments").$$render($$result, { identifier: "blog" }, {}, {})}</div></div>`;
    });
  }
});

// .svelte-kit/output/server/chunks/facilitation-fbc95f44.js
var facilitation_fbc95f44_exports = {};
__export(facilitation_fbc95f44_exports, {
  default: () => Facilitation,
  metadata: () => metadata3
});
var metadata3, Facilitation;
var init_facilitation_fbc95f44 = __esm({
  ".svelte-kit/output/server/chunks/facilitation-fbc95f44.js"() {
    init_shims();
    init_app_e9883c9f();
    init_post_cf056f7f();
    init_date_655861b7();
    init_Calendar_b6d818aa();
    metadata3 = {
      "title": "Learning Facilitation",
      "date": "2021-04-26",
      "tags": ["\u5B66\u4E60", "\u57F9\u8BAD", "\u8BFE\u5802\u8F85\u5BFC"],
      "draft": false
    };
    Facilitation = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign($$props, metadata3), {}, {
        default: () => `<p>Here are some points I learnt from a class debate during ACTA training.  </p>
<ul><li>Manage tension by balancing the needs of different learners (time vs. interaction)</li>
<li>Be committed to the learning of the learners when having fun activities</li>
<li>Demonstrate professional value by resolving ethical dilemma properly</li>
<li>Manage group discussion and intervene when necessary</li>
<li>Trainer is not a content provider but a facilitator who assists the learners to learn effectively</li>
<li>Need to manage learners\u2019 motivation although adult learners are intrinsically motivated</li>
<li>Get the learners ready to start</li>
<li>Trainers\u2019 role is not to entertain but to engage the learners in learning</li>
<li>When giving feedback, be honest but in a constructive and encouraging way</li>
<li>Have a built-in retention component</li>
<li>Donot feed too much, make sure that the learners are able to pick up</li>
<li>Link activities to learning points</li></ul>
<p>In short, we need to manage every components of a class carefully so that the learning outcomes will be achieved in the end.</p>`
      })}`;
    });
  }
});

// .svelte-kit/output/server/chunks/independent-candidates-721687bf.js
var independent_candidates_721687bf_exports = {};
__export(independent_candidates_721687bf_exports, {
  default: () => Independent_candidates,
  metadata: () => metadata4
});
var metadata4, Independent_candidates;
var init_independent_candidates_721687bf = __esm({
  ".svelte-kit/output/server/chunks/independent-candidates-721687bf.js"() {
    init_shims();
    init_app_e9883c9f();
    init_post_cf056f7f();
    init_date_655861b7();
    init_Calendar_b6d818aa();
    metadata4 = {
      "title": "\u57FA\u5C42\u4EBA\u5927\u9009\u4E3E\u90A3\u4E9B\u4E8B\u513F",
      "date": "2021-10-18T00:00:00.000Z",
      "tags": ["\u653F\u6CBB", "\u9009\u4E3E"],
      "draft": true
    };
    Independent_candidates = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign($$props, metadata4), {}, {
        default: () => `<p>\u5730\u65B9\u4EBA\u5927\u9009\u4E3E\u4E2D\u72EC\u7ACB\u5019\u9009\u4EBA\u7684\u51FA\u73B0\u5F15\u4EBA\u6CE8\u76EE\u3002</p>
<h2>\u4EBA\u5927\u7684\u53D8\u5316</h2>
<p>\u6A61\u76AE\u56FE\u7AE0 ----&gt; \u7ACB\u6CD5\u548C\u76D1\u7763</p>
<h2>\u4EBA\u5927\u4EE3\u8868\u6784\u6210</h2>
<p>\u52B3\u52A8\u6A21\u8303 ----&gt; \u8001\u677F\u5B98\u5458</p>
<h2>\u653F\u6CBB\u540E\u679C</h2>
<p>\u5F71\u54CD\u653F\u7B56\u7684\u6E20\u9053 </p>
<h2>\u793E\u4F1A\u4E0D\u516C</h2>
<p>\u7533\u8BC9\u65E0\u95E8</p>
<h2>\u8349\u6839\u4EE3\u8868</h2>
<p>\u5229\u76CA\u8BC9\u6C42\u3001\u4ECE\u653F\u5FD7\u5411\u3001\u51FA\u98CE\u5934\u3001\u63A8\u52A8\u653F\u6CBB\u53D8\u9769</p>
<h2>\u5A01\u6743\u9009\u4E3E\u4E0E\u6C11\u4E3B\u5316</h2>
<ol><li>\u515A\u5916\u8FD0\u52A8</li>
<li>\u5A01\u6743\u9009\u4E3E</li></ol>`
      })}`;
    });
  }
});

// .svelte-kit/output/server/chunks/involve-and-layingflatism-5fe03fb7.js
var involve_and_layingflatism_5fe03fb7_exports = {};
__export(involve_and_layingflatism_5fe03fb7_exports, {
  default: () => Involve_and_layingflatism,
  metadata: () => metadata5
});
var metadata5, Involve_and_layingflatism;
var init_involve_and_layingflatism_5fe03fb7 = __esm({
  ".svelte-kit/output/server/chunks/involve-and-layingflatism-5fe03fb7.js"() {
    init_shims();
    init_app_e9883c9f();
    init_post_cf056f7f();
    init_date_655861b7();
    init_Calendar_b6d818aa();
    metadata5 = {
      "title": "\u5185\u5377\u4E0E\u8EBA\u5E73",
      "date": "2021-05-30",
      "tags": ["\u653F\u6CBB", "\u7F51\u7EDC\u65B0\u8BCD"],
      "draft": false
    };
    Involve_and_layingflatism = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign($$props, metadata5), {}, {
        default: () => `<p>\u201C\u5185\u5377\u201D\u548C\u201C\u8EBA\u5E73\u201D\u662F\u6700\u8FD1\u6D41\u884C\u8D77\u6765\u7684\u4E24\u4E2A\u7F51\u7EDC\u65B0\u8BCD\u3002</p>
<p>\u5185\u5377\u672C\u6765\u662F\u4E00\u4E2A\u5B66\u672F\u6982\u5FF5\uFF0C\u672C\u610F\u662F\u6307\u4EBA\u7C7B\u793E\u4F1A\u5728\u4E00\u4E2A\u53D1\u5C55\u9636\u6BB5\u8FBE\u5230\u67D0\u79CD\u786E\u5B9A\u7684\u5F62\u5F0F\u540E\uFF0C\u505C\u6EDE\u4E0D\u524D\u6216\u65E0\u6CD5\u8F6C\u5316\u4E3A\u53E6\u4E00\u79CD\u9AD8\u7EA7\u6A21\u5F0F\u7684\u73B0\u8C61\u3002</p>
<p>\u7ECF\u8FC7\u7F51\u7EDC\u6D41\u4F20\uFF0C\u5185\u5377\u88AB\u7528\u6765\u6307\u4EE3\u975E\u7406\u6027\u7684\u5185\u90E8\u7ADE\u4E89\u5BFC\u81F4\u4E2A\u4F53\u6536\u76CA\u52AA\u529B\u6BD4\u4E0B\u964D\u7684\u793E\u4F1A\u73B0\u8C61\u3002\u52AA\u529B\u4E0D\u4F46\u4E0D\u80FD\u6362\u6765\u6210\u529F\uFF0C\u53CD\u800C\u4F1A\u4F7F\u81EA\u5DF1\u7684\u751F\u6D3B\u53D8\u5F97\u66F4\u7CDF\u3002</p>
<p>\u8EBA\u5E73\uFF0C\u6765\u81EA\u4E00\u7BC7\u9898\u4E3A\u300A\u8EBA\u5E73\u5373\u662F\u6B63\u4E49\u300B\u7684\u7F51\u5E16\uFF0C\u5176\u5168\u6587\u5982\u4E0B\uFF1A</p>
<p>\u201C\u4E24\u5E74\u591A\u6CA1\u6709\u5DE5\u4F5C\u4E86\uFF0C\u90FD\u5728\u73A9\uFF0C\u6CA1\u89C9\u5F97\u54EA\u91CC\u4E0D\u5BF9\uFF0C\u538B\u529B\u4E3B\u8981\u6765\u81EA\u8EAB\u8FB9\u4EBA\u4E92\u76F8\u5BF9\u6BD4\u540E\u5BFB\u627E\u7684\u5B9A\u4F4D\u548C\u957F\u8F88\u7684\u4F20\u7EDF\u89C2\u5FF5\uFF0C\u5B83\u4EEC\u4F1A\u65E0\u65F6\u65E0\u523B\u5728\u4F60\u8EAB\u8FB9\u51FA\u73B0\u3002\u4F60\u6BCF\u6B21\u770B\u89C1\u7684\u65B0\u95FB\u70ED\u641C\u4E5F\u90FD\u662F\u660E\u661F\u604B\u7231\u3001\u6000\u5B55\u4E4B\u7C7B\u7684\u2018\u751F\u80B2\u5468\u8FB9\u2019\uFF0C\u5C31\u50CF\u67D0\u4E9B\u2018\u770B\u4E0D\u89C1\u7684\u751F\u7269\u2019\u5728\u5236\u9020\u4E00\u79CD\u601D\u7EF4\u5F3A\u538B\u7ED9\u4F60\uFF0C\u4EBA\u5927\u53EF\u4E0D\u5FC5\u5982\u6B64\u3002\u6211\u53EF\u4EE5\u50CF\u7B2C\u6B27\u6839\u5C3C\u53EA\u7761\u5728\u81EA\u5DF1\u7684\u6728\u6876\u91CC\u6652\u592A\u9633\uFF0C\u4E5F\u53EF\u4EE5\u50CF\u8D6B\u62C9\u514B\u5229\u7279\u4F4F\u5728\u5C71\u6D1E\u91CC\u601D\u8003\u2018\u903B\u5404\u65AF\u2019\uFF0C\u65E2\u7136\u8FD9\u7247\u571F\u5730\u4ECE\u6CA1\u771F\u5B9E\u5B58\u5728\u9AD8\u4E3E\u4EBA\u4E3B\u4F53\u6027\u7684\u601D\u6F6E\uFF0C\u90A3\u6211\u53EF\u4EE5\u81EA\u5DF1\u5236\u9020\u7ED9\u81EA\u5DF1\uFF0C\u8EBA\u5E73\u5C31\u662F\u6211\u7684\u667A\u8005\u8FD0\u52A8\uFF0C\u53EA\u6709\u8EBA\u5E73\uFF0C\u4EBA\u624D\u662F\u4E07\u7269\u7684\u5C3A\u5EA6\u3002\u201D</p>
<p>\u8EBA\u5E73\u7684\u5177\u4F53\u65B9\u6CD5\u5C31\u662F\u5C11\u5DE5\u4F5C\u3001\u4F4E\u6D88\u8D39\uFF0C\u4E5F\u5C31\u662F\u4E0D996\u3001\u4E0D\u4E70\u623F\u3001\u4E0D\u7ED3\u5A5A\u3001\u4E0D\u751F\u5B50\u3002</p>
<p>\u5185\u5377\u662F\u5E74\u8F7B\u4EBA\u5BF9\u793E\u4F1A\u751F\u5B58\u73AF\u5883\u7684\u8BA4\u77E5\uFF0C\u8EBA\u5E73\u662F\u5BF9\u8FD9\u79CD\u73B0\u5B9E\u7684\u65E0\u5948\u53CD\u5E94\u3002</p>
<p>\u201C\u4E0D\u60F3\u8DEA\u7740\uFF0C\u53C8\u4E0D\u80FD\u7AD9\u7740\uFF0C\u5C31\u53EA\u597D\u8EBA\u7740\u3002\u201D</p>`
      })}`;
    });
  }
});

// .svelte-kit/output/server/chunks/learn-english-1-635252da.js
var learn_english_1_635252da_exports = {};
__export(learn_english_1_635252da_exports, {
  default: () => Learn_english_1,
  metadata: () => metadata6
});
var metadata6, Learn_english_1;
var init_learn_english_1_635252da = __esm({
  ".svelte-kit/output/server/chunks/learn-english-1-635252da.js"() {
    init_shims();
    init_app_e9883c9f();
    init_post_cf056f7f();
    init_date_655861b7();
    init_Calendar_b6d818aa();
    metadata6 = {
      "title": "English Lessons - Part 1",
      "date": "2021-08-04",
      "tags": ["\u5B66\u4E60", "\u82F1\u6587"],
      "draft": false
    };
    Learn_english_1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign($$props, metadata6), {}, {
        default: () => `<details><summary><strong>1. Becoming A Smarter Consumer</strong></summary>
 <br>
 <details><summary>(1) Vocabulary</summary>
 <dl><dt>halo</dt><dd>- a ring of light</dd><dt>hype</dt><dd>- extravagant or excessive promotion</dd><dt>unscramble</dt><dd>- clarify, decode, restore to intelligible  form</dd><dt>incite</dt><dd>- stir up</dd><dt>bombard</dt><dd>- keep attacking or pressing with questions and suggestions</dd><dt>landfill site</dt><dd>- a place used for disposal of garbage</dd><dt>wardrobe</dt><dd>- a closet or movable cabinet for holding clothes</dd><dt>spring up</dt><dd>- come into existence</dd><dt>prey on</dt><dd>- to exploit, victimize, or take advantage of someone</dd><dt>gullible consumers</dt><dd>- consumers who are too willing to believe and easily tricked</dd></dl></details>
<details><summary>(2) Writing</summary>
<dl><dt>What qualities do you usually look for in a product? </dt><dd><p>Nowadays, consumers are becoming more and more aware of the importance of product quality though they may have different views about what constitute good quality of a product. The following are what I usully look for when deciding to pay for a product.</p>
<p>First, a good product must be able to fulfill a personal need. When I buy a mobile phone, I expect it to enable me to contact my friend whenever I need to.</p>
<p>Second, a good product must be reliable. It is quite irritating that a product you bought ocaasionally failed to do what it is supposed to do.</p>
<p>Third, a product of good quality must be durable and solid. A well-known difference between branded product and conterfeit product is that branded product, which is made of solid material, is much more lasting than fake product that is of inferior quality.</p>
<p>There are some other qualities one can look for in a product, such as serviceability and aesthetics, but the above-mentioned three are the most important qualities I like to see when making a purchase.</p>
</dd><dt>Do you think commercials can really affect behavior of buyers? Why or why not?</dt><dd><p>Businesses have invested considerable resources into advertisement, creating hype and halo around their brands. Although smart consumers figure out various ways to unscramble the magic, commercials remain effective in fluencing consumer behavior.</p>
<p>First of all, consumers are human beings. They are as emotional as they are rational. Marketters can use irrational advertising techniques to exert influence on the emotional side of human characters. For example, a shoe brand can stir up urgence to buy among consumers by advertising a new model that is for market testing purpose as limited edition.</p>
<p>Moreover, various data analysis techniques have made it much easier for markettiers to accurately identify consumer preference than before. With deep understanding of consumer preference, markettiers are able to engineer or optimize commercials in ways that communicate product features more appealingly to targeted audients.</p>
<p>In short, there are many ways by which commercials can really affect consumer behavior. </p>
</dd><dt>Do you think the quality of a product depends on how it is advertised? Why or why not?</dt><dd><p>In my opinion, a heavily advertised product is likely to be of better quality.</p>
<p>It has been found that many brands have turned to new promotional tactics, focusing commercials more on quality image of brand than on features of its product. A local shoe brand, for example, named its brand as &quot;Everbest&quot;, conveying that their quality is <em>always</em> the best in the market. If a business is willing to invest so much in creating a branded image, it is reasonable to believe that the business is serious about product quality and willing to invest efforts in improving product quality.</p>
<p>Additionally, product quality is a multi-demensional concept. Whether ot not a product is of good quality depends on how you define quality. For this reason, a well engineered advertising may educate its targeted group and construct a new way to perceive good product. Take durability of fashion prodcut for example. A fashion brand, which targets at low-income group, advertised its brand as &quot;leading the fast-paced fashion&quot;. With such notion in mind, durability will be construed as &quot;uneasy to follow the fast pace of fashion&quot;. Instead, consumers will perceive &quot;cheap&quot;, which means easy to make change, as the most important quality.</p></dd></dl></details></details>
<details><summary><strong>2. Work-Life Balance</strong></summary>
<br>
<details><summary>(1) Vocabulary</summary>
<dl><dt>disgruntled employees</dt><dd>- unhappy employees who are irritable and may lose their temper easily</dd><dt>irritable</dt><dd>- get angry easily</dd><dt>lose lose temper</dt><dd>- get anry</dd><dt>burn the candle at both ends</dt><dd>- overwork yourself in the morning and at night, come in early for work and bring work home</dd><dt>be burnt out</dt><dd>- feel exhausted</dd><dt>wear someone out</dt><dd>- make someone very tired</dd><dt>get the ball rolling</dt><dd>- get a process started</dd><dt>ease up a little</dt><dd>- reduce a little bit effort</dd><dt>idle chit-chat</dt><dd>- talk that is informal and irrelevant to work</dd><dt>bounce ideas off someone</dt><dd>- share ideas with someone in order to get feedback on them</dd><dt>to be left to your own devices</dt><dd>- to be allowed to decide what to do by yourself</dd><dt>make concession</dt><dd>- to give or allow something in order to end an argument or conflict</dd><dt>commute to work</dt><dd>- a regular journey from home to workplace</dd><dt>juggle work with other tasks</dt><dd>- do work and other jobs at the same time, multi-task</dd><dt>skip dinner to finish a task</dt><dd>too busy to take dinner</dd></dl></details>
<details><summary>(2) Speaking</summary>
<dl><dt>Tell
me about your experience of being in a place where there was happiness and a
good work-life balance. How
did you feel about it? Why do you
think people feel so overworked or stressed? </dt><dd><p>I work for a local retail company as a sales manager. My daily routine is to visit the retail outlets and help resolve problems in order for them to hit their monthly targets. This is great because I do not have to clock in and out every day. As there is no clear office hours, I can easily take some time to prepare dinner for my family and schedule appointment when necessary.</p>
<p>Another reason I like the job is that the job is full of challenge. I need to analyse problems, advise team members, and propose business solutions to improve sales revenue. This provides a good opportunity to develop problem-solving, teamwork, and leadership skills. I feel a strong sense of achievement when I see a report that shows great sales performance.</p>
<p>A sales manager tends to be overworked or stressed because they are multi-tasked and often burn candle at both ends. My way to avoid being worn out is to maintain a positive attitude to challenges and to manage time effectively by prioritzing tasks.</p></dd></dl></details></details>
<details><summary><strong>3. Customs and Manners</strong></summary>
<br>
<details><summary>(1) Vocabulary</summary>
<dl><dt>finesse</dt><dd>- impressive delicacy and skill</dd><dt>etiquette</dt><dd>- the customary code of polite behaviour in society or among members of a particular profession or group</dd><dt>enunciate</dt><dd>- say and pronounce clearly</dd><dt>rapport</dt><dd>- close and harmonious relationship</dd><dt>strike a balance</dt><dd>- choose a moderate stance</dd><dt>counterfeit</dt><dd>fake, not genuine</dd><dt>attire</dt><dd>- clothes especially fine or formal ones </dd><dt>gown</dt><dd>- a long elegant dress worn on formal occasions, wedding gown</dd><dt>outfit</dt><dd>- a set of clothes worn together, especially for a particular occasion</dd></dl></details>
<details><summary>(2) Speaking</summary>
<dl><dt>Describe table manners in your family. What food is usually eaten every meal in your family?</dt><dd><p>I am from a Chinese family and the table manner in my family is quite straightforward. To follow good hygiene, we often wash hands before taking dinner. We need to show respect to the seniors, so we often let the most senior members sit and eat first. We are not allowed to use our hands to handle food. If the food is too difficult to be handled by chopstics, we can use spoon or knife instead. Leaving chopstics on the top of bowl means &quot;having finished&quot;. Instead, if we put chopstics on the side of bowl, it means &quot;taking a break from eating&quot;.</p>
<p>We have a variety of food for dinner. Rice is usually eaten every meal as main food though we occasionally eat noodles and dumplings. In addition, vegetables are also eaten every meal to keep dinners healthy.</p>
<p>Putting chopstics vertically stuck in a bowl of rice is considered as a bad manner because it symbolizes the ritual of incense burning. It is also quite impolite to point chopstics to any other sitting around, because it means you see others as your &quot;dish&quot;.</p></dd></dl></details></details>
<details><summary><strong>4. Talking about Achievements</strong></summary>
<br>
<details><summary>(1) Vocabulary</summary>
<dl><dt>excel in</dt><dd>- be proficient in; be exceptionally good at</dd><dt>align oneself with</dt><dd>- give support to (a person, organization, or cause) </dd><dt>My greatest achievement has been ...</dt><dd>- can be used to talk about past achievement</dd><dt>What I&#39;m most proud of is ...</dt><dd>- can be used to talk about past achievement</dd><dt>stride</dt><dd>- a long and decisive step</dd><dt>household duties</dt><dd>- duties of taking care of family</dd><dt>prevailing</dt><dd>- current, existing, having most appealing or influence</dd><dt>unprecedented</dt><dd>- never done or known before</dd><dt>thriving</dt><dd>- prosperous or growing; flourishing</dd><dt>the brunt of</dt><dd>- the worst part or chief impact of a specified action</dd><dt>child-rearing</dt><dd>- bringing up or caring for a child until they are fully grown</dd><dt>conform to</dt><dd>- comply with rules, regulations, or standard</dd><dt>pale</dt><dd>- seem or become less important</dd><dt>harsh</dt><dd>- cruel or severe</dd><dt>be mindful of</dt><dd>- be aware of</dd></dl></details>
<details><summary>(2) Speaking</summary>
<dl><dt>What sort of professional achievements have you accomplished?</dt><dd><p>My greatest professional achievement has been developing up a productive sales force for my company, which resulted in 30% increase in annual sales revenue. This was a great achievement because the company sales had been stagnant for many years before I joined the company.</p>
</dd><dt>Did you have to overcome challenges in order to achieve your goals?</dt><dd><p>I would say it was not easy to achieve that much increase in sales. I had to overcome a number of challenges. </p>
<p>First, there was no budget for me to do advertisement. Second, the sales team was a little bit aged and it was uneasy to hire young people because at that time no young people have interest working in retail line. Last but not least, many of the sales associates were digruntled employees with negative attitude toward work. </p>
<p>To overcome the challenges, I focused my work on developing sales team. I firstly organized a series of training to improve sales and service skills. And at the same time, I tried to instill positive way of thinking into the sales associates. Most importantly, I deviced a variety of incentive programs, which were effective in motivating sales staff. My effort paid off. The company finally saw continuous improvement in sales.</p>
</dd><dt>What are most you most proud of?</dt><dd><p>What I am most proud of is I was promoted to the position of sales operation manager. As mentioned above, I had demonstrated strong ability to develop and lead a team. I had also shown a positive attitude toward work. With strong work ability and positive attitude, I was able to excel in the position and reap the benefits.</p></dd></dl></details></details>
<details><summary><strong>5. Concept Maps</strong></summary>
<br>
<details><summary>(1) Vocabulary</summary>
<dl><dt>intangible</dt><dd>- hard to define or measure; vague and abstract</dd><dt>photosynthesis</dt><dd>- the process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water</dd><dt>colloquial</dt><dd>informal language used in ordinary or familiar conversation </dd></dl></details>
<details><summary>(2) Writing</summary>
<dl><dt>Describe the picture you see.</dt><dd><p>This picture shows a cultural event organized by Indians in a big playground.</p>
<p>On the left, a man with moustache is selling colorful balloons. He is wearing a yellow short-sleeved shirt and an orange checkered skirt. The balloons he is selling are displayed on a tree-like stand beside him.</p>
<p>A woman in front of the salesman just bought two balloons for her son. The boy is wearing a red checkered shirt and a short in black. His left hand is in his mother&#39; hand, and his right hand is holding the two balloons his mother just bought for him. They are walking toward the big event tents located on the up-left corner of the playground.</p>
<p>Beside the big tents, people are queuing up to enter the tents.</p>
<p>Right beside the big tents, there is also a line of smaller tents decorated in different colors. In each of the small tent, there is a vendor inside selling products and services. People are walking along the small tents, browsing the products displayed inside.</p>
<p>Just behind the line of small tents, there is a big wheel with some big tubs attached to its rim.</p>
<p>On the right side of the picture, there is a big, round platform. A very big tree rooted in the center of the platform. The trunk of the tree is quite big, showing that the tree is likely an old tree. The leaves of the tree, however, are still fresh and green.</p>
<p>Beside the tree, a magician is performing magic. The magician is wearing a traditional indian outfit. He really looks like a magician because of his long beards and moustaches. And the prop on his right hand looks quite strange also. A a group of audients in differrent ages are sitting around the platform and watching his performance.</p>
<p>A signage board is standing beside the platform, showing what the performance is about.</p></dd></dl></details></details>
<details><summary><strong>6. Technology at Workplace</strong></summary>
<br>
<details><summary>(1) Vocabulary</summary>
<dl><dt>mechanized</dt><dd>- equipped with machines</dd><dt>automation</dt><dd>- use of automatic eqipments</dd><dt>obsolete</dt><dd>- out of fashion</dd><dt>cutting-edge</dt><dd>- highly advanced</dd><dt>user-friendly</dt><dd>- easy to use</dd></dl></details>
<details><summary>(2) Writing</summary>
<dl><dt>Tom: Hi, welcome to the chat group. What do you think of the future of the voice-activated devices in the workplace?</dt><dd><p>Me: Hi Tom. Hi everyone. Voice-activation is a cutting-edge technology. It&#39;s quite likely that voice-activated devices will be widely used to automate the business processes in workplace. Take retail shop for example, in future we will see voice-activated robots serve customer in shops. And, storemen in warehouse won&#39;t have to do physical jobs any longer. They just need to give instructions and the voice-activated robots will carry the instructions out.</p>
</dd><dt>Mary: Hi everyone. What is the possibility of technology continuing development?</dt><dd><p>Me: That&#39;s an interesting question. I personally think that if technology continues development, most of the technical and physical jobs will be automated or mechanised. This must be a good news because human being will be free from life-burden and thus having time and resources to develop humanity.</p></dd></dl></details></details>
<details><summary><strong>7. Entertainment and Media</strong></summary>
<br>
<details><summary>(1) Vocabulary</summary>
<dl><dt>cast</dt><dd>- assign a part in a play or film</dd><dt>poverty-stricken</dt><dd>- seriously affected by poverty</dd><dt>stunning</dt><dd>- extremely impressive or attractive </dd><dt>beyond the bubble of familiarity</dt><dd>- take on challenges and go beyond the comfort zone</dd><dt>nomophobia</dt><dd>- can not live without mobile phone</dd><dt>noteworthy</dt><dd>- worth paying attention to</dd><dt>level off</dt><dd>- remain at a steady level after falling or rising</dd><dt>viable</dt><dd>- capable of working successfully, feasible</dd><dt>ban</dt><dd>- officially or legally prohibited</dd></dl></details>
<details><summary>(2) Writing</summary>
<dl><dt>Look at the picture and write in 100 words of your thoughts about it.</dt><dd><p>The picture shows what a passive life style typically looks like.</p>
<p>In the picture, a young man is lying on a sofa with his head propped in the palm of his left hand. He looks bored and dispirited as he keeps switching TV channels with the remote control in the palm of his right hand.</p>
<p>The young man did not (maybe never) cook for himself, but ordered pizza and popcorn from a fast food restaurant. Obviously, he eats neither to keep fit nor for pleasure, but merely to get himself out of hunger. There are some empty beer bottles on the table in front of him. It is likely that he needs beer or alcohol to help alleviate his negative mood.</p>
<p>Probably because he rarely exercises, he is overweight and looks fat. His big tummy remains exposed even he is wearing a large size T shirt.</p>
<p>Living an inactive life style may jeopardize your health. It may cause physical and mental diseases. The best way to avoid being caught in passive life style is to stand up and do something meaningful.</p>
</dd><dt>Words about Media</dt><dd><strong>Words connected to newspaper</strong>
<ul><li>Types of newspapers: broadsheet and tabloid</li>
<li>Contents of newspaper: news report, advertisements, critic reviews, editorial opinions</li>
<li>Newspaper jobs: journalist, editor, news analyst, column writer</li></ul>
<strong>Words connected to television</strong>
<ul><li>Television technology: liquid crystal display (LCD), high resolution, digital light processing (DLP), curved screen, voice activated TV</li>
  <li>Television programmes: weather broadcasting, news report, news analysis, documentary, TV series, talk shows, fashion shows, sports and recreation, brand advertisement</li>
  <li>People work for television: documentarian, photographer, performer, writer and editor, visual effect artist, cinematographer, custume designer, casting director, sports commentators</li></ul>
<strong>Words connected to radio</strong>
<ul><li>Types of radio stations: AM (amplitude modulation) stations, FM (frequency modulation) stations</li>
  <li>Genres of radio programmes: news and current affairs, radio comedy, radio drama and music, dialogues</li>
  <li>People work for radio: news director, announcer, broadcaster, radio station engineer, music director</li></ul>
<strong>Words connected to new media / online media</strong>
<ul><li>Types of online media: website, online forum, podcast, blog, email, social networking sites</li>
  <li>Contents shared across online media: infographics, videos, ebooks, podcasts, gifs, images, blog articles, newsletters, online games, product reviews, tweets, webinars, posts</li>
  <li>Users of online media: bloggers, influencers, commentators, marketers</li></ul>
<strong>Kinds of news / kinds of news story</strong>
<ul><li>sports news, political news, business news, entertainment news, investigative news</li>
  <li>domestic news, international news, local news</li></ul>
<strong>People connected to news and media</strong>
<ul><li>journalist, editor, commentator, news analyst, column writer, presenter, broadcaster</li>
  <li>audients, blogger, influencers and followers</li></ul>
<strong>Positive words connected to news and media</strong>
<ul><li>informative, educational, insightful, powerful, impactful, transparent</li></ul>
<strong>Negative words connected news and media</strong>
<ul><li>fake news, rumor, gossip, misleading, violence, pornography, brain-washing</li></ul></dd></dl></details></details>
<details><summary><strong>8. Formal and Informal Emails</strong></summary>
<br>
<details><summary>(1) Vocabulary</summary>
<dl><dt>subject line</dt><dd>- a line about the topic of an email</dd><dt>recipient</dt><dd>- the person whom an email is intended to be sent to</dd><dt>courteous</dt><dd>- polite, respectful, and considerate in manner</dd><dt>garble</dt><dd>- reproduce in a confused and distorted way</dd><dt>cc</dt><dd>- carbon copy</dd><dt>bcc</dt><dd>- blind carbon copy</dd><dt>unforeseen</dt><dd>- unexpected</dd><dt>dismay</dt><dd>- concern and distress caused by something unexpected</dd><dt>overdose</dt><dd>- an excessive and dangerous dose of a drug</dd><dt>prescription</dt><dd>- an instruction written by a medical practitioner that authorizes a patient to be issued with a medicine or treatment</dd><dt>Some formal writing</dt><dd>- Please send my regards to everyone <br>
- I am writing in response to your ... <br>
- Look forawrd to hearing from you at your earliest convenience <br>
- Please find attached the documents you requested <br>
- Once again, I apologize for causing you any inconvenience <br>
</dd><dt>Some informal writing</dt><dd>- Thank you so much for inviting me to your home yesterday <br>
- Please email me soon <br>
- How&#39;re you doing? <br>
- I&#39;m sorry we haven&#39;t been in touch for such a long time <br>
- I thought I&#39;d drop you a line rather than call <br></dd></dl></details>
<details><summary>(2) Writing</summary>
<dl><dt>Write an email about a problem you encountered after you bought an electronic/electrical item from a retail or an online store. Use the model in C2 Activity 1 and the questions below to help you.
</dt><dd>From: yzc@gmail.com <br>
To: customerservice@electroX.com.sg <br>
Subject: Defective vacuum cleaner received (order #435231) <br>
<hr>
<p>Dear person-in-charge,</p>
<p>On 5th of July 2021 I purchased a desktop computer (iMac v.11, order #839412345)  at your retail shop in Waterway Point shopping mall. And, I received the computer this afternoon. </p>
<p>Unfortunately, the computer has not performed well because the screen keeps flickering. And, the key of P on the keyboard is not clickable at all.</p>
<p>To solve the problem, I would like to request for a refund. The receipt and delivery order are attached for your reference.</p>
<p>I look forward to your prompt reply. You can contact me at my mobile phone number at 92783375.</p>
<p>Yours faithfully,</p>
<p>John C</p>
</dd><dt>You will be attending a business seminar next week. You found out your friend Jamie will be attending too. Write an informal email to her.</dt><dd>From: yzc@gmail.com <br>
To: jamie@gmail.com <br>
Subject: Attending business seminar together <br>
<hr>
<p>Hi Jamie,</p>
<p>Long time no see! How are you?</p>
<p>I came across you are attending the seminar on \u201CChange Management and Business Adaptability\u201D next week. I am also invited to attend the seminar.</p>
<p>What a good chance to meet up!! I\u2019d love to have coffee together with you after the seminar.</p>
<p>Please confirm your attendance. I will be waiting for you at the main entrance. </p>
<p>Look forward to seeing you again.</p>
<p>Much love,</p>
<p>John</p>
</dd><dt>You are the head of the department. Your staff Peter Lee will be organizing the upcoming customer-solution conference. Write an email to the staff. Inform them that Peter is in charge, and to attend a meeting with him to discuss the details of the conference.
</dt><dd>From: yzc@abc.com.sg <br>
To: myteam@abc.com.sg <br>
Subject: About the upcoming Customer-Solution Conference <br>
<hr>
<p>Dear All,</p>
<p>I am pleased to announce that the customer-solution conference will be held on 27th of October 2021 and Peter Lee is the person in charge of organizing the conference. </p>
<p>In order to make a good preparation for the coming event, I need all of you to attend a meeting with Peter Lee, discussing the details of the upcoming conference. The meeting is arranged as below:</p>
<ol><li>Topic: Details of Customer-Solution Conference</li>
<li>Date: 2nd of October (Tuesday)</li>
<li>Time: 2:00 PM</li>
<li>Venue: Meeting room</li></ol>
<p>Please attend the meeting punctually and feel free to share your ideas at the meeting.</p>
<p>Cheers.</p>
<p>Yours faithfully,
John</p></dd></dl></details>
<details><summary>(3) 4-Point Plan for eMail Content</summary>
<dl><dt>1. Introduction</dt><dd>Briefly describe why you are writing the email.</dd><dt>2. Details</dt><dd>Write the content or message that you want to say. Use paragraphs and graphic devices to make the message clear. Take note of the essential details such as who, what, where, when, why, and how.</dd><dt>3. Response or Action</dt><dd>List the action you request or need to take. Use paragraphs and graphic devices if necessary.</dd><dt>4. Conclusion</dt><dd>Summarize and close the subject.</dd></dl></details></details>
<details><summary><strong>9. Employment Matters</strong></summary>
<br>
<details><summary>(1) Vocabulary</summary>
<dl><dt>devastate</dt><dd>- destroy or ruin</dd><dt>unnerve</dt><dd>- make someone lose courage or confidence</dd><dt>erosion</dt><dd>- gradual destruction</dd><dt>emabrk on</dt><dd>- start</dd><dt>mediation</dt><dd>- resolve disputes</dd><dt>have solid experience in all dimensions of the job</dt><dd>- have thorough knowledge about the job</dd><dt>stifle</dt><dd>- prevent or constrain (an activity or idea)</dd><dt>nasty</dt><dd>- very bad or unpleasant</dd><dt>wear off</dt><dd>- lose effectiveness or intensity</dd><dt>toddler</dt><dd>- young child who is just beginning to walk</dd><dt>tuck into</dt><dd>- eat food heartily</dd><dt>blow up</dt><dd>- explode; lose one&#39;s temper</dd><dt>crib</dt><dd>- bed for a small baby</dd><dt>tantrum</dt><dd>- an uncontrolled outburst of anger or frustration, typically in a child</dd><dt>put someone on hold</dt><dd>- delay</dd></dl></details>
<details><summary>(2) Writing</summary>
<dl><p><em>The Chow family is on vacation. They are staying in Hawii for five days. They rented a hotel room on the beach in Maui. Everyone is excited. The kids want to go on a submarine tour and see the fish in the Pacific Ocean. Mrs. Chow wants to go shopping and take a sunrise tour of Haleakaia Crater. Mr. Chow wants the family to go hiking in the morning, visit Musems in the afternoon, and have a barbecue on the beach in the evening. He is worried about spending too much money. Mrs. Chow thinks her husband worries too much about money. She wants him to relax and forgot about money while they are on vacation.</em></p><dt>What should Mrs. Chow do? How can she solve her problem?</dt><dd><p>Mr. Chow seems to be in a dilemma. On the one hand, he wants his family to have a wonderful vacation; but on the other hand, he is afraid to spend too much.</p>
<p>If I were Mrs. Chow, I would tell Mr. Chow that we should prioritize happiness over others while on vacation. We don&#39;t have to worry about spending too much because we can save money by spending smarter. We can list out all the items that each everyone of us wants to do. After assessing the price-benefit ratio of the items, we can remove some items with lower value from the list. Moreover, as the room we rented has a kitchen, we can prepare food by ourselves before going out. Additionally, we can plan our trip route and use public transportation instead of taking taxi. Lastly, we can reschedule our trip and avoid visiting the popular sites on weekends when the fees are higher.</p>
<p>In short, Mrs. Chow can solve her problem by discussing with her family for an optimal trip plan.</p>
</dd><hr><p><em>Marty drives a cab in New York City. He works six days a week from 5:30am to 5:30pm. He doesnot always get to eat when he&#39;s hungry or go to the restroom when he needs to go. Driving a cab is difficult. Traffic in the city is often slow and there are many accidents and construction sites drivers have to go around. Driving a cab is also dangerous. When it rains or snows the roads are slippery. Sometimes criminals steal the cab driver&#39;s money. Most of Marty&#39;s passengers are nice. They tip him twenty percent of the cab fare. Marty likes his job, but lately he has been feeling tired from working twelve hour shifts. Many of his passengers are tourists, and they like to talk a lot. Unfortunately, Marty is seldom in the mood to talk any more. It&#39;s hard to be friendly everyday.</em></p><dt>What should Marty do? How can he solve his problem?</dt><dd><p>Marty seems to be in a dilemma. He likes to be a cab driver but he is overworked and no longer be able to get a sense of satisfaction on the job. </p>
<p>If I were Marty, I would re-skill myself and seek to transition to new job. Actually, I am quite pessimistic about the future of cab driver job. News report on technology has it that driverless vehicles are already in production. With autonomous vehicles taking over driving, cab driver as a job is bound to disappear sooner or later. </p>
<p>The arrival of autonomous vehicles, however, will also create new job opportunities while transforming the traditional. For instance, with taxi service being replaced by driverless cars, there must be increasing demand for driverless vehicle dispatchers and safety maintenance technicians. </p>
<p>Drivers like Marty do not have to feel like in a quandary. They can take training courses, retool their skillset, and get themselves ready to embrace the new opportunities.</p></dd></dl></details></details>
<details><summary><strong>10. Giving Advice and Being Undecided</strong></summary>
<br>
<details><summary>(1) Vocabulary</summary>
<dl><dt>chill out</dt><dd>- relax</dd><dt>turn down</dt><dd>- reject</dd><dt>work out</dt><dd>- end well</dd><dt>carry on</dt><dd>- continue</dd><dt>gut feeling</dt><dd>- feeling based on intuition, instinctive feeling</dd><dt>opportunity of a lifetime</dt><dd>opportunity that is rare or unique</dd><dt>in two minds</dt><dd></dd><dt>be torn as to what to do</dt><dd></dd><dt>waver in one&#39;s decision</dt><dd></dd><dt>backtrack on one&#39;s decision</dt><dd></dd><dt>take a huge leap of faith to trust someone</dt><dd></dd><dt>take the plunge and throw in the towl</dt><dd></dd><dt>in a quandary</dt><dd></dd><dt>dwell on something</dt><dd>- keep thinking on something</dd><dt>between a rock and a hard place</dt><dd></dd><dt>be at one&#39;s wit end</dt><dd></dd><dt>sell like hotcakes</dt><dd></dd></dl></details>
<details><summary>(2) Speaking</summary>
<dl><dt>After thinking about their job offer, you have decided to reject the offer. Tell the company which proposed the offer to you, about your decision.</dt><dd>Thank you for offer me the role of operation manager. But I decided to turn it down, because I had accepted a position with another company. I enjoyed our conversations and appreciated your taking time to interview me. Thank you so much for your consideration.</dd><dt>Describe a situation that led you to have to make a difficult choice. How did you feel about it? What are important factors to think about before making a decision?</dt><dd><p>Mr. Jackson is a salesperson in my sales team. One day, his supervisor complained to me that he could not work with Jackson any longer. This is not the first time I received complaint about Jackson\u2019s bad work attitude. Actually his recalcitrance has caused a lot of troubles and been a source of complaints.</p>
<p>However, to sack him or to keep him is not an easy decision to make because Jackson is unquestionably brilliant in sales. I feel like I am between a rock and a hard place. If I kick him out, the outlet sales will drop. If I keep him in, the teamwork will be impaired.</p>
<p>To get out of the dilemma, I saught advice from my boss. He told me that, \u201CNobody is irreplaceable. Brilliant jerks are costly. If you tolerate them, the cost to effective teamwork will become unacceptably high.\u201D</p>
<p>I have to say, my boss\u2019s advice is insighful and helpful.</p></dd></dl></details>
<details><summary>(3) Writing</summary>
<dl><dt>Hello, Thanks for coming for this interview. Can you state what your main skills are?</dt><dd><p>Thank you for the opportunity. As a candidate, here is what I can immediately bring to the table. First of all, I am a great problem solver. I have shown strong ability to identify problem through data analysis. I have been able to develop detailed plan for selected solution. And, I have worked hard to ensure successful implementation of the plan.</p>
<p>I am also good at developing sales force. I am able to identify and recruit talented sales associates. In addition, I have showcased my exceptional skills in coaching and training sales staff.</p>
</dd><dt>Welcome. Can you tell us what you have been doing in the last three years?</dt><dd>I am confident that my previous experience will help me with this new challenge. In the last three years, I have worked for ABC company as an operation manager. This gave me opportunitiy to formulate operational objectives, oversee inventory and warehouse efficiency, manage budgets and forecasts, as well as monitor sales performance. This experience have equipped me with strong leadership ability, which is a must-have for anyone who wants to be successful in this position.
</dd><dt>Why do you think you will be the best person for this job?</dt><dd>My skillset is a perfect match for the job requirements. In particular, my leadership skills and managerial experience make me a good fit for this position. At my last job, for example, I managed a team of fourty employees. Under my leadership, the sales revenue has increased 20 percent, which breaks historical record of the company. I can bring my success and experience to this job.
</dd></dl></details></details>`
      })}`;
    });
  }
});

// .svelte-kit/output/server/chunks/learn-english-2-1fe37b3a.js
var learn_english_2_1fe37b3a_exports = {};
__export(learn_english_2_1fe37b3a_exports, {
  default: () => Learn_english_2,
  metadata: () => metadata7
});
var metadata7, Learn_english_2;
var init_learn_english_2_1fe37b3a = __esm({
  ".svelte-kit/output/server/chunks/learn-english-2-1fe37b3a.js"() {
    init_shims();
    init_app_e9883c9f();
    init_post_cf056f7f();
    init_date_655861b7();
    init_Calendar_b6d818aa();
    metadata7 = {
      "title": "English Lessons - Part 2",
      "date": "2021-09-02",
      "tags": ["\u5B66\u4E60", "\u82F1\u6587"],
      "draft": false
    };
    Learn_english_2 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign($$props, metadata7), {}, {
        default: () => `<details><summary><strong>11. Considering A Career Change</strong></summary>
<br>
<details><summary>(1) Vocabulary</summary>
<dl><dt>chance of advancing</dt><dd>- opportunity to be promoted</dd><dt>make the best of impression possible at interview</dt><dd>- to present the best at interview</dd><dt>transferrable skills</dt><dd>- skills that can be applied to other areas</dd></dl></details>
<details><summary>(2) Writing</summary>
<dl><dt>Look at the picture and write in about 100 words your thoughts about it.</dt><dd><p>With recent development of artificial intelligence, it is quite likely that robots will, as you can see in the picture, enter workplaces and work together with human workers. Some people are optimistic about the intelligent robotisation of workplace. They argue that  with robots taking over the jobs that are repetitive and physically heavy, human can achieve higher job satisfaction by focusing on work that are more meaningful and worthwhile. I disagree with this overly optimistic outlook. I tend to believe that robotisation will significantly decrease human workers\u2019 job satisfaction.</p>
<p>In the first place, it is not necessarily true that human workers will be involved in more meaningful work after the introduction of robots. For instance, the work of taxi drivers in a city of China was partly outsourced to robots with introduction of autonomous cars. Some of the drivers were transferred to the position of dispatcher. Compared to driving, this new work sounds more exciting in the sense that it is not physically tiring and involves larger scale decision-making. However, a field research on those taxi drivers revealed that they were feeling deprived of meaningful work. Instead of being able to respond to passengers\u2019 request directly, the newly appointed dispatchers were now only serving passengers indirectly. The feedback that they were no longer able to see the passengers\u2019 satisfied smiles meant that they felt a loss of meaningful work after the introduction of robots. </p>
<p>In the second place, the introduction of robots will make workplaces lack of social connectedness. Sociological research has confirmed that a sense of relatedness at work is positively linked to one\u2019s job satisfaction. Cooperating with co-workers, feeling accepted by colleagues, being guided or mentored lead human workers to believe that their work is meaningful and worthwhile. Without a weakened sense of connectedness, human workers will soon find their work is not worthwhile at all.</p>
<p>To conclude, the impact of workplace robotisation could be as negative. More scientific research are needed to explore possible ways to help human workers to improve job satisfaction while working with robots.</p>
</dd><dt>If you had a choice what job would you like to do in future? Write in about 80-100 words.</dt><dd><p>I would like to be a web developer in future if I have a choice.</p>
<p>Web developers can either work independently as freelancers or work with company teams to create websites. The work that a web developer usually does includes front-end development, back-end development, and website maintenance. Front-end development is to design website and produce contents. Back-end development is to write code and make the features of a website function. Website maintenance is to maintain functions, fix bugs, and manage database of a website. To be a web developer, you must be very proficient in mark-up languages,  programming languages, as well as  popular frameworks built upon these languages. As the technical stacks for web development evolves very fast, you need to keep learning so as to stay relevant.</p>
<p>The reason why I like to be a web developer is that it is quite easy to land a job with decent pay. According to statistics, the average salary for a web developer is ranked the highest among other technology-related jobs. And, it takes only 1 month to land a web development job, five months shorter than others. </p></dd></dl></details></details>
<details><summary><strong>12. Asking and Giving Opinions</strong></summary>
<br>
<details><summary>(1) Vocabulary</summary>
<dl><dt>junk food</dt><dd>- food that lacks of nutrients</dd><dt>moderate quantity</dt><dd>- not too little and not too much</dd><dt>processed food</dt><dd>- food that is not fresh</dd><dt>balanced meal</dt><dd></dd><dt>substance</dt><dd>- a particular kind of matter with uniform propertities</dd><dt>dementia</dt><dd>- a persistent disorder of brain caused by brain disease</dd><dt>perpetrator</dt><dd>someone who comiitted a crime</dd><dt>reoffend</dt><dd>committed a further offend</dd><dt>harsh</dt><dd>- strict, severe</dd><dt>empathy</dt><dd>- ability to understand or share feeling with others</dd><dt>rehabilitative</dt><dd>- able to restore someone to health</dd><dt>deter someone from something</dt><dd>- to make someone stop doing something</dd><dt>half the battle</dt><dd>- not complete yet</dd><dt>old habits die hard</dt><dd>- difficult to change old habits</dd><dt>expressions for expressing opinions:</dt><dd>- I tend to think that ... <br>
- I believe that ... <br>
- In my opinion <br>
- It is important to think about what ... <br>
- I honestly feel that ... <br></dd></dl></details>
<details><summary>(2) Writing</summary>
<dl><dt>Complete the table</dt><dd><table><thead><tr><th align="${"left"}">Subject</th>
<th align="${"left"}">Your Opinion</th>
<th align="${"left"}">Your Partner\u2019s Opinion</th></tr></thead>
<tbody><tr><td align="${"left"}">Japanese cars</td>
<td align="${"left"}">Good quality, but expensive</td>
<td align="${"left"}">Too small and not powerful</td></tr>
<tr><td align="${"left"}">Smoking in hospitals</td>
<td align="${"left"}">Alleviate patients\u2019 bad mood</td>
<td align="${"left"}">Worsen their health condition</td></tr>
<tr><td align="${"left"}">Western food</td>
<td align="${"left"}">Not tasteful but expensive</td>
<td align="${"left"}">Easier to cook</td></tr>
<tr><td align="${"left"}">Sport</td>
<td align="${"left"}">Improve physical skills</td>
<td align="${"left"}">Unleash violent behaviours</td></tr>
<tr><td align="${"left"}">Chinese medicine</td>
<td align="${"left"}">Natural and less side effects</td>
<td align="${"left"}">not based upon scientific knowledge</td></tr></tbody></table></dd></dl></details></details>
<details><summary><strong>13. Using Visual Representation</strong></summary>
<br>
<details><summary>(1) Vocabulary</summary>
<dl><dt>detriment</dt><dd>- the state of being harmed or damaged</dd><dt>reinforce the message</dt><dd>- stengthen the message</dd><dt>audible</dt><dd>- able to be heard</dd><dt>visual aid</dt><dd></dd><dt>pictograph</dt><dd></dd><dt>projection screen</dt><dd></dd><dt>expressions for giving vague information:</dt><dd>- about <br>
- approximately <br>
- or so <br>
- a large number <br>
- hardly <br>
- difficult to say <br>
- not really sure <br>
- kind of <br>
- sort of <br>
- no clear cut <br>
- I guess <br>
</dd><dt>exhale</dt><dd>- breathe out</dd><dt>respiration</dt><dd>- the action of breathing</dd><dt>cardiac</dt><dd>- relating to heart</dd></dl></details>
<details><summary>(2) Speaking</summary>
<dl><dt>Talk about the development of the computer and Internet revolution through the years.</dt><dd><p>There is a long history of using devices to aid in counting or computing. In 500BC, abacus calculator was developed to do simple counting as well as arithmetic calculations. Although abacus techniques were well developed to do complex calculations, it remained a simple and primitive \u201Ccounting device\u201D. As it relied solely on manual operation, it was unable to do logarithm calculation.</p>
<p>In 1821, the first mechanical calculator was invented by Charles Babbage, a British mathematician who is later known as \u201CFather of Modern Computer\u201D. Unlike abacus calculator, the steam-driven calculating machines were capable of solving any mathematic problem even storing information as permanent memory. </p>
<p>The first electric computer was developed in 1939. Two years later, the first fully automatic and digital computer was created by German engineer Konrad Zuse. The digital computers can be used for routine jobs because they are equipped with the speed of electronic and the ability to be programmed.</p>
<p>The development of electric computer has greatly accelerated the revolution of more information technology. In 1971, Raymond Tomlinson invented email. This invention is revolutionary because email made it possible for different computers to exchange message with each other.</p>
<p>Two years after the first email was sent in 1971, the first computer with graphical user interface, keyboard, and mouse was invented. This introduction of graphical interface greatly simplified the way of people interacting with computer. People without knowledge about programming can operate computer.</p>
<p>In 1973, the first personal computer was introduced. As personal computer was much smaller in size and much cheaper in price, it was soon popularised for mass use.</p>
<p>In 1983, ten years after the introduction of personal computer, global internet was created. As interest in networking grew, web technology such as W3 and web browsers developed rapidly. In 1994, world wide web surfing began.</p></dd></dl></details>
<details><summary>(3) Writing</summary>
<dl><dt>Write a short story based on the sequence of events in the chart</dt><dd><p>A week ago, I was on my newly purchased motorcycle, riding along  on the twist road at the shore of Gulang island in Amoy city. Suddenly, a drunk-driving car came toward me at a tremendous speed. Scared by the situation, I flusteredly accelerated the bike instead of applying the handbrake. This made me feel panicky and breathless. To avoid colliding with the car, I hurried to turn the bike left and consequently ran into the sea.</p>
<p>I did not know how to swim and almost drown in water. When I struggled to bob my head above the water, I noticed that something big was swimming toward me. It had a dorsal fin on its back, two pectoral fins on its sides, and a tail. \u201CA shark!\u201D I gave a yell of fear and desperately kicked my legs in water. After a few seconds,  my legs tired and I started sinking. When I could not hold my breath, the water rushed in. I thought I was about to die. At this very moment, something suddenly hit my back. I felt myself being pushed to the surface of the water and toward a boat. </p>
<p>When I recovered from the panic, a rescuer pointed to a bottlenose dolphin and told me, \u201CIt was she who saved your life.\u201D The bottlenose dolphin was swimming away from the boat. She wasn\u2019t afraid of swimmers around and kept returning to the sea. \u201CDolphins and human being are friends. We should protect them like what they did for us.\u201D I said to the reporter who interviewed me after the accident.</p></dd></dl></details></details>
<details><summary><strong>14. Going Online and the Changing Workplace</strong></summary>
<br>
<details><summary>(1) Vocabulary</summary>
<dl><dt>menial job</dt><dd>- low-status work that does not require much skill to do</dd><dt>volatile</dt><dd>- likely to change</dd><dt>mundane</dt><dd>- dull, lacking interest or excitement</dd><dt>agile</dt><dd>- able to move quickly and easily</dd><dt>memoirs</dt><dd>- a historical account or biography written from personal knowledge</dd><dt>touchy</dt><dd>- oversensitive, easily upset and offended</dd><dt>solitude</dt><dd>the state or situation of being alone</dd><dt>devoid of</dt><dd>- entirely lacking of</dd><dt>clerical work</dt><dd>- routine documentation and administrative tasks</dd><dt>office supplies</dt><dd></dd><dt>repetitive tasks</dt><dd>- tedious routines</dd><dt>gadget</dt><dd>- a small mechanical or electronic device</dd><dt>snnipets</dt><dd>- small pieces</dd><dt>tackle difficult situation</dt><dd>- handle difficult problems</dd><dt>take on new challenges</dt><dd>- assume new responsibilities</dd><dt>initiative to step forward</dt><dd></dd><dt>desire to keep learning</dt><dd></dd><dt>retool skillset</dt><dd>- upgrade, upskill</dd><dt>miss out</dt><dd>- not be able to experience</dd><dt>syndrome</dt><dd>- a group of symptoms which consistently occur together</dd><dt>acquaintance</dt><dd>- a person who knows slightly, but who is not a close friend</dd><dt>lose the art of conversation</dt><dd></dd><dt>food for thought</dt><dd>something worth thinking seriously about</dd><dt>hit the nail on the head</dt><dd>- answer the questions that you want to ask</dd><dt>switch back and forth</dt><dd></dd></dl></details>
<details><summary>(2) Speaking</summary>
<dl><dt>What do you think about social media? Which sites and apps do you use?</dt><dd><p>I tend to think that social media has both positive and negative impact on society. </p>
<p>On positive side, social media has provided more convenient means for people to build and maintain relationships. With social media, we can make friends even with people we never meet in person. Moreover, social media has democratised media by giving everyone an equal voice. You can write anything and anyone has the chance to read it or view it. Social media has also revolutsonarized the way people do business. By interacting with their consumers on  social networks, businesses are able to learn how to target consumers with the right products and services at the right time of need. Lastly, social media has provided people with more and quicker access to educational resources than ever before. People can learn almost anything they like to learn by searching \u201Chow-to\u201D on social media like Youtube.</p>
<p>There are, however, some negative effects on society. Social media can produce fake news or other misleading contents like one-sided story, biased opinion, filtered pictures. In addition, social media can be addictive and a source of distraction. Spending too much time on social media may not only reduce our productivity but also weaken our ability to appreciate the art of face-to-face communication. </p></dd></dl></details></details>
<details><summary><strong>15. Life Issues</strong></summary>
<br>
<details><summary>(1) Vocabulary</summary>
<dl><dt>mean</dt><dd>- unwilling to give or share things</dd><dt>embody</dt><dd>- give tangible form to</dd><dt>at one&#39;s disposal</dt><dd>- available for one to use whenever or however one wishes</dd><dt>tote</dt><dd>- carry something heavy</dd><dt>dispatch</dt><dd>-  send off to a destination or for a purpose</dd><dt>the brink of despair</dt><dd>- the edge of despair</dd><dt>speculation on</dt><dd>- guess on, gambling on</dd><dt>flat out with work</dt><dd>- overworked</dd><dt>plea</dt><dd>- begging for help</dd><dt>viciously</dt><dd>- in a cruel and violent manner</dd><dt>stitch</dt><dd></dd></dl></details>
<details><summary>(2) Speaking</summary>
<dl><dt>When life&#39;s problems seem overwhelming, look around and see what other people are dealing with. You might just consider yourself fortunate.</dt><dd><p>I agree with this statement. Life is not easy and it is not easy for everybody. So, when we are frustrated by life issues, we do not have to feel like it is the end of the day. For one reason, we might not be the one who live the most miserable in this world. Take my friend for example. He he failed to pass his qualification examination and thus felt depressed. But when he went back to his hometown and saw that his child friend was suffering from cancer, he suddenly realised that he was so lucky. At least, he still had a dream for tomorrow. </p>
<p>For another reason, no problem is unsolvable. We can take a positive approach and see what we can do to solve the problem. By learning to solve problems, we can learn new life skills and improve to be more indomitable. </p>
<p>Lastly, even if the problem we have is deadly, we still can choose to face it with smile. You may ask how we can keep smiling while we are going to die? It is because the meaning of death is that we will have no problem any more.</p></dd></dl></details>
<details><summary>(3) Writing</summary>
<dl><dt>My anger issues almost screwed up my life.</dt><dd><p>Anger is a natural response to threat, danger or other unpleasant stimuli. However, it could become a problem if you have trouble in controlling your anger. Anger can cause you to say or do things you regret. It is not rare that young couple got divorced because the husband lost temper and slapped his wife.</p>
<p>Anger issues can be caused by many things \u2014 too much stress, life issues, family strife, unfair treatment, and more. When faced with these aggravating situations, there are some tactics that help you to manage your anger. A first tactic is to take deep breaths and count to ten before you say a word. Breathing in fresh air can help to reduce the intensity of your anger. A second tactic is to walk away from the situation and have a brisk walk around the block. This can give you time and space to think and calm down. When having a heating argument, it is helpful to just listen to what others have to say instead of jumping into a conclusion that will get yourself irritated. If you are in a stressful situation, you can distract yourself from anger by taking a shower, seeing a film, or doing something you like to do. In addition, engaging in exercises or sports can help consume some of the energy that may otherwise have escalated into open aggression. Last but not least, when you are frustrated by life problems, you can focus on solutions so as to avoid being trapped by negative mood.</p></dd></dl></details></details>
<details><summary><strong>16. Persuasion at the Workplace</strong></summary>
<br>
<details><summary>(1) Vocabulary</summary>
<dl><dt>coax</dt><dd>- gently and persistently persuade someone to do something</dd><dt>nudge</dt><dd></dd><dt>prod</dt><dd></dd><dt>badger</dt><dd></dd><dt>coercion</dt><dd></dd><dt>extortion</dt><dd>- the practice of obtaining something through force or threat</dd><dt>peculiar</dt><dd>- different to what is normal or expected, strange</dd><dt>force something down one&#39;s throat</dt><dd>- to force someone to accept</dd><dt>jump ship</dt><dd>- move on to other companies</dd><dt>a drop in the ocean</dt><dd>- grossly inadequate</dd><dt>twist someone&#39;s arm</dt><dd>make it difficult for someone to turn down</dd><dt>bend over backwards</dt><dd>- make extra effort</dd><dt>turn up the heat</dt><dd>- to pressure</dd></dl></details>
<details><summary>(2) Speaking</summary>
<dl><dt>Talk about a time when you used a persuasion tactic effectively. How do you feel about it? What do you think are some bad persuasion methods? What makes them bad?</dt><dd><p>My company invetested considerable resources into branding and marketing. However, the sales did not increase as expected. I believed that the sales would be improved if we could upskill our sales associates. I thus decided to persuade the management team to run a training program for the front-line sales staff. </p>
<p>You know, it was not easy to convince the management as they had a number of concerns about the training program. Some questioned the usefulness of training. Others feared that it might not be able to arrange sales associates to attend training session that would last 2-3 hours per day. Still others worried that the employees might think they are more employable and jump ship after training.</p>
<p>To clear their concerns, I did a field research and wrote up a proposal based on the research finding. I showed to the management that the branding effort was successful because the number of daily walk-in customers had increased significantly. The reason why sales revenue remained stagnant was because the front-line workers were lack of selling skills and product knowledge and thus unable to convert walk-in customers into actual buyers. To have better sales performance, it was necessary to fill up this competency gap.</p>
<p>In order to show how much difference a training program could make, I divided the employees into two groups and compared the sales performance of the well-trained group with that of the un-trained group. After that, I suggested to take a bite-sized approach to organize the training sessions, so that the schedule of training sessions would not affect the daily operation of retail outlets.</p>
<p>By appealing to the power of information and logic, I finally twisted the management\u2019s arm. I felt so happy when the management approved my proposal in the end.</p></dd></dl></details></details>
<details><summary><strong>17. Health and Fitness</strong></summary>
<br>
<details><summary>(1) Vocabulary</summary>
<dl><dt>lethal</dt><dd>- deadly</dd><dt>postinfarction</dt><dd></dd><dt>angina</dt><dd>- severe pain</dd><dt>dilation</dt><dd>- enlarge, spread out</dd><dt>tonality</dt><dd>- musical key</dd><dt>workout</dt><dd></dd><dt>inter-murals</dt><dd></dd><dt>call it a day</dt><dd>- enough for today, can stop work and go home</dd><dt>outright</dt><dd></dd><dt>in reserve</dt><dd>- being a replacement</dd><dt>clutch at straws</dt><dd></dd><dt>have chance to show your stuff</dt><dd></dd><dt>count on someone</dt><dd></dd><dt>break someone in</dt><dd></dd><dt>leave a big hole in...</dt><dd></dd><dt>sleep on it</dt><dd></dd><dt>make a deal</dt><dd></dd><dt>tub bathing</dt><dd></dd><dt>preventative effect</dt><dd></dd></dl></details>
<details><summary>(2) Speaking</summary>
<dl><dt>Discuss the following questions:
<ul><li>Do you think it\u2019s ok to eat lots of chocolate? Why or why not?<br></li>
<li>In your opinion, why do people love eating chocolates?<br></li>
<li>What\u2019s your favourite chocolate brand? Why do you like it?<br></li></ul>
</dt><dd><p>I think it\u2019s ok to take chocolate regularly because chocolate is found to have a range of health effects. A study  suggested that regular consumption of chocolate may support cardiovascular health by  lowering cholesterol and improving blood pressure. Another study confirmed that chocolate can induce positive effects on blood flow, and thus able to help keep brain healthy and reduce memory decline. There is also evidence that consuming chocolate can help lower the risk of developing heart disease. </p>
<p>However, it is not recommended to eat too much chocolate. Too much chocolate consumption, according to a scientific research, may increase the risk of kidney stones and diabetes which later causes obesity. In addition, eating too much chocolate may have negative digestive side effects.</p>
<p>In my opinion, people love eating chocolate for a number of reasons. First, chocolate can stimulate feelings of pleasure when it melts on your tongue. Chocolate lovers often describe this sensation of smoothness as \u201Ca true moment of ecstasy\u201D. Second, chocolate contains a number of interesting psychoactive chemicals, which can improve your mood. Actually, many chocolate lovers consider chocolate as a comfort food and eat it as a mood booster. Third, chocolate is associated with love and romance. Women are habitually given chocolate as birthday and Valentines day presents. Chocolate makes women feel loved, cared for, and pampered. This could explain why women love chocolate more often than men do. </p>
<p>The chocolate brand I like most is Dove. I like it because it tasteful. It is sweet but not that sweet. When it melts in your mouth, it gives a thick taste of chocolate instantly. And, the feeling of smoothness is really subtle and exhilarating. I like it also because it is made of dark chocolate, which is considered as less sugar and more healthy.</p>
  </dd><dt>The greatest wealth is health.</dt><dd>I totally agree with this statement. First of all, healthy people will save a lot of money on medical expenses. On the contrary, the people who are not healthy will have to spend their hard-earned money on seeing doctor or having medical treatment. Secondly, people in good health condition are able to stay productive for longer time than those who are not good in health condition. Therefore, it is not surprising that healthier people can earn more as well. Moreover, healthy people can live longer and thus able to keep earning money as long as they would like to. In addition, when people have a higher level of well-being, they are likely to have a can-do attitude, which will enable them to succeed in what they are aspired to do. To conclude, health will make your life wealthier and more cheerful. Let&#39;s make some change and live a healthier life style.
</dd></dl></details>
<details><summary>(3) Writing</summary>
<dl><dt>Write 100 words about how you can lead a healthy lifestyle.</dt><dd><p>Life is beautiful. If you want to enjoy the happy life, you must manage your lifestyle so as to stay healthy. Here are some ways I employ to maintain physical and mental well-being.</p>
<p>A good way to maintain physical wellbeing is to exercise regularly. You can choose walking over transportation for close distance, or climb stairs instead of taking the lift. You can also choose to join a dance class, or pick a sport of your liking. If you prefer to pick exercise, it is advisable to pick the activities that can work out different part of your body. Swimming, tennis, badminton, yoga are some of the good activities that you can get a good body workout.</p>
<p>Balanced diet is another way to maintain physical well-being. It is not advisable to consume junk food and processed food all the time. Eat fresh and different-coloured fruits and vegetables instead. In contrast to junk food, which often carries lots of calories and fats, fruits and vegetables provide more fibre, minerals, and vitamins. In addition to types of food, it is also important to take food in moderate amount. Do not eat excessive amount of food even if the food is tasteful and healthy in terms of nutrition.</p>
<p>In addition to physical well-being, maintaining mental health is equally important. The best-recommended way to maintain mental health is by staying positive. To stay positive, you need to purge negativity from yourself by looking for the bright side of things and focusing on solutions to problems. To avoid being influenced, you also need to purge negative people from your life.</p></dd></dl></details></details>
<details><summary><strong>18. Handling Internet Security</strong></summary>
<br>
<details><summary>(1) Vocabulary</summary>
<dl><dt>swipe-card system</dt><dd>- a device used for swiping card</dd><dt>stalk</dt><dd>- pursue or approach stealthily</dd><dt>pitfall</dt><dd>- drawbacks</dd><dt>peril</dt><dd>- (n) serious and immediate danger; (v) expose to danger</dd><dt>vandalism</dt><dd>- action involving deliberate destruction of or damage to public or private property</dd><dt>surveillance camera</dt><dd>- a camera used for close observation</dd></dl></details>
<details><summary>(2) Speaking</summary>
<dl><dt>With a partner, ask and answer these three questions.
<ul><li>Do you think installing a surveillance system is a good or bad idea?  </li>
   <li>Give a good reason for your answer. </li>
   <li>What surveillance system are there in your place of work? </li></ul>
  </dt><dd>I think it is a good idea to install a surveillance system at workplace because it provides a reliable and convenient way to curb crimes, protect employees, and improve productivity at workplace.
<p>In my company, there are three types of surveillance systems. There is CCTV in the main office, warehouse, and retail outlets. There is also a card-swipe machine for controlling access to the office. GPS is installed to monitor the movements of vehicles.</p></dd></dl></details>
<details><summary>(3) Writing</summary>
<dl><dt>Write 100 words about how you can lead a healthy lifestyle.</dt><dd>Life is full of joy. If you want to enjoy the happy life, you must be able to manage your lifestyle in order to stay healthy. Here are some ways I employ to maintain physical and mental well-being.
<p>A good way to maintain physical wellbeing is to exercise regularly. You can choose walking over transportation for close distance, or climb stairs instead of taking the lift. You can also choose to join a dance class, or pick a sport of your liking. If you prefer to pick exercise, it is advisable to pick the activities that can work out different part of your body. Swimming, tennis, badminton, yoga are some of the good activities that you can get a good body workout.</p>
<p>Balanced diet is another way to maintain physical well-being. It is not advisable to consume junk food and processed food all the time. Eat fresh and different-coloured fruits and vegetables instead. In contrast to junk food, which often carries lots of calories and fats, fruits and vegetables provide more fibre, minerals, and vitamins. In addition to types of food, it is also important to take food in moderate amount. Do not eat excessive amount of food even if the food is tasteful and healthy in terms of nutrition.</p>
<p>In addition to physical well-being, maintaining mental health is equally important. The best-recommended way to maintain mental health is by staying positive. To stay positive, you need to purge negativity from yourself by looking for the bright side of things and focusing on solutions to problems. To avoid being influenced, you also need to purge negative people from your life.</p></dd></dl></details></details>
<details><summary><strong>19. Thinking about the Future</strong></summary>
<br>
<details><summary>(1) Vocabulary</summary>
<dl><dt>to come under fire</dt><dd>- to be criticised strongly</dd><dt>backlash</dt><dd>- a strong negative reaction by a large number of people</dd><dt>compost</dt><dd>- decayed organic material used as a fertilizer for growing plants </dd><dt>to operate with a veil of secrecy</dt><dd>- to do things with no transparency</dd><dt>take matters into one&#39;s own hand</dt><dd>- to deal with problems yourself after others have failed to do so</dd><dt>the lion&#39;s share</dt><dd>- the largest part of something </dd><dt>false modesty</dt><dd></dd><dt>beat your own drum</dt><dd>- say something good about yourself</dd><dt>imperative</dt><dd>- essential or urgent things</dd><dt>take a proactive approach</dt><dd></dd><dt>develop trusting relationship</dt><dd></dd></dl></details>
<details><summary>(2) Speaking</summary>
<dl><dt>In your opinion, what other jobs will become more popular in the future? Why?</dt><dd>In my opinion, with the development of technology, it is predictable that the jobs related to workplace automation and human development will become more popular in the future. Software developers, for example, will be in demand because automation devices all need softwares to function. Cyber security engineers will be in high demand also because businesses will need them to provide sophisticated protection for the data that is vital to the success of business in future. With mundane and repetitive job being taken over by robots, people would have more time and resources to develop themselves. Therefore, it is quite likely that human development jobs such as teacher, trainer, counsellor, mental therapist, artist, and the like will be in high demand also.
</dd><dt>If your current job is not line with trends, will you change it? Why or why not?</dt><dd>My current job is not line with this trend, but I will not change my job. One reason is that I have worked on this position for many years and become seasoned. If I change to other trendy job, the experience I accumulated on my current job will become useless. And, it is not easy to make a mid-career change. Another reason is that I am well-paid on my current position. I am afraid that I won&#39;t be able to earn a decent pay if I change to other job and start from entry-level. Nevertheless, I still need to upskill myself so that I can adapt to the latest technology changes at workplace.
</dd><dt>What do you think is the most competitive field or industry to work in? Why?</dt><dd>I think cybersecurity will be the most competitive field to work in. This is because collecting, sharing, and using data will become dominant part of business practices. To protect the critical systems and sensitive data from digital attacks, businesses will have to invest more in cybersecurity. 
</dd></dl></details>
<details><summary>(3) Writing</summary>
<dl><dt>Discuss the life issue: My future starts when I wake up every morning... Every day I find something  creative to do with my life.</dt><dd><p>I believe this quote is talking about the importance of being creative. It tells us that each day can be another chance to be creative. And, if we do something special in every single day, our lives can become pleasant and fulfilling. </p>
<p>When we think of creativity, we tend to relate it to artists, scientists, or somebody great. But actually, every one of us can be creative and we can be creative in everthing we do.  Take daily routines for example. In our daily life, we often find it easy to fall into rut as our days are filled with unvaried routines and repetitive tasks.  We can take a break and think about what we are doing. Can we do it in another way?  Is there a way to do it that would be more fun or more effective? By seeing the tasks in different ways, we can break routines and perk our lives up.</p>
<p>We can also express our creativity when we are faced with problems. Many years ago when my wife gave birth to my first son, I was forced to reorder my daily routines. At first, I was perturbed that my smooth routine was uprooted. But I soon found the change refreshing. I discovered the places where I was wasting time. I started to get my work done earlier in the evening so that I can find more time in the morning to cook for my wife. I got a strong sense of efficacy when I found that I could solve the problem by managing time more efficiently.</p>
<p>To conclude, creativity is an integral part of life. We can have a creative life as long as you are willing to challenge your old beliefs and habits about how things should be done, and look at them from different perspective.</p></dd></dl></details></details>
<details><summary><strong>20. The News</strong></summary>
<br>
<details><summary>(1) Vocabulry</summary>
<dl><dt>anachronism</dt><dd>- out of date</dd><dt>play havoc with</dt><dd>- completely disrupt</dd><dt>standstill</dt><dd>- a situation in which there is no movement at all</dd><dt>suspended until further notice</dt><dd></dd><dt>inconceivable</dt><dd>- not capable of being imagined</dd><dt>sumo</dt><dd>- Japanese style of wrestle</dd><dt>behind closed doors</dt><dd>- taking place without anyone watching</dd><dt>tournament</dt><dd>- a series of contests between a number of competitors, who compete for an overall prize</dd><dt>do the time</dt><dd>- put into jail</dd><dt>on the run</dt><dd>- escape</dd><dt>whereabouts</dt><dd>- the place where someone or something is</dd><dt>convict</dt><dd>- a person found guilty of a crime offence</dd><dt>turn a blind eye to</dt>- <dd></dd><dt>lock up ... and throw away the key</dt><dd>- </dd><dt>misdemeanor</dt><dd>- a minor wrongdoing</dd></dl></details>
<details><summary>(2)Speaking</summary>
<dl><dt>Have you ever done something similar to these Cuban doctors of your own free will? Why did you want to do this?</dt><dd>Yes. Many years ago, I had volunteered to teach in a rural area for 1 year. The reason I was willing to do this was because I thought it was meaningful to help the children lived in rural area where was lack of access to education resources.
</dd><dt>Do you think your country has a high doctor-to-patient ratio? What about the teacher-to-student ratio? </dt><dd>According to statistics, the doctor-to-patient ratio is high in Singapore. For every doctor there are 399 patients. And the teacher-to-student ratio is also high in Singapore. For every teacher there are 15 primary students, 12 secondary students, and 11 Junior college students.
</dd><dt>Describe a time in your life when you could say &#39;Every cloud has a silver lining&#39;.</dt><dd>In January 2020, my friend and I booked a flight to Wuhan. Unfortunately I missed the flight because I waked up too late on the day. But every cloud has a silver lining. Because I missed the flight, I did not have to be quarantined in Wuhan where was locked down due to the outbreak of Covid-19.
</dd></dl></details></details>`
      })}`;
    });
  }
});

// .svelte-kit/output/server/chunks/magic-formula-c9a80b47.js
var magic_formula_c9a80b47_exports = {};
__export(magic_formula_c9a80b47_exports, {
  default: () => Magic_formula,
  metadata: () => metadata8
});
var metadata8, Magic_formula;
var init_magic_formula_c9a80b47 = __esm({
  ".svelte-kit/output/server/chunks/magic-formula-c9a80b47.js"() {
    init_shims();
    init_app_e9883c9f();
    init_post_cf056f7f();
    init_date_655861b7();
    init_Calendar_b6d818aa();
    metadata8 = {
      "title": "\u6210\u529F\u7684\u8981\u7D20",
      "date": "2021-11-04T00:00:00.000Z",
      "tags": ["\u505A\u4E8B", "\u65B9\u6CD5"]
    };
    Magic_formula = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign($$props, metadata8), {}, {
        default: () => `<p>\u4E8B\u4E1A\u6210\u5C31\u7684\u4E09\u4E2A\u8981\u7D20\uFF1A</p>
<ul><li>\u7528\u529B (work hard)\uFF1A\u628A\u8BE5\u505A\u7684\u4E8B\u60C5\uFF0C\u54EA\u6015\u662F\u4E0D\u60F3\u505A\u7684\u4E8B\u60C5\uFF0C\u90FD\u505A\u4E86\u3002</li>
<li>\u7528\u8111 (work smart)\uFF1A\u4E0D\u65AD\u5730\u4ECE\u6BCF\u4E00\u4E2A\u5C0F\u7684\u6210\u529F\u6216\u5931\u8D25\u4E2D\u5B66\u4E60\u3002</li>
<li>\u7528\u65F6 (stay long)\uFF1A\u575A\u6301\u505A\u8DB3\u591F\u957F\u7684\u65F6\u95F4\u3002</li></ul>
<p>\u6210\u5C31 = \u7528\u529B x \u7528\u8111 x \u7528\u65F6</p>`
      })}`;
    });
  }
});

// .svelte-kit/output/server/chunks/nine-events-of-instruction-33f1ebcf.js
var nine_events_of_instruction_33f1ebcf_exports = {};
__export(nine_events_of_instruction_33f1ebcf_exports, {
  default: () => Nine_events_of_instruction,
  metadata: () => metadata9
});
var css4, metadata9, Nine_events_of_instruction;
var init_nine_events_of_instruction_33f1ebcf = __esm({
  ".svelte-kit/output/server/chunks/nine-events-of-instruction-33f1ebcf.js"() {
    init_shims();
    init_app_e9883c9f();
    init_post_cf056f7f();
    init_date_655861b7();
    init_Calendar_b6d818aa();
    css4 = {
      code: "table.svelte-5l9rdt,td.svelte-5l9rdt,th.svelte-5l9rdt{border:1px solid rgba(55, 65, 81, var(--tw-text-opacity))}td.svelte-5l9rdt,th.svelte-5l9rdt{padding:0.5rem}",
      map: null
    };
    metadata9 = {
      "title": "\u4E5D\u6B65\u6559\u5B66\u6CD5",
      "date": "2021-10-10",
      "tags": ["\u6559\u5B66\u8BBE\u8BA1", "\u57F9\u8BAD", "\u5B66\u4E60"],
      "draft": false
    };
    Nine_events_of_instruction = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      $$result.css.add(css4);
      return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign($$props, metadata9), {}, {
        default: () => `<h4>\u6559\u5B66\u8BBE\u8BA1\u7684\u4E5D\u6B65\u6A21\u578B</h4>
<p>\u7F8E\u56FD\u6559\u80B2\u5FC3\u7406\u5B66\u5BB6\u52A0\u6D85<a href="${"https://en.wikipedia.org/wiki/Robert_M._Gagn%C3%A9"}" target="${"_blank"}">\uFF08Robert Gagne\uFF09</a>\u63D0\u51FA\u4E86\u4E00\u4E2A\u4E5D\u6B65\u6559\u5B66\u6A21\u578B\u3002\u6839\u636E\u8FD9\u4E2A\u6A21\u578B\uFF0C\u4E00\u4E2A\u5B8C\u6574\u7684\u6559\u5B66\u8FC7\u7A0B\u5E94\u5305\u542B\u4EE5\u4E0B\u4E5D\u4E2A\u73AF\u8282\u3002</p>
<ol><li>\u96C6\u4E2D\u5B66\u5458\u6CE8\u610F\u529B</li>
<li>\u544A\u77E5\u5B66\u4E60\u76EE\u6807</li>
<li>\u56DE\u987E\u524D\u7F6E\u77E5\u8BC6</li>
<li>\u5448\u73B0\u5B66\u4E60\u6750\u6599</li>
<li>\u63D0\u4F9B\u5B66\u4E60\u6307\u5BFC</li>
<li>\u5F15\u5BFC\u7EC3\u4E60</li>
<li>\u7ED9\u4E88\u53CD\u9988</li>
<li>\u8FDB\u884C\u8BC4\u4F30</li>
<li>\u6D88\u5316\u5438\u6536\u548C\u878D\u4F1A\u8D2F\u901A</li></ol>
<h4>\u5B66\u4E60\u6761\u4EF6\u7406\u8BBA</h4>
<p>\u8FD9\u4E2A\u6A21\u578B\u662F\u57FA\u4E8E\u52A0\u6D85\u7684\u5B66\u4E60\u6761\u4EF6\u7406\u8BBA<a href="${"https://en.wikipedia.org/wiki/Conditions_of_Learning"}">\uFF08conditions of learning\uFF09</a>\u63D0\u51FA\u7684\u3002\u52A0\u6D85\u8BA4\u4E3A\uFF0C\u5B66\u4E60\u662F\u4E00\u4E2A\u5BF9\u4FE1\u606F\u8FDB\u884C\u5904\u7406\u7684\u8FC7\u7A0B\uFF0C\u800C\u6559\u5B66\u5219\u662F\u4E3A\u5B66\u4E60\u7684\u53D1\u751F\u521B\u9020\u5FC5\u8981\u7684\u6761\u4EF6\u3002</p>
<table class="${"w-full md:w-1/2 text-center svelte-5l9rdt"}"><caption>\u6559\u5B66\u73AF\u8282\u4E0E\u5B66\u4E60\u8FC7\u7A0B</caption>
  <tr><th class="${"svelte-5l9rdt"}">\u6B65\u9AA4</th>
    <th class="${"svelte-5l9rdt"}">\u6559\u5B66\u73AF\u8282</th>
    <th class="${"svelte-5l9rdt"}">\u5B66\u4E60\u8FC7\u7A0B</th></tr>
  <tr><td class="${"svelte-5l9rdt"}">1</td>
    <td class="${"svelte-5l9rdt"}">\u5438\u5F15\u6CE8\u610F\u529B</td>
    <td class="${"svelte-5l9rdt"}">\u63A5\u6536</td></tr>
  <tr><td class="${"svelte-5l9rdt"}">2</td>
    <td class="${"svelte-5l9rdt"}">\u544A\u77E5\u5B66\u4E60\u76EE\u6807</td>
    <td class="${"svelte-5l9rdt"}">\u9884\u671F</td></tr>
   <tr><td class="${"svelte-5l9rdt"}">3</td>
    <td class="${"svelte-5l9rdt"}">\u56DE\u987E\u524D\u7F6E\u77E5\u8BC6</td>
    <td class="${"svelte-5l9rdt"}">\u68C0\u7D22</td></tr>
   <tr><td class="${"svelte-5l9rdt"}">4</td>
    <td class="${"svelte-5l9rdt"}">\u5448\u73B0\u5B66\u4E60\u6750\u6599</td>
    <td class="${"svelte-5l9rdt"}">\u9009\u62E9\u6027\u8BA4\u77E5</td></tr>
   <tr><td class="${"svelte-5l9rdt"}">5</td>
    <td class="${"svelte-5l9rdt"}">\u63D0\u4F9B\u5B66\u4E60\u6307\u5BFC</td>
    <td class="${"svelte-5l9rdt"}">\u8BED\u4E49\u7F16\u7801</td></tr>
   <tr><td class="${"svelte-5l9rdt"}">6</td>
    <td class="${"svelte-5l9rdt"}">\u5F15\u5BFC\u7EC3\u4E60</td>
    <td class="${"svelte-5l9rdt"}">\u56DE\u5E94</td></tr>
   <tr><td class="${"svelte-5l9rdt"}">7</td>
    <td class="${"svelte-5l9rdt"}">\u7ED9\u4E88\u53CD\u9988</td>
    <td class="${"svelte-5l9rdt"}">\u5F3A\u5316</td></tr>
   <tr><td class="${"svelte-5l9rdt"}">8</td>
    <td class="${"svelte-5l9rdt"}">\u8FDB\u884C\u8BC4\u4F30</td>
    <td class="${"svelte-5l9rdt"}">\u68C0\u7D22</td></tr>
   <tr><td class="${"svelte-5l9rdt"}">9</td>
    <td class="${"svelte-5l9rdt"}">\u5F3A\u5316\u5438\u6536\u548C\u8F6C\u5316</td>
    <td class="${"svelte-5l9rdt"}">\u6CDB\u5316</td></tr></table>
<p>\u8FD9\u91CC\u6709\u51E0\u4E2A\u8BA4\u77E5\u5FC3\u7406\u5B66\u672F\u8BED\u9700\u8981\u89E3\u91CA\u4E00\u4E0B\u3002</p>
<ul><li>\u63A5\u6536\uFF1A\u8FDB\u5165\u63A5\u6536\u65B0\u4FE1\u606F\u7684\u72B6\u6001\u3002</li>
<li>\u9884\u671F\uFF1A\u5BF9\u5B66\u4E60\u4EA7\u751F\u671F\u5F85\u3002</li>
<li>\u9009\u62E9\u6027\u8BA4\u77E5\uFF1A\u5B66\u5458\u57FA\u4E8E\u81EA\u5DF1\u5DF2\u6709\u7684\u77E5\u8BC6\u548C\u7ECF\u9A8C\u5BF9\u65B0\u63A5\u53D7\u7684\u4FE1\u606F\u5185\u5BB9\u8FDB\u884C\u89E3\u8BFB\u6216\u7406\u89E3\u3002</li>
<li>\u8BED\u4E49\u7F16\u7801\uFF1A\u5B66\u5458\u901A\u8FC7\u8BCD\u8BED\u5BF9\u4FE1\u606F\u8FDB\u884C\u52A0\u5DE5\uFF0C\u628A\u4FE1\u606F\u6750\u6599\u7528\u81EA\u5DF1\u7684\u8BED\u8A00\u5F62\u5F0F\u52A0\u4EE5\u7EC4\u7EC7\u548C\u6982\u62EC\uFF0C\u627E\u51FA\u6750\u6599\u7684\u57FA\u672C\u8BBA\u70B9\u3001\u8BBA\u636E\u3001\u903B\u8F91\u7ED3\u6784\uFF0C\u6309\u8BED\u4E49\u7279\u5F81\u5B58\u5165\u8BB0\u5FC6\u3002\u8FD9\u662F\u957F\u65F6\u8BB0\u5FC6\u7684\u4E3B\u8981\u4FE1\u606F\u8D2E\u5B58\u65B9\u5F0F\u3002</li>
<li>\u56DE\u5E94\uFF1A\u5728\u523A\u6FC0\u548C\u53CD\u5E94\u4E4B\u95F4\u5EFA\u7ACB\u8054\u7CFB\u3002</li>
<li>\u5F3A\u5316\uFF1A\u77EB\u6B63\u3001\u5F3A\u5316\u523A\u6FC0\u548C\u53CD\u5E94\u4E4B\u95F4\u7684\u8054\u7CFB\u3002</li>
<li>\u68C0\u7D22\uFF1A\u56DE\u5FC6\u50A8\u5B58\u5728\u5927\u8111\u91CC\u7684\u77E5\u8BC6\u3002</li>
<li>\u6CDB\u5316\uFF1A\u6982\u62EC\u3001\u5F52\u7EB3\u3001\u77E5\u8BC6\u7684\u6269\u5C55\u8FD0\u7528\u3002</li></ul>
<h4>\u6559\u5B66\u7684\u65B9\u6CD5</h4>
<p>\u5177\u4F53\u5230\u5B9E\u64CD\u662F\u8FD9\u6837\u7684\u3002</p>
<h6>\u96C6\u4E2D\u5B66\u751F\u6CE8\u610F\u529B\u7684\u65B9\u6CD5</h6>
<ol><li>\u4EE5\u65B0\u5947\u548C\u610F\u5916\u523A\u6FC0\u5B66\u751F</li>
<li>\u63D0\u51FA\u80FD\u6FC0\u53D1\u5B66\u5458\u601D\u8003\u7684\u95EE\u9898</li>
<li>\u8BA9\u5B66\u5458\u63D0\u51FA\u7591\u95EE\uFF0C\u7531\u5176\u4ED6\u5B66\u5458\u56DE\u7B54</li>
<li>\u63D0\u51FA\u4E00\u4E2A\u5F15\u4EBA\u5165\u80DC\u3001\u6709\u5F85\u89E3\u51B3\u7684\u95EE\u9898</li>
<li>\u63D0\u51FA\u4E00\u4E2A\u65B0\u5947\u3001\u6709\u610F\u601D\u7684\u60C5\u666F\u6765\u6FC0\u53D1\u597D\u5947\u5FC3</li>
<li>\u63D0\u51FA\u4E00\u4E2A\u6709\u610F\u4E49\u7684\u3001\u8DDF\u5B66\u4E60\u4E3B\u9898\u76F8\u5173\u7684\u3001\u5BCC\u6709\u6311\u6218\u6027\u7684\u96BE\u9898</li></ol>
<h6>\u544A\u77E5\u5B66\u4E60\u76EE\u6807</h6>
<ol><li>\u63CF\u8FF0\u5B66\u4E60\u7ED3\u675F\u4E4B\u540E\u5B66\u5458\u5C06\u4F1A\u505A\u4EC0\u4E48</li>
<li>\u63CF\u8FF0\u5BF9\u5B66\u5458\u7684\u6210\u7EE9\u8981\u6C42</li>
<li>\u63CF\u8FF0\u5B66\u5458\u9700\u8981\u8FBE\u5230\u7684\u6210\u7EE9\u6807\u51C6</li>
<li>\u89E3\u91CA\u5B66\u4E60\u5C06\u5982\u4F55\u5E2E\u52A9\u5B66\u5458\u8FBE\u5230\u8981\u6C42</li></ol>
<h6>\u56DE\u987E\u524D\u7F6E\u77E5\u8BC6</h6>
<ol><li>\u8BE2\u95EE\u5B66\u5458\u662F\u5426\u6709\u4E0E\u8BDD\u9898\u76F8\u5173\u7684\u8FC7\u5F80\u7ECF\u9A8C</li>
<li>\u5C31\u5B66\u5458\u8FC7\u5F80\u7ECF\u9A8C\u63D0\u51FA\u95EE\u9898</li>
<li>\u63D0\u95EE\u4E0E\u524D\u7F6E\u77E5\u8BC6\u76F8\u5173\u7684\u6982\u5FF5</li>
<li>\u4E3E\u51FA\u4E00\u4E2A\u4E0E\u6240\u5B66\u5185\u5BB9\u76F8\u5173\u7684\u5B9E\u4F8B</li></ol>
<h6>\u5448\u73B0\u5B66\u4E60\u6750\u6599</h6>
<ol><li>\u4EE5\u5408\u4E4E\u903B\u8F91\u548C\u6613\u4E8E\u7406\u89E3\u7684\u65B9\u5F0F\u7EC4\u7EC7\u5B66\u4E60\u6750\u6599</li>
<li>\u4FE1\u606F\u91CF\u5927</li>
<li>\u4E3E\u51FA\u5B9E\u4F8B</li>
<li>\u8FD0\u7528\u591A\u79CD\u5448\u73B0\u624B\u6BB5\uFF08\u64AD\u653E\u89C6\u9891\u3001\u6F14\u793A\u3001\u8BB2\u89E3\u3001\u5206\u7EC4\u7B49\u7B49\uFF09</li>
<li>\u4F7F\u7528\u4E0D\u79CD\u683C\u5F0F\u5448\u73B0\uFF08\u6587\u5B57\u3001\u56FE\u5F62\u3001\u8868\u683C\u3001\u56FE\u7247\u3001\u58F0\u97F3\u3001\u6A21\u62DF\u7B49\u7B49\uFF09\u4EE5\u523A\u6FC0\u4E0D\u540C\u7684\u611F\u89C9\u5668\u5B98</li>
<li>\u4F7F\u7528\u591A\u79CD\u65B9\u6CD5\uFF08\u89C6\u89C9\u63D0\u793A\uFF0C\u53E3\u5934\u8BB2\u6388\uFF0C\u79EF\u6781\u5B66\u4E60\uFF09\u4EE5\u7167\u987E\u4E0D\u540C\u7684\u5B66\u4E60\u6A21\u5F0F</li></ol>
<h6>\u63D0\u4F9B\u5B66\u4E60\u6307\u5BFC</h6>
<ol><li>\u7528\u6982\u5FF5\u56FE\u8BF4\u660E\u6982\u5FF5\u7684\u76F8\u4E92\u5173\u7CFB</li>
<li>\u901A\u8FC7\u89D2\u8272\u626E\u6F14\u6765\u628A\u8FD0\u7528\u89C6\u89C9\u5316</li>
<li>\u4F7F\u7528\u8BB0\u5FC6\u6CD5\u6765\u63D0\u793A\u5B66\u4E60</li>
<li>\u901A\u8FC7\u4E2A\u6848\u7814\u7A76\u6765\u8FDB\u884C\u5B9E\u9645\u8FD0\u7528</li>
<li>\u8FD0\u7528\u56FE\u8868\u6765\u5EFA\u7ACB\u89C6\u89C9\u8054\u7CFB</li></ol>
<h6>\u5F15\u5BFC\u7EC3\u4E60</h6>
<ol><li>\u8981\u6C42\u5B66\u5458\u6F14\u793A\u6240\u5B66\u6280\u80FD</li>
<li>\u8981\u6C42\u5B66\u5458\u8FD0\u7528\u6240\u5B66\u77E5\u8BC6\u5B8C\u6210\u9898\u76EE</li>
<li>\u8981\u6C42\u5B66\u5458\u628A\u6240\u5B66\u5E94\u7528\u4E8E\u67D0\u4E00\u573A\u666F\u6216\u4E2A\u6848</li>
<li>\u63D0\u95EE\u8BA9\u5B66\u5458\u56DE\u7B54</li>
<li>\u8981\u6C42\u5B66\u5458\u6F14\u793A\u5982\u4F55\u5E94\u7528\u6240\u5B66\u89E3\u51B3\u95EE\u9898</li>
<li>\u8981\u6C42\u5B66\u5458\u5B8C\u6210\u89D2\u8272\u626E\u6F14</li></ol>
<h6>\u63D0\u4F9B\u53CD\u9988</h6>
<ol><li>\u4ECE\u6B63\u9762\u7ED9\u4E88\u53CD\u9988</li>
<li>\u53CD\u9988\u8981\u5BA2\u89C2</li>
<li>\u53CD\u9988\u8981\u9488\u5BF9\u5B66\u5458\u7684\u8868\u73B0\uFF0C\u5C31\u4E8B\u8BBA\u4E8B</li>
<li>\u53CD\u9988\u8981\u660E\u786E\u800C\u5177\u4F53</li>
<li>\u53CD\u9988\u8981\u96C6\u4E2D\u4E8E\u90A3\u4E9B\u53EF\u4EE5\u5B66\u5458\u5F97\u4EE5\u63D0\u9AD8\u7684\u65B9\u9762</li></ol>
<h6>\u8FDB\u884C\u8BC4\u4F30</h6>
<ol><li>\u7B14\u8BD5</li>
<li>\u95EE\u5377</li>
<li>\u5C0F\u8BBA\u6587</li>
<li>\u53E3\u8BD5</li>
<li>\u5176\u5B83\u65B9\u5F0F</li></ol>
<h6>\u6D88\u5316\u5438\u6536\u548C\u878D\u4F1A\u8D2F\u901A</h6>
<ol><li>\u8981\u6C42\u5B66\u5458\u6982\u8FF0\u5185\u5BB9</li>
<li>\u8981\u6C42\u5B66\u5458\u7ED9\u51FA\u5B9E\u4F8B</li>
<li>\u8981\u6C42\u5B66\u5458\u753B\u6982\u5FF5\u56FE</li>
<li>\u8981\u6C42\u5B66\u5458\u5217\u51FA\u63D0\u7EB2</li>
<li>\u8981\u6C42\u5B66\u5458\u5236\u4F5C\u5DE5\u4F5C\u6D41\u7A0B\u56FE</li>
<li>\u8981\u6C42\u5B66\u5458\u5236\u4F5C\u5176\u5B83\u53C2\u8003\u8D44\u6599</li></ol>`
      })}`;
    });
  }
});

// .svelte-kit/output/server/chunks/political-economy-0a4f3dc7.js
var political_economy_0a4f3dc7_exports = {};
__export(political_economy_0a4f3dc7_exports, {
  default: () => Political_economy,
  metadata: () => metadata10
});
var metadata10, Political_economy;
var init_political_economy_0a4f3dc7 = __esm({
  ".svelte-kit/output/server/chunks/political-economy-0a4f3dc7.js"() {
    init_shims();
    init_app_e9883c9f();
    init_post_cf056f7f();
    init_date_655861b7();
    init_Calendar_b6d818aa();
    metadata10 = {
      "title": "\u7B80\u660E\u653F\u6CBB\u7ECF\u6D4E\u5B66",
      "date": "2021-03-29",
      "tags": ["\u7F51\u7EDC\u6BB5\u5B50", "\u653F\u6CBB"],
      "draft": false
    };
    Political_economy = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign($$props, metadata10), {}, {
        default: () => `<p>\u95EE\uFF1A\u4EC0\u4E48\u662F\u7ECF\u6D4E\uFF1F<br>
\u7B54\uFF1A\u7ECF\u6D4E\u5C31\u662F\u505A\u86CB\u7CD5\u3002</p>
<p>\u95EE\uFF1A\u4EC0\u4E48\u662F\u653F\u6CBB\uFF1F<br>
\u7B54\uFF1A\u653F\u6CBB\u5C31\u662F\u5206\u86CB\u7CD5\u3002</p>
<p>\u95EE\uFF1A\u4EC0\u4E48\u662F\u5236\u5EA6\uFF1F<br>
\u7B54\uFF1A\u5236\u5EA6\u5C31\u662F\u89C4\u5B9A\u8C01\u5148\u62FF\uFF0C\u8C01\u540E\u62FF\uFF1B\u8C01\u62FF\u5F97\u591A\uFF0C\u8C01\u62FF\u5F97\u5C11\uFF1B\u8C01\u62FF\u5F97\u597D\uFF0C\u8C01\u62FF\u5F97\u5DEE\u3002</p>
<p>\u95EE\uFF1A\u600E\u6837\u7684\u5236\u5EA6\u624D\u7B97\u597D\u5236\u5EA6\uFF1F<br>
\u7B54\uFF1A\u8BA9\u5206\u86CB\u7CD5\u7684\u4EBA\u6700\u540E\u62FF\u86CB\u7CD5\u7684\u5236\u5EA6\u5C31\u662F\u597D\u5236\u5EA6\u3002</p>
<p>\u95EE\uFF1A\u90A3\u4EC0\u4E48\u662F\u574F\u5236\u5EA6\uFF1F<br>
\u7B54\uFF1A\u8BA9\u5206\u86CB\u7CD5\u7684\u4EBA\u5148\u62FF\u86CB\u7CD5\u7684\u5236\u5EA6\u5C31\u662F\u574F\u5236\u5EA6\u3002</p>
<p>\u95EE\uFF1A\u6700\u574F\u7684\u5236\u5EA6\u662F\u4EC0\u4E48\u6837\u7684\uFF1F<br>
\u7B54\uFF1A\u5206\u86CB\u7CD5\u7684\u4EBA\u5148\u62FF\u4E86\uFF0C\u591A\u62FF\u4E86\u591A\u5C11\u8FD8\u4E0D\u8BA9\u4EBA\u77E5\u9053\u3002</p>
<p>\u95EE\uFF1A\u4EC0\u4E48\u662F\u5BA3\u4F20\uFF1F <br>
\u7B54\uFF1A\u5BA3\u4F20\u5C31\u662F\u8BA9\u505A\u86CB\u7CD5\u7684\u611F\u8C22\u5206\u86CB\u7CD5\u7684\u3002</p>`
      })}`;
    });
  }
});

// .svelte-kit/output/server/chunks/xianxiafensibao-76c77a58.js
var xianxiafensibao_76c77a58_exports = {};
__export(xianxiafensibao_76c77a58_exports, {
  default: () => Xianxiafensibao,
  metadata: () => metadata11
});
var metadata11, Xianxiafensibao;
var init_xianxiafensibao_76c77a58 = __esm({
  ".svelte-kit/output/server/chunks/xianxiafensibao-76c77a58.js"() {
    init_shims();
    init_app_e9883c9f();
    init_post_cf056f7f();
    init_date_655861b7();
    init_Calendar_b6d818aa();
    metadata11 = {
      "title": "\u9C9C\u867E\u7C89\u4E1D\u7172",
      "date": "2021-04-02",
      "tags": ["\u6D77\u9C9C", "\u83DC\u8C31", "\u751F\u6D3B"],
      "draft": false
    };
    Xianxiafensibao = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign($$props, metadata11), {}, {
        default: () => `<p>\u4ECA\u5929\u662F Good Friday\u3002\u672C\u6765\u60F3\u53EB\u4E2A<a href="${"https://www.facebook.com/wahkungfu/"}" rel="${"nofollow"}">\u86D9\u529F\u592B</a>\u6253\u6253\u7259\u796D\uFF0C\u4E0D\u6599\u4EBA\u5BB6\u5E97\u5927\u6B3A\u5BA2\uFF0C\u516C\u5171\u5047\u671F\u4E0D\u9001\u9910\u3002\u4ECA\u5929\u5403\u4EC0\u4E48\u7684\u95EE\u9898\u4E00\u4E0B\u5B50\u5C31\u6446\u5230\u9762\u524D\u6765\u4E86\u3002</p>
<p>\u9999\u8FA3\u87F9\uFF1F\u4E0D\u9001\u9910\uFF0C\u4E0D\u80FD\u8003\u8651\uFF0C\u8FD8\u8981\u8D76\u5DE5\u5462\u3002</p>
<p>\u6E58\u83DC\u9986\uFF1F\u65B0\u83DC\u54C1\u5C11\uFF0C\u6709\u70B9\u5403\u817B\u4E86\u7684\u611F\u89C9\u3002</p>
<p>\u897F\u5B89\u70E4\u7F8A\uFF1F\u662F\u7F8E\u5473\uFF0C\u53EF\u662F\u6015\u4E0A\u706B\u3002</p>
<p>\u7B97\u4E86\uFF0C\u81EA\u5DF1\u52A8\u624B\uFF0C\u4E30\u8863\u8DB3\u98DF\u3002\u4E0D\u662F\u521A\u5B66\u4E86\u9C9C\u867E\u7C89\u4E1D\u7172\u7684\u505A\u6CD5\u5417\uFF1F\u5F04\uFF01</p>
<img src="${"/images/xianxia.jpg"}" alt="${"xianxia"}" loading="${"lazy"}" width="${"400"}" class="${"block mx-auto rounded w-full md:w-1/2 my-4"}">
<h4>\u98DF\u6750</h4>
<ul><li>\u9C9C\u867E10\u53EA</li>
<li>\u7C89\u4E1D\u4E24\u628A</li>
<li>\u8471\u3001\u59DC\u3001\u849C\u3001\u5C0F\u5C16\u6912</li>
<li>\u6599\u9152\u3001\u751F\u62BD\u3001\u732A\u6CB9</li></ul>
<h4>\u98DF\u6750\u5904\u7406</h4>
<ul><li>\u7C89\u4E1D\u7528\u51C9\u5F00\u6C34\u6D78\u6CE130\u5206\u949F</li>
<li>\u9C9C\u867E\u7528\u76D0\u548C\u6599\u9152\u814C\u523615\u5206\u949F</li>
<li>\u8471\u59DC\u849C\u6912\u5207\u672B\u5907\u7528</li></ul>
<h4>\u70F9\u5236</h4>
<ul><li>\u70ED\u9505\u51B7\u6CB9\u52A0\u5165\u8471\u767D\u3001\u59DC\u849C\u3001\u5C0F\u5C16\u6912\u7092\u9999</li>
<li>\u653E\u5165\u9C9C\u867E\u714E\u81F3\u516B\u6210\u719F\u53D6\u51FA\u5907\u7528</li>
<li>\u9505\u4E2D\u653E\u5165\u867E\u5934\uFF0C\u714E\u51FA\u867E\u818F\u540E\u52A0\u5165\u4E9B\u8BB8\u6E05\u6C34\u548C\u751F\u62BD</li>
<li>\u867E\u5934\u6C64\u505A\u597D\u540E\uFF0C\u653E\u5165\u7C89\u4E1D\uFF0C\u52A0\u76D0\u8C03\u5473</li>
<li>\u7C89\u4E1D\u716E\u81F3\u900F\u660E\u540E\u5012\u5165\u7802\u9505</li>
<li>\u5C06\u714E\u597D\u7684\u5927\u867E\u5168\u90E8\u653E\u5165\u7802\u9505</li>
<li>\u52A0\u5165\u4E00\u5C0F\u52FA\u732A\u6CB9\u4E2D\u706B\u71722\u5206\u949F</li>
<li>\u5173\u706B\uFF0C\u653E\u5165\u9752\u8471\u71161\u5206\u949F</li></ul>
<p>\u7AEF\u4E0A\u9910\u684C\uFF0C\u9999\u55B7\u55B7\uFF0C\u77AC\u95F4\u5C31\u55EF\uFF5E\uFF5E\uFF5E\u3002<span role="${"img"}" aria-label="${"Smile"}">\u{1F60D}</span></p>`
      })}`;
    });
  }
});

// .svelte-kit/output/server/chunks/index-f584a79d.js
var index_f584a79d_exports = {};
__export(index_f584a79d_exports, {
  default: () => Blog,
  load: () => load5
});
var allPosts, body2, load5, Blog;
var init_index_f584a79d = __esm({
  ".svelte-kit/output/server/chunks/index-f584a79d.js"() {
    init_shims();
    init_app_e9883c9f();
    init_date_655861b7();
    allPosts = { "./facilitation.md": () => Promise.resolve().then(() => (init_facilitation_fbc95f44(), facilitation_fbc95f44_exports)), "./independent-candidates.md": () => Promise.resolve().then(() => (init_independent_candidates_721687bf(), independent_candidates_721687bf_exports)), "./involve-and-layingflatism.md": () => Promise.resolve().then(() => (init_involve_and_layingflatism_5fe03fb7(), involve_and_layingflatism_5fe03fb7_exports)), "./learn-english-1.md": () => Promise.resolve().then(() => (init_learn_english_1_635252da(), learn_english_1_635252da_exports)), "./learn-english-2.md": () => Promise.resolve().then(() => (init_learn_english_2_1fe37b3a(), learn_english_2_1fe37b3a_exports)), "./magic-formula.md": () => Promise.resolve().then(() => (init_magic_formula_c9a80b47(), magic_formula_c9a80b47_exports)), "./nine-events-of-instruction.md": () => Promise.resolve().then(() => (init_nine_events_of_instruction_33f1ebcf(), nine_events_of_instruction_33f1ebcf_exports)), "./political-economy.md": () => Promise.resolve().then(() => (init_political_economy_0a4f3dc7(), political_economy_0a4f3dc7_exports)), "./xianxiafensibao.md": () => Promise.resolve().then(() => (init_xianxiafensibao_76c77a58(), xianxiafensibao_76c77a58_exports)) };
    body2 = [];
    for (let path in allPosts) {
      body2.push(allPosts[path]().then(({ metadata: metadata12 }) => {
        return { path, metadata: metadata12 };
      }));
    }
    load5 = async () => {
      const posts = await Promise.all(body2);
      return { props: { posts } };
    };
    Blog = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { posts } = $$props;
      const dateSortedPosts = posts.slice().sort((a, b) => {
        return Date.parse(b.metadata.date) - Date.parse(a.metadata.date);
      });
      if ($$props.posts === void 0 && $$bindings.posts && posts !== void 0)
        $$bindings.posts(posts);
      return `${$$result.head += `${$$result.title = `<title>Blog</title>`, ""}`, ""}

<h2>\u535A\u5BA2\u6587\u7AE0</h2>
<hr>

${each(dateSortedPosts, ({ path, metadata: { title, date, tags, draft } }) => `${!draft ? `<div class="${"mb-4"}"><span class="${"text-sm border-b border-gray-300 px-2 py-0.5 mb-3 min-w-max"}">${escape(formatDate(date))}</span> <br> <br>
    <a${add_attribute("href", `/blog/${path.replace(".md", "").replace(".svx", "")}`, 0)} class="${"text-md text-yellow-500 hover:text-yellow-300 text-left font-semibold mb-2"}">${escape(title)}</a>
    
    <div class="${"flex flex-wrap justify-start"}">${each(tags, (tag) => `<a sveltekit:prefetch class="${"mr-1.5 my-1 text-sm bg-gray-700 rounded text-gray-300 hover:text-gray-100"}" href="${"/tags/" + escape(tag)}"># ${escape(tag)}</a>`)}
        </div></div>
    <hr>` : ``}`)}`;
    });
  }
});

// .svelte-kit/output/server/chunks/_tag_-f69a6901.js
var tag_f69a6901_exports = {};
__export(tag_f69a6901_exports, {
  default: () => U5Btagu5D,
  load: () => load6
});
var TagMultiple, allPosts2, body3, load6, U5Btagu5D;
var init_tag_f69a6901 = __esm({
  ".svelte-kit/output/server/chunks/_tag_-f69a6901.js"() {
    init_shims();
    init_app_e9883c9f();
    TagMultiple = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { size = "1em" } = $$props;
      let { width = size } = $$props;
      let { height = size } = $$props;
      let { color = "currentColor" } = $$props;
      let { viewBox = "0 0 24 24" } = $$props;
      if ($$props.size === void 0 && $$bindings.size && size !== void 0)
        $$bindings.size(size);
      if ($$props.width === void 0 && $$bindings.width && width !== void 0)
        $$bindings.width(width);
      if ($$props.height === void 0 && $$bindings.height && height !== void 0)
        $$bindings.height(height);
      if ($$props.color === void 0 && $$bindings.color && color !== void 0)
        $$bindings.color(color);
      if ($$props.viewBox === void 0 && $$bindings.viewBox && viewBox !== void 0)
        $$bindings.viewBox(viewBox);
      return `<svg${add_attribute("width", width, 0)}${add_attribute("height", height, 0)}${add_attribute("viewBox", viewBox, 0)}><path d="${"M5.5,9A1.5,1.5 0 0,0 7,7.5A1.5,1.5 0 0,0 5.5,6A1.5,1.5 0 0,0 4,7.5A1.5,1.5 0 0,0 5.5,9M17.41,11.58C17.77,11.94 18,12.44 18,13C18,13.55 17.78,14.05 17.41,14.41L12.41,19.41C12.05,19.77 11.55,20 11,20C10.45,20 9.95,19.78 9.58,19.41L2.59,12.42C2.22,12.05 2,11.55 2,11V6C2,4.89 2.89,4 4,4H9C9.55,4 10.05,4.22 10.41,4.58L17.41,11.58M13.54,5.71L14.54,4.71L21.41,11.58C21.78,11.94 22,12.45 22,13C22,13.55 21.78,14.05 21.42,14.41L16.04,19.79L15.04,18.79L20.75,13L13.54,5.71Z"}"${add_attribute("fill", color, 0)}></path></svg>`;
    });
    allPosts2 = { "../blog/facilitation.md": () => Promise.resolve().then(() => (init_facilitation_fbc95f44(), facilitation_fbc95f44_exports)), "../blog/independent-candidates.md": () => Promise.resolve().then(() => (init_independent_candidates_721687bf(), independent_candidates_721687bf_exports)), "../blog/involve-and-layingflatism.md": () => Promise.resolve().then(() => (init_involve_and_layingflatism_5fe03fb7(), involve_and_layingflatism_5fe03fb7_exports)), "../blog/learn-english-1.md": () => Promise.resolve().then(() => (init_learn_english_1_635252da(), learn_english_1_635252da_exports)), "../blog/learn-english-2.md": () => Promise.resolve().then(() => (init_learn_english_2_1fe37b3a(), learn_english_2_1fe37b3a_exports)), "../blog/magic-formula.md": () => Promise.resolve().then(() => (init_magic_formula_c9a80b47(), magic_formula_c9a80b47_exports)), "../blog/nine-events-of-instruction.md": () => Promise.resolve().then(() => (init_nine_events_of_instruction_33f1ebcf(), nine_events_of_instruction_33f1ebcf_exports)), "../blog/political-economy.md": () => Promise.resolve().then(() => (init_political_economy_0a4f3dc7(), political_economy_0a4f3dc7_exports)), "../blog/xianxiafensibao.md": () => Promise.resolve().then(() => (init_xianxiafensibao_76c77a58(), xianxiafensibao_76c77a58_exports)) };
    body3 = [];
    for (let path in allPosts2) {
      body3.push(allPosts2[path]().then(({ metadata: metadata12 }) => {
        return { path, metadata: metadata12 };
      }));
    }
    load6 = async ({ page: page2 }) => {
      const posts = await Promise.all(body3);
      const tag = page2.params.tag;
      const filteredPosts = posts.filter((post) => {
        return post.metadata.tags.includes(tag);
      });
      return { props: { filteredPosts, tag } };
    };
    U5Btagu5D = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { filteredPosts } = $$props;
      let { tag } = $$props;
      let { size = "2.25em" } = $$props;
      if ($$props.filteredPosts === void 0 && $$bindings.filteredPosts && filteredPosts !== void 0)
        $$bindings.filteredPosts(filteredPosts);
      if ($$props.tag === void 0 && $$bindings.tag && tag !== void 0)
        $$bindings.tag(tag);
      if ($$props.size === void 0 && $$bindings.size && size !== void 0)
        $$bindings.size(size);
      return `${$$result.head += `${$$result.title = `<title>Posts under tag</title>`, ""}`, ""}

<div class="${"flex space-x-2"}">${validate_component(TagMultiple, "TagMultiple").$$render($$result, { size }, {}, {})} <h2>${escape(tag)}</h2></div>
<hr>
${each(filteredPosts, ({ path, metadata: { title } }) => `<li><a${add_attribute("href", `/blog/${path.replace(".md", "")}`, 0)}>${escape(title)}</a>
</li>`)}
<hr>
<a href="${"/blog/"}" class="${"bg-gray-700 text-gray-300 hover:text-gray-100 focus:text-gray-100 rounded px-2.5 py-0.5"}">\u2190 \u8FD4\u56DE\u5217\u8868</a>`;
    });
  }
});

// .svelte-kit/output/server/chunks/app-e9883c9f.js
function get_single_valued_header(headers, key) {
  const value = headers[key];
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return void 0;
    }
    if (value.length > 1) {
      throw new Error(`Multiple headers provided for ${key}. Multiple may be provided only for set-cookie`);
    }
    return value[0];
  }
  return value;
}
function resolve(base2, path) {
  if (scheme.test(path))
    return path;
  const base_match = absolute.exec(base2);
  const path_match = absolute.exec(path);
  if (!base_match) {
    throw new Error(`bad base path: "${base2}"`);
  }
  const baseparts = path_match ? [] : base2.slice(base_match[0].length).split("/");
  const pathparts = path_match ? path.slice(path_match[0].length).split("/") : path.split("/");
  baseparts.pop();
  for (let i = 0; i < pathparts.length; i += 1) {
    const part = pathparts[i];
    if (part === ".")
      continue;
    else if (part === "..")
      baseparts.pop();
    else
      baseparts.push(part);
  }
  const prefix = path_match && path_match[0] || base_match && base_match[0] || "";
  return `${prefix}${baseparts.join("/")}`;
}
function is_root_relative(path) {
  return path[0] === "/" && path[1] !== "/";
}
function coalesce_to_error(err) {
  return err instanceof Error || err && err.name && err.message ? err : new Error(JSON.stringify(err));
}
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function error(body4) {
  return {
    status: 500,
    body: body4,
    headers: {}
  };
}
function is_string(s2) {
  return typeof s2 === "string" || s2 instanceof String;
}
function is_content_type_textual(content_type) {
  if (!content_type)
    return true;
  const [type] = content_type.split(";");
  return type === "text/plain" || type === "application/json" || type === "application/x-www-form-urlencoded" || type === "multipart/form-data";
}
async function render_endpoint(request, route, match) {
  const mod = await route.load();
  const handler = mod[request.method.toLowerCase().replace("delete", "del")];
  if (!handler) {
    return;
  }
  const params = route.params(match);
  const response = await handler({ ...request, params });
  const preface = `Invalid response from route ${request.path}`;
  if (!response) {
    return;
  }
  if (typeof response !== "object") {
    return error(`${preface}: expected an object, got ${typeof response}`);
  }
  let { status = 200, body: body4, headers = {} } = response;
  headers = lowercase_keys(headers);
  const type = get_single_valued_header(headers, "content-type");
  const is_type_textual = is_content_type_textual(type);
  if (!is_type_textual && !(body4 instanceof Uint8Array || is_string(body4))) {
    return error(`${preface}: body must be an instance of string or Uint8Array if content-type is not a supported textual content-type`);
  }
  let normalized_body;
  if ((typeof body4 === "object" || typeof body4 === "undefined") && !(body4 instanceof Uint8Array) && (!type || type.startsWith("application/json"))) {
    headers = { ...headers, "content-type": "application/json; charset=utf-8" };
    normalized_body = JSON.stringify(typeof body4 === "undefined" ? {} : body4);
  } else {
    normalized_body = body4;
  }
  return { status, body: normalized_body, headers };
}
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop$1() {
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function writable(value, start = noop$1) {
  let stop;
  const subscribers = new Set();
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop$1) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set) || noop$1;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe: subscribe2 };
}
function hash(value) {
  let hash2 = 5381;
  let i = value.length;
  if (typeof value === "string") {
    while (i)
      hash2 = hash2 * 33 ^ value.charCodeAt(--i);
  } else {
    while (i)
      hash2 = hash2 * 33 ^ value[--i];
  }
  return (hash2 >>> 0).toString(36);
}
function escape_json_string_in_html(str) {
  return escape$1(str, escape_json_string_in_html_dict, (code) => `\\u${code.toString(16).toUpperCase()}`);
}
function escape_html_attr(str) {
  return '"' + escape$1(str, escape_html_attr_dict, (code) => `&#${code};`) + '"';
}
function escape$1(str, dict, unicode_encoder) {
  let result = "";
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char in dict) {
      result += dict[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += unicode_encoder(code);
      }
    } else {
      result += char;
    }
  }
  return result;
}
async function render_response({
  branch,
  options: options2,
  $session,
  page_config,
  status,
  error: error2,
  page: page2
}) {
  const css22 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error2) {
    error2.stack = options2.get_stack(error2);
  }
  if (page_config.ssr) {
    branch.forEach(({ node, loaded, fetched, uses_credentials }) => {
      if (node.css)
        node.css.forEach((url) => css22.add(url));
      if (node.js)
        node.js.forEach((url) => js.add(url));
      if (node.styles)
        node.styles.forEach((content) => styles.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded.maxage;
    });
    const session = writable($session);
    const props = {
      stores: {
        page: writable(null),
        navigating: writable(null),
        session
      },
      page: page2,
      components: branch.map(({ node }) => node.module.default)
    };
    for (let i = 0; i < branch.length; i += 1) {
      props[`props_${i}`] = await branch[i].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options2.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = { head: "", html: "", css: { code: "", map: null } };
  }
  const include_js = page_config.router || page_config.hydrate;
  if (!include_js)
    js.clear();
  const links = options2.amp ? styles.size > 0 || rendered.css.code.length > 0 ? `<style amp-custom>${Array.from(styles).concat(rendered.css.code).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css22).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"><\/script>`;
    init2 += options2.service_worker ? '<script async custom-element="amp-install-serviceworker" src="https://cdn.ampproject.org/v0/amp-install-serviceworker-0.1.js"><\/script>' : "";
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error3) => {
      throw new Error(`Failed to serialize session data: ${error3.message}`);
    })},
				host: ${page2 && page2.host ? s$1(page2.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				trailing_slash: ${s$1(options2.trailing_slash)},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error2)},
					nodes: [
						${(branch || []).map(({ node }) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page2 && page2.host ? s$1(page2.host) : "location.host"}, // TODO this is redundant
						path: ${page2 && page2.path ? try_serialize(page2.path, (error3) => {
      throw new Error(`Failed to serialize page.path: ${error3.message}`);
    }) : null},
						query: new URLSearchParams(${page2 && page2.query ? s$1(page2.query.toString()) : ""}),
						params: ${page2 && page2.params ? try_serialize(page2.params, (error3) => {
      throw new Error(`Failed to serialize page.params: ${error3.message}`);
    }) : null}
					}
				}` : "null"}
			});
		<\/script>`;
  }
  if (options2.service_worker) {
    init2 += options2.amp ? `<amp-install-serviceworker src="${options2.service_worker}" layout="nodisplay"></amp-install-serviceworker>` : `<script>
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('${options2.service_worker}');
			}
		<\/script>`;
  }
  const head = [
    rendered.head,
    styles.size && !options2.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body4 = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({ url, body: body22, json }) => {
    let attributes = `type="application/json" data-type="svelte-data" data-url=${escape_html_attr(url)}`;
    if (body22)
      attributes += ` data-body="${hash(body22)}"`;
    return `<script ${attributes}>${json}<\/script>`;
  }).join("\n\n	")}
		`;
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  if (!options2.floc) {
    headers["permissions-policy"] = "interest-cohort=()";
  }
  return {
    status,
    headers,
    body: options2.template({ head, body: body4 })
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(coalesce_to_error(err));
    return null;
  }
}
function serialize_error(error2) {
  if (!error2)
    return null;
  let serialized = try_serialize(error2);
  if (!serialized) {
    const { name, message, stack } = error2;
    serialized = try_serialize({ ...error2, name, message, stack });
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded) {
  const has_error_status = loaded.status && loaded.status >= 400 && loaded.status <= 599 && !loaded.redirect;
  if (loaded.error || has_error_status) {
    const status = loaded.status;
    if (!loaded.error && has_error_status) {
      return {
        status: status || 500,
        error: new Error()
      };
    }
    const error2 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    if (!(error2 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error2}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return { status: 500, error: error2 };
    }
    return { status, error: error2 };
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  if (loaded.context) {
    throw new Error('You are returning "context" from a load function. "context" was renamed to "stuff", please adjust your code accordingly.');
  }
  return loaded;
}
async function load_node({
  request,
  options: options2,
  state,
  route,
  page: page2,
  node,
  $session,
  stuff,
  prerender_enabled,
  is_leaf,
  is_error,
  status,
  error: error2
}) {
  const { module: module2 } = node;
  let uses_credentials = false;
  const fetched = [];
  let set_cookie_headers = [];
  let loaded;
  const page_proxy = new Proxy(page2, {
    get: (target, prop, receiver) => {
      if (prop === "query" && prerender_enabled) {
        throw new Error("Cannot access query on a page with prerendering enabled");
      }
      return Reflect.get(target, prop, receiver);
    }
  });
  if (module2.load) {
    const load_input = {
      page: page_proxy,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url;
        if (typeof resource === "string") {
          url = resource;
        } else {
          url = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        const resolved = resolve(request.path, url.split("?")[0]);
        let response;
        const prefix = options2.paths.assets || options2.paths.base;
        const filename = (resolved.startsWith(prefix) ? resolved.slice(prefix.length) : resolved).slice(1);
        const filename_html = `${filename}/index.html`;
        const asset = options2.manifest.assets.find((d2) => d2.file === filename || d2.file === filename_html);
        if (asset) {
          response = options2.read ? new Response(options2.read(asset.file), {
            headers: asset.type ? { "content-type": asset.type } : {}
          }) : await fetch(`http://${page2.host}/${asset.file}`, opts);
        } else if (is_root_relative(resolved)) {
          const relative = resolved;
          const headers = {
            ...opts.headers
          };
          if (opts.credentials !== "omit") {
            uses_credentials = true;
            headers.cookie = request.headers.cookie;
            if (!headers.authorization) {
              headers.authorization = request.headers.authorization;
            }
          }
          if (opts.body && typeof opts.body !== "string") {
            throw new Error("Request body must be a string");
          }
          const search = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
          const rendered = await respond({
            host: request.host,
            method: opts.method || "GET",
            headers,
            path: relative,
            rawBody: opts.body == null ? null : new TextEncoder().encode(opts.body),
            query: new URLSearchParams(search)
          }, options2, {
            fetched: url,
            initiator: route
          });
          if (rendered) {
            if (state.prerender) {
              state.prerender.dependencies.set(relative, rendered);
            }
            response = new Response(rendered.body, {
              status: rendered.status,
              headers: rendered.headers
            });
          }
        } else {
          if (resolved.startsWith("//")) {
            throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
          }
          if (typeof request.host !== "undefined") {
            const { hostname: fetch_hostname } = new URL(url);
            const [server_hostname] = request.host.split(":");
            if (`.${fetch_hostname}`.endsWith(`.${server_hostname}`) && opts.credentials !== "omit") {
              uses_credentials = true;
              opts.headers = {
                ...opts.headers,
                cookie: request.headers.cookie
              };
            }
          }
          const external_request = new Request(url, opts);
          response = await options2.hooks.externalFetch.call(null, external_request);
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, _receiver) {
              async function text() {
                const body4 = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 === "set-cookie") {
                    set_cookie_headers = set_cookie_headers.concat(value);
                  } else if (key2 !== "etag") {
                    headers[key2] = value;
                  }
                }
                if (!opts.body || typeof opts.body === "string") {
                  fetched.push({
                    url,
                    body: opts.body,
                    json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":"${escape_json_string_in_html(body4)}"}`
                  });
                }
                return body4;
              }
              if (key === "text") {
                return text;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text());
                };
              }
              return Reflect.get(response2, key, response2);
            }
          });
          return proxy;
        }
        return response || new Response("Not found", {
          status: 404
        });
      },
      stuff: { ...stuff }
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error2;
    }
    loaded = await module2.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  if (!loaded) {
    throw new Error(`${node.entry} - load must return a value except for page fall through`);
  }
  return {
    node,
    loaded: normalize(loaded),
    stuff: loaded.stuff || stuff,
    fetched,
    set_cookie_headers,
    uses_credentials
  };
}
async function respond_with_error({ request, options: options2, state, $session, status, error: error2 }) {
  const default_layout = await options2.load_component(options2.manifest.layout);
  const default_error = await options2.load_component(options2.manifest.error);
  const page2 = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded = await load_node({
    request,
    options: options2,
    state,
    route: null,
    page: page2,
    node: default_layout,
    $session,
    stuff: {},
    prerender_enabled: is_prerender_enabled(options2, default_error, state),
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded,
    await load_node({
      request,
      options: options2,
      state,
      route: null,
      page: page2,
      node: default_error,
      $session,
      stuff: loaded ? loaded.stuff : {},
      prerender_enabled: is_prerender_enabled(options2, default_error, state),
      is_leaf: false,
      is_error: true,
      status,
      error: error2
    })
  ];
  try {
    return await render_response({
      options: options2,
      $session,
      page_config: {
        hydrate: options2.hydrate,
        router: options2.router,
        ssr: options2.ssr
      },
      status,
      error: error2,
      branch,
      page: page2
    });
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return {
      status: 500,
      headers: {},
      body: error3.stack
    };
  }
}
function is_prerender_enabled(options2, node, state) {
  return options2.prerender && (!!node.module.prerender || !!state.prerender && state.prerender.all);
}
async function respond$1(opts) {
  const { request, options: options2, state, $session, route } = opts;
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => id ? options2.load_component(id) : void 0));
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error3
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  let page_config = get_page_config(leaf, options2);
  if (!leaf.prerender && state.prerender && !state.prerender.all) {
    return {
      status: 204,
      headers: {}
    };
  }
  let branch = [];
  let status = 200;
  let error2;
  let set_cookie_headers = [];
  ssr:
    if (page_config.ssr) {
      let stuff = {};
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              ...opts,
              node,
              stuff,
              prerender_enabled: is_prerender_enabled(options2, node, state),
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            set_cookie_headers = set_cookie_headers.concat(loaded.set_cookie_headers);
            if (loaded.loaded.redirect) {
              return with_cookies({
                status: loaded.loaded.status,
                headers: {
                  location: encodeURI(loaded.loaded.redirect)
                }
              }, set_cookie_headers);
            }
            if (loaded.loaded.error) {
              ({ status, error: error2 } = loaded.loaded);
            }
          } catch (err) {
            const e = coalesce_to_error(err);
            options2.handle_error(e, request);
            status = 500;
            error2 = e;
          }
          if (loaded && !error2) {
            branch.push(loaded);
          }
          if (error2) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options2.load_component(route.b[i]);
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  const error_loaded = await load_node({
                    ...opts,
                    node: error_node,
                    stuff: node_loaded.stuff,
                    prerender_enabled: is_prerender_enabled(options2, error_node, state),
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error2
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  page_config = get_page_config(error_node.module, options2);
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (err) {
                  const e = coalesce_to_error(err);
                  options2.handle_error(e, request);
                  continue;
                }
              }
            }
            return with_cookies(await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error: error2
            }), set_cookie_headers);
          }
        }
        if (loaded && loaded.loaded.stuff) {
          stuff = {
            ...stuff,
            ...loaded.loaded.stuff
          };
        }
      }
    }
  try {
    return with_cookies(await render_response({
      ...opts,
      page_config,
      status,
      error: error2,
      branch: branch.filter(Boolean)
    }), set_cookie_headers);
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return with_cookies(await respond_with_error({
      ...opts,
      status: 500,
      error: error3
    }), set_cookie_headers);
  }
}
function get_page_config(leaf, options2) {
  return {
    ssr: "ssr" in leaf ? !!leaf.ssr : options2.ssr,
    router: "router" in leaf ? !!leaf.router : options2.router,
    hydrate: "hydrate" in leaf ? !!leaf.hydrate : options2.hydrate
  };
}
function with_cookies(response, set_cookie_headers) {
  if (set_cookie_headers.length) {
    response.headers["set-cookie"] = set_cookie_headers;
  }
  return response;
}
async function render_page(request, route, match, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const params = route.params(match);
  const page2 = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  const $session = await options2.hooks.getSession(request);
  const response = await respond$1({
    request,
    options: options2,
    state,
    $session,
    route,
    page: page2
  });
  if (response) {
    return response;
  }
  if (state.fetched) {
    return {
      status: 500,
      headers: {},
      body: `Bad request in load function: failed to fetch ${state.fetched}`
    };
  }
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        (map.get(key) || []).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
function parse_body(raw, headers) {
  if (!raw)
    return raw;
  const content_type = headers["content-type"];
  const [type, ...directives] = content_type ? content_type.split(/;\s*/) : [];
  const text = () => new TextDecoder(headers["content-encoding"] || "utf-8").decode(raw);
  switch (type) {
    case "text/plain":
      return text();
    case "application/json":
      return JSON.parse(text());
    case "application/x-www-form-urlencoded":
      return get_urlencoded(text());
    case "multipart/form-data": {
      const boundary = directives.find((directive) => directive.startsWith("boundary="));
      if (!boundary)
        throw new Error("Missing boundary");
      return get_multipart(text(), boundary.slice("boundary=".length));
    }
    default:
      return raw;
  }
}
function get_urlencoded(text) {
  const { data, append } = read_only_form_data();
  text.replace(/\+/g, " ").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    append(decodeURIComponent(key), decodeURIComponent(value));
  });
  return data;
}
function get_multipart(text, boundary) {
  const parts = text.split(`--${boundary}`);
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    throw new Error("Malformed form data");
  }
  const { data, append } = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    if (!match) {
      throw new Error("Malformed form data");
    }
    const raw_headers = match[1];
    const body4 = match[2].trim();
    let key;
    const headers = {};
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name, value] = raw_header.split(": ");
      name = name.toLowerCase();
      headers[name] = value;
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name2, value2] = raw_directive.split("=");
        directives[name2] = JSON.parse(value2);
      });
      if (name === "content-disposition") {
        if (value !== "form-data")
          throw new Error("Malformed form data");
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      throw new Error("Malformed form data");
    append(key, body4);
  });
  return data;
}
async function respond(incoming, options2, state = {}) {
  if (incoming.path !== "/" && options2.trailing_slash !== "ignore") {
    const has_trailing_slash = incoming.path.endsWith("/");
    if (has_trailing_slash && options2.trailing_slash === "never" || !has_trailing_slash && options2.trailing_slash === "always" && !(incoming.path.split("/").pop() || "").includes(".")) {
      const path = has_trailing_slash ? incoming.path.slice(0, -1) : incoming.path + "/";
      const q = incoming.query.toString();
      return {
        status: 301,
        headers: {
          location: options2.paths.base + path + (q ? `?${q}` : "")
        }
      };
    }
  }
  const headers = lowercase_keys(incoming.headers);
  const request = {
    ...incoming,
    headers,
    body: parse_body(incoming.rawBody, headers),
    params: {},
    locals: {}
  };
  try {
    return await options2.hooks.handle({
      request,
      resolve: async (request2) => {
        if (state.prerender && state.prerender.fallback) {
          return await render_response({
            options: options2,
            $session: await options2.hooks.getSession(request2),
            page_config: { ssr: false, router: true, hydrate: true },
            status: 200,
            branch: []
          });
        }
        const decoded = decodeURI(request2.path);
        for (const route of options2.manifest.routes) {
          const match = route.pattern.exec(decoded);
          if (!match)
            continue;
          const response = route.type === "endpoint" ? await render_endpoint(request2, route, match) : await render_page(request2, route, match, options2, state);
          if (response) {
            if (response.status === 200) {
              const cache_control = get_single_valued_header(response.headers, "cache-control");
              if (!cache_control || !/(no-store|immutable)/.test(cache_control)) {
                let if_none_match_value = request2.headers["if-none-match"];
                if (if_none_match_value == null ? void 0 : if_none_match_value.startsWith('W/"')) {
                  if_none_match_value = if_none_match_value.substring(2);
                }
                const etag = `"${hash(response.body || "")}"`;
                if (if_none_match_value === etag) {
                  return {
                    status: 304,
                    headers: {}
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        const $session = await options2.hooks.getSession(request2);
        return await respond_with_error({
          request: request2,
          options: options2,
          state,
          $session,
          status: 404,
          error: new Error(`Not found: ${request2.path}`)
        });
      }
    });
  } catch (err) {
    const e = coalesce_to_error(err);
    options2.handle_error(e, request);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e.stack : e.message
    };
  }
}
function noop() {
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function custom_event(type, detail, bubbles = false) {
  const e = document.createEvent("CustomEvent");
  e.initCustomEvent(type, bubbles, false, detail);
  return e;
}
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function createEventDispatcher() {
  const component = get_current_component();
  return (type, detail) => {
    const callbacks = component.$$.callbacks[type];
    if (callbacks) {
      const event = custom_event(type, detail);
      callbacks.slice().forEach((fn) => {
        fn.call(component, event);
      });
    }
  };
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
function getContext(key) {
  return get_current_component().$$.context.get(key);
}
function spread(args, classes_to_add) {
  const attributes = Object.assign({}, ...args);
  if (classes_to_add) {
    if (attributes.class == null) {
      attributes.class = classes_to_add;
    } else {
      attributes.class += " " + classes_to_add;
    }
  }
  let str = "";
  Object.keys(attributes).forEach((name) => {
    if (invalid_attribute_name_character.test(name))
      return;
    const value = attributes[name];
    if (value === true)
      str += " " + name;
    else if (boolean_attributes.has(name.toLowerCase())) {
      if (value)
        str += " " + name;
    } else if (value != null) {
      str += ` ${name}="${value}"`;
    }
  });
  return str;
}
function escape(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped[match]);
}
function escape_attribute_value(value) {
  return typeof value === "string" ? escape(value) : value;
}
function escape_object(obj) {
  const result = {};
  for (const key in obj) {
    result[key] = escape_attribute_value(obj[key]);
  }
  return result;
}
function each(items, fn) {
  let str = "";
  for (let i = 0; i < items.length; i += 1) {
    str += fn(items[i], i);
  }
  return str;
}
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(context || (parent_component ? parent_component.$$.context : [])),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({ $$ });
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
      on_destroy = [];
      const result = { title: "", head: "", css: new Set() };
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css22) => css22.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape(value)) : `"${value}"`}`}`;
}
function afterUpdate() {
}
function set_paths(paths) {
  base = paths.base;
  assets = paths.assets || base;
}
function set_prerendering(value) {
}
function init(settings = default_settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  const hooks = get_hooks(user_hooks);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: assets + "/_app/start-93403bd6.js",
      css: [assets + "/_app/assets/start-d5b4de3e.css", assets + "/_app/assets/vendor-a7d6a93c.css"],
      js: [assets + "/_app/start-93403bd6.js", assets + "/_app/chunks/vendor-ada84098.js", assets + "/_app/chunks/preload-helper-ec9aa979.js"]
    },
    fetched: void 0,
    floc: false,
    get_component_path: (id) => assets + "/_app/" + entry_lookup[id],
    get_stack: (error2) => String(error2),
    handle_error: (error2, request) => {
      hooks.handleError({ error: error2, request });
      error2.stack = options.get_stack(error2);
    },
    hooks,
    hydrate: true,
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    prerender: true,
    read: settings.read,
    root: Root,
    service_worker: null,
    router: true,
    ssr: false,
    target: "#svelte",
    template,
    trailing_slash: "never"
  };
}
async function load_component(file) {
  const { entry, css: css22, js, styles } = metadata_lookup[file];
  return {
    module: await module_lookup[file](),
    entry: assets + "/_app/" + entry,
    css: css22.map((dep) => assets + "/_app/" + dep),
    js: js.map((dep) => assets + "/_app/" + dep),
    styles
  };
}
function render(request, {
  prerender: prerender3
} = {}) {
  const host = request.headers["host"];
  return respond({ ...request, host }, options, { prerender: prerender3 });
}
var __accessCheck, __privateGet, __privateAdd, __privateSet, _map, absolute, scheme, chars, unsafeChars, reserved, escaped$1, objectProtoOwnPropertyNames, subscriber_queue, escape_json_string_in_html_dict, escape_html_attr_dict, s$1, s, ReadOnlyFormData, current_component, globals, boolean_attributes, invalid_attribute_name_character, escaped, missing_component, on_destroy, css5, Root, base, assets, user_hooks, template, options, default_settings, d, empty, manifest, get_hooks, module_lookup, metadata_lookup;
var init_app_e9883c9f = __esm({
  ".svelte-kit/output/server/chunks/app-e9883c9f.js"() {
    init_shims();
    __accessCheck = (obj, member, msg) => {
      if (!member.has(obj))
        throw TypeError("Cannot " + msg);
    };
    __privateGet = (obj, member, getter) => {
      __accessCheck(obj, member, "read from private field");
      return getter ? getter.call(obj) : member.get(obj);
    };
    __privateAdd = (obj, member, value) => {
      if (member.has(obj))
        throw TypeError("Cannot add the same private member more than once");
      member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
    };
    __privateSet = (obj, member, value, setter) => {
      __accessCheck(obj, member, "write to private field");
      setter ? setter.call(obj, value) : member.set(obj, value);
      return value;
    };
    absolute = /^([a-z]+:)?\/?\//;
    scheme = /^[a-z]+:/;
    chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
    unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
    reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
    escaped$1 = {
      "<": "\\u003C",
      ">": "\\u003E",
      "/": "\\u002F",
      "\\": "\\\\",
      "\b": "\\b",
      "\f": "\\f",
      "\n": "\\n",
      "\r": "\\r",
      "	": "\\t",
      "\0": "\\0",
      "\u2028": "\\u2028",
      "\u2029": "\\u2029"
    };
    objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
    Promise.resolve();
    subscriber_queue = [];
    escape_json_string_in_html_dict = {
      '"': '\\"',
      "<": "\\u003C",
      ">": "\\u003E",
      "/": "\\u002F",
      "\\": "\\\\",
      "\b": "\\b",
      "\f": "\\f",
      "\n": "\\n",
      "\r": "\\r",
      "	": "\\t",
      "\0": "\\0",
      "\u2028": "\\u2028",
      "\u2029": "\\u2029"
    };
    escape_html_attr_dict = {
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    };
    s$1 = JSON.stringify;
    s = JSON.stringify;
    ReadOnlyFormData = class {
      constructor(map) {
        __privateAdd(this, _map, void 0);
        __privateSet(this, _map, map);
      }
      get(key) {
        const value = __privateGet(this, _map).get(key);
        return value && value[0];
      }
      getAll(key) {
        return __privateGet(this, _map).get(key);
      }
      has(key) {
        return __privateGet(this, _map).has(key);
      }
      *[Symbol.iterator]() {
        for (const [key, value] of __privateGet(this, _map)) {
          for (let i = 0; i < value.length; i += 1) {
            yield [key, value[i]];
          }
        }
      }
      *entries() {
        for (const [key, value] of __privateGet(this, _map)) {
          for (let i = 0; i < value.length; i += 1) {
            yield [key, value[i]];
          }
        }
      }
      *keys() {
        for (const [key] of __privateGet(this, _map))
          yield key;
      }
      *values() {
        for (const [, value] of __privateGet(this, _map)) {
          for (let i = 0; i < value.length; i += 1) {
            yield value[i];
          }
        }
      }
    };
    _map = new WeakMap();
    Promise.resolve();
    globals = typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : global;
    boolean_attributes = new Set([
      "allowfullscreen",
      "allowpaymentrequest",
      "async",
      "autofocus",
      "autoplay",
      "checked",
      "controls",
      "default",
      "defer",
      "disabled",
      "formnovalidate",
      "hidden",
      "ismap",
      "loop",
      "multiple",
      "muted",
      "nomodule",
      "novalidate",
      "open",
      "playsinline",
      "readonly",
      "required",
      "reversed",
      "selected"
    ]);
    invalid_attribute_name_character = /[\s'">/=\u{FDD0}-\u{FDEF}\u{FFFE}\u{FFFF}\u{1FFFE}\u{1FFFF}\u{2FFFE}\u{2FFFF}\u{3FFFE}\u{3FFFF}\u{4FFFE}\u{4FFFF}\u{5FFFE}\u{5FFFF}\u{6FFFE}\u{6FFFF}\u{7FFFE}\u{7FFFF}\u{8FFFE}\u{8FFFF}\u{9FFFE}\u{9FFFF}\u{AFFFE}\u{AFFFF}\u{BFFFE}\u{BFFFF}\u{CFFFE}\u{CFFFF}\u{DFFFE}\u{DFFFF}\u{EFFFE}\u{EFFFF}\u{FFFFE}\u{FFFFF}\u{10FFFE}\u{10FFFF}]/u;
    escaped = {
      '"': "&quot;",
      "'": "&#39;",
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;"
    };
    missing_component = {
      $$render: () => ""
    };
    css5 = {
      code: "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}",
      map: null
    };
    Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { stores } = $$props;
      let { page: page2 } = $$props;
      let { components } = $$props;
      let { props_0 = null } = $$props;
      let { props_1 = null } = $$props;
      let { props_2 = null } = $$props;
      setContext("__svelte__", stores);
      afterUpdate(stores.page.notify);
      if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
        $$bindings.stores(stores);
      if ($$props.page === void 0 && $$bindings.page && page2 !== void 0)
        $$bindings.page(page2);
      if ($$props.components === void 0 && $$bindings.components && components !== void 0)
        $$bindings.components(components);
      if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
        $$bindings.props_0(props_0);
      if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
        $$bindings.props_1(props_1);
      if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
        $$bindings.props_2(props_2);
      $$result.css.add(css5);
      {
        stores.page.set(page2);
      }
      return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
        default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
          default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {})}` : ``}`
        })}` : ``}`
      })}

${``}`;
    });
    base = "";
    assets = "";
    user_hooks = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      [Symbol.toStringTag]: "Module"
    });
    template = ({ head, body: body4 }) => '<!DOCTYPE html>\n<html lang="zh">\n	<head>\n		<meta charset="utf-8" />\n		<link rel="icon" href="/favicon.png" />\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\n        <title>\u4E00\u6307\u7985</title>\n		' + head + '\n	</head>\n	<body>\n		<div id="svelte">' + body4 + "</div>\n	</body>\n</html>\n";
    options = null;
    default_settings = { paths: { "base": "", "assets": "" } };
    d = (s2) => s2.replace(/%23/g, "#").replace(/%3[Bb]/g, ";").replace(/%2[Cc]/g, ",").replace(/%2[Ff]/g, "/").replace(/%3[Ff]/g, "?").replace(/%3[Aa]/g, ":").replace(/%40/g, "@").replace(/%26/g, "&").replace(/%3[Dd]/g, "=").replace(/%2[Bb]/g, "+").replace(/%24/g, "$");
    empty = () => ({});
    manifest = {
      assets: [{ "file": ".DS_Store", "size": 8196, "type": null }, { "file": "favicon.png", "size": 1571, "type": "image/png" }, { "file": "images/.DS_Store", "size": 6148, "type": null }, { "file": "images/attitude.png", "size": 56155, "type": "image/png" }, { "file": "images/avatar.jpeg", "size": 23509, "type": "image/jpeg" }, { "file": "images/crab.jpeg", "size": 93999, "type": "image/jpeg" }, { "file": "images/lanke.webp", "size": 35906, "type": "image/webp" }, { "file": "images/phil.jpeg", "size": 12520, "type": "image/jpeg" }, { "file": "images/present.png", "size": 53248, "type": "image/png" }, { "file": "images/talk.png", "size": 22563, "type": "image/png" }, { "file": "images/xianxia.jpg", "size": 2664675, "type": "image/jpeg" }, { "file": "media/.DS_Store", "size": 6148, "type": null }, { "file": "media/TheMass.mp3", "size": 5330813, "type": "audio/mpeg" }, { "file": "pdfs/.DS_Store", "size": 6148, "type": null }, { "file": "pdfs/body.pdf", "size": 1096608, "type": "application/pdf" }, { "file": "pdfs/climate.pdf", "size": 728863, "type": "application/pdf" }, { "file": "pdfs/facilitation.pdf", "size": 1242249, "type": "application/pdf" }, { "file": "pdfs/prioritize.pdf", "size": 468719, "type": "application/pdf" }, { "file": "robots.txt", "size": 67, "type": "text/plain" }],
      layout: "src/routes/__layout.svelte",
      error: ".svelte-kit/build/components/error.svelte",
      routes: [
        {
          type: "page",
          pattern: /^\/$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/index.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/recipe\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/recipe/index.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/slides\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/slides/index.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/slides\/test\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/slides/test.md"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/about\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/about.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "endpoint",
          pattern: /^\/notes\.json$/,
          params: empty,
          load: () => Promise.resolve().then(() => (init_index_json_474e5ef7(), index_json_474e5ef7_exports))
        },
        {
          type: "page",
          pattern: /^\/notes\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/notes/index.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "endpoint",
          pattern: /^\/notes\/([^/]+?)\.json$/,
          params: (m) => ({ slug: d(m[1]) }),
          load: () => Promise.resolve().then(() => (init_slug_json_2e965cca(), slug_json_2e965cca_exports))
        },
        {
          type: "page",
          pattern: /^\/notes\/([^/]+?)\/?$/,
          params: (m) => ({ slug: d(m[1]) }),
          a: ["src/routes/__layout.svelte", "src/routes/notes/[slug].svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/talks\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/talks/index.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/blog\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/blog/index.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/blog\/nine-events-of-instruction\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/blog/nine-events-of-instruction.md"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/blog\/involve-and-layingflatism\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/blog/involve-and-layingflatism.md"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/blog\/independent-candidates\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/blog/independent-candidates.md"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/blog\/political-economy\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/blog/political-economy.md"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/blog\/learn-english-1\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/blog/learn-english-1.md"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/blog\/learn-english-2\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/blog/learn-english-2.md"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/blog\/xianxiafensibao\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/blog/xianxiafensibao.md"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/blog\/magic-formula\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/blog/magic-formula.md"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/blog\/facilitation\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/blog/facilitation.md"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/tags\/([^/]+?)\/?$/,
          params: (m) => ({ tag: d(m[1]) }),
          a: ["src/routes/__layout.svelte", "src/routes/tags/[tag].svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        }
      ]
    };
    get_hooks = (hooks) => ({
      getSession: hooks.getSession || (() => ({})),
      handle: hooks.handle || (({ request, resolve: resolve2 }) => resolve2(request)),
      handleError: hooks.handleError || (({ error: error2 }) => console.error(error2.stack)),
      externalFetch: hooks.externalFetch || fetch
    });
    module_lookup = {
      "src/routes/__layout.svelte": () => Promise.resolve().then(() => (init_layout_cc84681e(), layout_cc84681e_exports)),
      ".svelte-kit/build/components/error.svelte": () => Promise.resolve().then(() => (init_error_78e5edd1(), error_78e5edd1_exports)),
      "src/routes/index.svelte": () => Promise.resolve().then(() => (init_index_3fb453f5(), index_3fb453f5_exports)),
      "src/routes/recipe/index.svelte": () => Promise.resolve().then(() => (init_index_ac111f78(), index_ac111f78_exports)),
      "src/routes/slides/index.svelte": () => Promise.resolve().then(() => (init_index_fb3090d5(), index_fb3090d5_exports)),
      "src/routes/slides/test.md": () => Promise.resolve().then(() => (init_test_2a289c24(), test_2a289c24_exports)),
      "src/routes/about.svelte": () => Promise.resolve().then(() => (init_about_7992f477(), about_7992f477_exports)),
      "src/routes/notes/index.svelte": () => Promise.resolve().then(() => (init_index_ba6627bf(), index_ba6627bf_exports)),
      "src/routes/notes/[slug].svelte": () => Promise.resolve().then(() => (init_slug_9fb92b07(), slug_9fb92b07_exports)),
      "src/routes/talks/index.svelte": () => Promise.resolve().then(() => (init_index_3e3b1b3e(), index_3e3b1b3e_exports)),
      "src/routes/blog/index.svelte": () => Promise.resolve().then(() => (init_index_f584a79d(), index_f584a79d_exports)),
      "src/routes/blog/nine-events-of-instruction.md": () => Promise.resolve().then(() => (init_nine_events_of_instruction_33f1ebcf(), nine_events_of_instruction_33f1ebcf_exports)),
      "src/routes/blog/involve-and-layingflatism.md": () => Promise.resolve().then(() => (init_involve_and_layingflatism_5fe03fb7(), involve_and_layingflatism_5fe03fb7_exports)),
      "src/routes/blog/independent-candidates.md": () => Promise.resolve().then(() => (init_independent_candidates_721687bf(), independent_candidates_721687bf_exports)),
      "src/routes/blog/political-economy.md": () => Promise.resolve().then(() => (init_political_economy_0a4f3dc7(), political_economy_0a4f3dc7_exports)),
      "src/routes/blog/learn-english-1.md": () => Promise.resolve().then(() => (init_learn_english_1_635252da(), learn_english_1_635252da_exports)),
      "src/routes/blog/learn-english-2.md": () => Promise.resolve().then(() => (init_learn_english_2_1fe37b3a(), learn_english_2_1fe37b3a_exports)),
      "src/routes/blog/xianxiafensibao.md": () => Promise.resolve().then(() => (init_xianxiafensibao_76c77a58(), xianxiafensibao_76c77a58_exports)),
      "src/routes/blog/magic-formula.md": () => Promise.resolve().then(() => (init_magic_formula_c9a80b47(), magic_formula_c9a80b47_exports)),
      "src/routes/blog/facilitation.md": () => Promise.resolve().then(() => (init_facilitation_fbc95f44(), facilitation_fbc95f44_exports)),
      "src/routes/tags/[tag].svelte": () => Promise.resolve().then(() => (init_tag_f69a6901(), tag_f69a6901_exports))
    };
    metadata_lookup = { "src/routes/__layout.svelte": { "entry": "pages/__layout.svelte-e0872dd8.js", "css": ["assets/pages/__layout.svelte-611361d2.css", "assets/vendor-a7d6a93c.css"], "js": ["pages/__layout.svelte-e0872dd8.js", "chunks/vendor-ada84098.js"], "styles": [] }, ".svelte-kit/build/components/error.svelte": { "entry": "error.svelte-67478ab8.js", "css": ["assets/vendor-a7d6a93c.css"], "js": ["error.svelte-67478ab8.js", "chunks/vendor-ada84098.js"], "styles": [] }, "src/routes/index.svelte": { "entry": "pages/index.svelte-7952f402.js", "css": ["assets/pages/index.svelte-dcc34d58.css", "assets/vendor-a7d6a93c.css"], "js": ["pages/index.svelte-7952f402.js", "chunks/vendor-ada84098.js"], "styles": [] }, "src/routes/recipe/index.svelte": { "entry": "pages/recipe/index.svelte-67320054.js", "css": ["assets/pages/recipe/index.svelte-4831f862.css", "assets/vendor-a7d6a93c.css"], "js": ["pages/recipe/index.svelte-67320054.js", "chunks/vendor-ada84098.js"], "styles": [] }, "src/routes/slides/index.svelte": { "entry": "pages/slides/index.svelte-507b683c.js", "css": ["assets/vendor-a7d6a93c.css"], "js": ["pages/slides/index.svelte-507b683c.js", "chunks/preload-helper-ec9aa979.js", "chunks/vendor-ada84098.js", "chunks/date-655861b7.js"], "styles": [] }, "src/routes/slides/test.md": { "entry": "pages/slides/test.md-5d4e184e.js", "css": ["assets/vendor-a7d6a93c.css"], "js": ["pages/slides/test.md-5d4e184e.js", "chunks/vendor-ada84098.js"], "styles": [] }, "src/routes/about.svelte": { "entry": "pages/about.svelte-02b3684e.js", "css": ["assets/vendor-a7d6a93c.css"], "js": ["pages/about.svelte-02b3684e.js", "chunks/vendor-ada84098.js"], "styles": [] }, "src/routes/notes/index.svelte": { "entry": "pages/notes/index.svelte-fe863a2c.js", "css": ["assets/vendor-a7d6a93c.css"], "js": ["pages/notes/index.svelte-fe863a2c.js", "chunks/vendor-ada84098.js"], "styles": [] }, "src/routes/notes/[slug].svelte": { "entry": "pages/notes/_slug_.svelte-242a8076.js", "css": ["assets/vendor-a7d6a93c.css"], "js": ["pages/notes/_slug_.svelte-242a8076.js", "chunks/vendor-ada84098.js", "chunks/date-655861b7.js"], "styles": [] }, "src/routes/talks/index.svelte": { "entry": "pages/talks/index.svelte-772b9115.js", "css": ["assets/vendor-a7d6a93c.css"], "js": ["pages/talks/index.svelte-772b9115.js", "chunks/vendor-ada84098.js", "chunks/date-655861b7.js"], "styles": [] }, "src/routes/blog/index.svelte": { "entry": "pages/blog/index.svelte-319ba6f7.js", "css": ["assets/vendor-a7d6a93c.css"], "js": ["pages/blog/index.svelte-319ba6f7.js", "chunks/preload-helper-ec9aa979.js", "chunks/vendor-ada84098.js", "chunks/date-655861b7.js"], "styles": [] }, "src/routes/blog/nine-events-of-instruction.md": { "entry": "pages/blog/nine-events-of-instruction.md-856d2829.js", "css": ["assets/pages/blog/nine-events-of-instruction.md-99bb123b.css", "assets/vendor-a7d6a93c.css"], "js": ["pages/blog/nine-events-of-instruction.md-856d2829.js", "chunks/vendor-ada84098.js", "chunks/post-1fd37bc9.js", "chunks/date-655861b7.js"], "styles": [] }, "src/routes/blog/involve-and-layingflatism.md": { "entry": "pages/blog/involve-and-layingflatism.md-53052cbc.js", "css": ["assets/vendor-a7d6a93c.css"], "js": ["pages/blog/involve-and-layingflatism.md-53052cbc.js", "chunks/vendor-ada84098.js", "chunks/post-1fd37bc9.js", "chunks/date-655861b7.js"], "styles": [] }, "src/routes/blog/independent-candidates.md": { "entry": "pages/blog/independent-candidates.md-adfed3c3.js", "css": ["assets/vendor-a7d6a93c.css"], "js": ["pages/blog/independent-candidates.md-adfed3c3.js", "chunks/vendor-ada84098.js", "chunks/post-1fd37bc9.js", "chunks/date-655861b7.js"], "styles": [] }, "src/routes/blog/political-economy.md": { "entry": "pages/blog/political-economy.md-654bbebf.js", "css": ["assets/vendor-a7d6a93c.css"], "js": ["pages/blog/political-economy.md-654bbebf.js", "chunks/vendor-ada84098.js", "chunks/post-1fd37bc9.js", "chunks/date-655861b7.js"], "styles": [] }, "src/routes/blog/learn-english-1.md": { "entry": "pages/blog/learn-english-1.md-5ac71d91.js", "css": ["assets/vendor-a7d6a93c.css"], "js": ["pages/blog/learn-english-1.md-5ac71d91.js", "chunks/vendor-ada84098.js", "chunks/post-1fd37bc9.js", "chunks/date-655861b7.js"], "styles": [] }, "src/routes/blog/learn-english-2.md": { "entry": "pages/blog/learn-english-2.md-bb111886.js", "css": ["assets/vendor-a7d6a93c.css"], "js": ["pages/blog/learn-english-2.md-bb111886.js", "chunks/vendor-ada84098.js", "chunks/post-1fd37bc9.js", "chunks/date-655861b7.js"], "styles": [] }, "src/routes/blog/xianxiafensibao.md": { "entry": "pages/blog/xianxiafensibao.md-2a20691a.js", "css": ["assets/vendor-a7d6a93c.css"], "js": ["pages/blog/xianxiafensibao.md-2a20691a.js", "chunks/vendor-ada84098.js", "chunks/post-1fd37bc9.js", "chunks/date-655861b7.js"], "styles": [] }, "src/routes/blog/magic-formula.md": { "entry": "pages/blog/magic-formula.md-451f1126.js", "css": ["assets/vendor-a7d6a93c.css"], "js": ["pages/blog/magic-formula.md-451f1126.js", "chunks/vendor-ada84098.js", "chunks/post-1fd37bc9.js", "chunks/date-655861b7.js"], "styles": [] }, "src/routes/blog/facilitation.md": { "entry": "pages/blog/facilitation.md-9f954d4c.js", "css": ["assets/vendor-a7d6a93c.css"], "js": ["pages/blog/facilitation.md-9f954d4c.js", "chunks/vendor-ada84098.js", "chunks/post-1fd37bc9.js", "chunks/date-655861b7.js"], "styles": [] }, "src/routes/tags/[tag].svelte": { "entry": "pages/tags/_tag_.svelte-17326bb9.js", "css": ["assets/vendor-a7d6a93c.css"], "js": ["pages/tags/_tag_.svelte-17326bb9.js", "chunks/preload-helper-ec9aa979.js", "chunks/vendor-ada84098.js"], "styles": [] } };
  }
});

// .svelte-kit/vercel/entry.js
__export(exports, {
  default: () => entry_default
});
init_shims();

// node_modules/@sveltejs/kit/dist/node.js
init_shims();
function getRawBody(req) {
  return new Promise((fulfil, reject) => {
    const h = req.headers;
    if (!h["content-type"]) {
      return fulfil(null);
    }
    req.on("error", reject);
    const length = Number(h["content-length"]);
    if (isNaN(length) && h["transfer-encoding"] == null) {
      return fulfil(null);
    }
    let data = new Uint8Array(length || 0);
    if (length > 0) {
      let offset = 0;
      req.on("data", (chunk) => {
        const new_len = offset + Buffer.byteLength(chunk);
        if (new_len > length) {
          return reject({
            status: 413,
            reason: 'Exceeded "Content-Length" limit'
          });
        }
        data.set(chunk, offset);
        offset = new_len;
      });
    } else {
      req.on("data", (chunk) => {
        const new_data = new Uint8Array(data.length + chunk.length);
        new_data.set(data, 0);
        new_data.set(chunk, data.length);
        data = new_data;
      });
    }
    req.on("end", () => {
      fulfil(data);
    });
  });
}

// .svelte-kit/output/server/app.js
init_shims();
init_app_e9883c9f();

// .svelte-kit/vercel/entry.js
init();
var entry_default = async (req, res) => {
  const { pathname, searchParams } = new URL(req.url || "", "http://localhost");
  let body4;
  try {
    body4 = await getRawBody(req);
  } catch (err) {
    res.statusCode = err.status || 400;
    return res.end(err.reason || "Invalid request body");
  }
  const rendered = await render({
    method: req.method,
    headers: req.headers,
    path: pathname,
    query: searchParams,
    rawBody: body4
  });
  if (rendered) {
    const { status, headers, body: body5 } = rendered;
    return res.writeHead(status, headers).end(body5);
  }
  return res.writeHead(404).end();
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
/*! fetch-blob. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */
