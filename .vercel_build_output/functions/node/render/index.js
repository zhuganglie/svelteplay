var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
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

// .svelte-kit/vercel/entry.js
__export(exports, {
  default: () => entry_default
});

// node_modules/@sveltejs/kit/dist/node.js
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
      const [type] = h["content-type"].split(/;\s*/);
      if (type === "application/octet-stream") {
        return fulfil(data);
      }
      const encoding = h["content-encoding"] || "utf-8";
      fulfil(new TextDecoder(encoding).decode(data));
    });
  });
}

// node_modules/@sveltejs/kit/dist/install-fetch.js
var import_http = __toModule(require("http"));
var import_https = __toModule(require("https"));
var import_zlib = __toModule(require("zlib"));
var import_stream = __toModule(require("stream"));
var import_util = __toModule(require("util"));
var import_crypto = __toModule(require("crypto"));
var import_url = __toModule(require("url"));
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
var src = dataUriToBuffer;
var { Readable } = import_stream.default;
var wm = new WeakMap();
async function* read(parts) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else {
      yield part;
    }
  }
}
var Blob = class {
  constructor(blobParts = [], options2 = {}) {
    let size = 0;
    const parts = blobParts.map((element) => {
      let buffer;
      if (element instanceof Buffer) {
        buffer = element;
      } else if (ArrayBuffer.isView(element)) {
        buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
      } else if (element instanceof ArrayBuffer) {
        buffer = Buffer.from(element);
      } else if (element instanceof Blob) {
        buffer = element;
      } else {
        buffer = Buffer.from(typeof element === "string" ? element : String(element));
      }
      size += buffer.length || buffer.size || 0;
      return buffer;
    });
    const type = options2.type === void 0 ? "" : String(options2.type).toLowerCase();
    wm.set(this, {
      type: /[^\u0020-\u007E]/.test(type) ? "" : type,
      size,
      parts
    });
  }
  get size() {
    return wm.get(this).size;
  }
  get type() {
    return wm.get(this).type;
  }
  async text() {
    return Buffer.from(await this.arrayBuffer()).toString();
  }
  async arrayBuffer() {
    const data = new Uint8Array(this.size);
    let offset = 0;
    for await (const chunk of this.stream()) {
      data.set(chunk, offset);
      offset += chunk.length;
    }
    return data.buffer;
  }
  stream() {
    return Readable.from(read(wm.get(this).parts));
  }
  slice(start = 0, end = this.size, type = "") {
    const { size } = this;
    let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
    let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
    const span = Math.max(relativeEnd - relativeStart, 0);
    const parts = wm.get(this).parts.values();
    const blobParts = [];
    let added = 0;
    for (const part of parts) {
      const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
      if (relativeStart && size2 <= relativeStart) {
        relativeStart -= size2;
        relativeEnd -= size2;
      } else {
        const chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
        blobParts.push(chunk);
        added += ArrayBuffer.isView(chunk) ? chunk.byteLength : chunk.size;
        relativeStart = 0;
        if (added >= span) {
          break;
        }
      }
    }
    const blob = new Blob([], { type: String(type).toLowerCase() });
    Object.assign(wm.get(blob), { size: span, parts: blobParts });
    return blob;
  }
  get [Symbol.toStringTag]() {
    return "Blob";
  }
  static [Symbol.hasInstance](object) {
    return object && typeof object === "object" && typeof object.stream === "function" && object.stream.length === 0 && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
  }
};
Object.defineProperties(Blob.prototype, {
  size: { enumerable: true },
  type: { enumerable: true },
  slice: { enumerable: true }
});
var fetchBlob = Blob;
var FetchBaseError = class extends Error {
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
var FetchError = class extends FetchBaseError {
  constructor(message, type, systemError) {
    super(message, type);
    if (systemError) {
      this.code = this.errno = systemError.code;
      this.erroredSysCall = systemError.syscall;
    }
  }
};
var NAME = Symbol.toStringTag;
var isURLSearchParameters = (object) => {
  return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
};
var isBlob = (object) => {
  return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
};
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
var isAbortSignal = (object) => {
  return typeof object === "object" && object[NAME] === "AbortSignal";
};
var carriage = "\r\n";
var dashes = "-".repeat(2);
var carriageLength = Buffer.byteLength(carriage);
var getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
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
var getBoundary = () => (0, import_crypto.randomBytes)(8).toString("hex");
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
    if (isBlob(value)) {
      length += value.size;
    } else {
      length += Buffer.byteLength(String(value));
    }
    length += carriageLength;
  }
  length += Buffer.byteLength(getFooter(boundary));
  return length;
}
var INTERNALS$2 = Symbol("Body internals");
var Body = class {
  constructor(body, {
    size = 0
  } = {}) {
    let boundary = null;
    if (body === null) {
      body = null;
    } else if (isURLSearchParameters(body)) {
      body = Buffer.from(body.toString());
    } else if (isBlob(body))
      ;
    else if (Buffer.isBuffer(body))
      ;
    else if (import_util.types.isAnyArrayBuffer(body)) {
      body = Buffer.from(body);
    } else if (ArrayBuffer.isView(body)) {
      body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
    } else if (body instanceof import_stream.default)
      ;
    else if (isFormData(body)) {
      boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
      body = import_stream.default.Readable.from(formDataIterator(body, boundary));
    } else {
      body = Buffer.from(String(body));
    }
    this[INTERNALS$2] = {
      body,
      boundary,
      disturbed: false,
      error: null
    };
    this.size = size;
    if (body instanceof import_stream.default) {
      body.on("error", (err) => {
        const error3 = err instanceof FetchBaseError ? err : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${err.message}`, "system", err);
        this[INTERNALS$2].error = error3;
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
    return new fetchBlob([buf], {
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
async function consumeBody(data) {
  if (data[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS$2].disturbed = true;
  if (data[INTERNALS$2].error) {
    throw data[INTERNALS$2].error;
  }
  let { body } = data;
  if (body === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body)) {
    body = body.stream();
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (!(body instanceof import_stream.default)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const err = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(err);
        throw err;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error3) {
    if (error3 instanceof FetchBaseError) {
      throw error3;
    } else {
      throw new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error3.message}`, "system", error3);
    }
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error3) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error3.message}`, "system", error3);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
var clone = (instance, highWaterMark) => {
  let p1;
  let p2;
  let { body } = instance;
  if (instance.bodyUsed) {
    throw new Error("cannot clone body after it is used");
  }
  if (body instanceof import_stream.default && typeof body.getBoundary !== "function") {
    p1 = new import_stream.PassThrough({ highWaterMark });
    p2 = new import_stream.PassThrough({ highWaterMark });
    body.pipe(p1);
    body.pipe(p2);
    instance[INTERNALS$2].body = p1;
    body = p2;
  }
  return body;
};
var extractContentType = (body, request) => {
  if (body === null) {
    return null;
  }
  if (typeof body === "string") {
    return "text/plain;charset=UTF-8";
  }
  if (isURLSearchParameters(body)) {
    return "application/x-www-form-urlencoded;charset=UTF-8";
  }
  if (isBlob(body)) {
    return body.type || null;
  }
  if (Buffer.isBuffer(body) || import_util.types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
    return null;
  }
  if (body && typeof body.getBoundary === "function") {
    return `multipart/form-data;boundary=${body.getBoundary()}`;
  }
  if (isFormData(body)) {
    return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
  }
  if (body instanceof import_stream.default) {
    return null;
  }
  return "text/plain;charset=UTF-8";
};
var getTotalBytes = (request) => {
  const { body } = request;
  if (body === null) {
    return 0;
  }
  if (isBlob(body)) {
    return body.size;
  }
  if (Buffer.isBuffer(body)) {
    return body.length;
  }
  if (body && typeof body.getLengthSync === "function") {
    return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
  }
  if (isFormData(body)) {
    return getFormDataLength(request[INTERNALS$2].boundary);
  }
  return null;
};
var writeToStream = (dest, { body }) => {
  if (body === null) {
    dest.end();
  } else if (isBlob(body)) {
    body.stream().pipe(dest);
  } else if (Buffer.isBuffer(body)) {
    dest.write(body);
    dest.end();
  } else {
    body.pipe(dest);
  }
};
var validateHeaderName = typeof import_http.default.validateHeaderName === "function" ? import_http.default.validateHeaderName : (name) => {
  if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
    const err = new TypeError(`Header name must be a valid HTTP token [${name}]`);
    Object.defineProperty(err, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
    throw err;
  }
};
var validateHeaderValue = typeof import_http.default.validateHeaderValue === "function" ? import_http.default.validateHeaderValue : (name, value) => {
  if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
    const err = new TypeError(`Invalid character in header content ["${name}"]`);
    Object.defineProperty(err, "code", { value: "ERR_INVALID_CHAR" });
    throw err;
  }
};
var Headers = class extends URLSearchParams {
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
              return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase(), String(value));
            };
          case "delete":
          case "has":
          case "getAll":
            return (name) => {
              validateHeaderName(name);
              return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase());
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
  forEach(callback) {
    for (const name of this.keys()) {
      callback(this.get(name), name);
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
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index2, array) => {
    if (index2 % 2 === 0) {
      result.push(array.slice(index2, index2 + 2));
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
var redirectStatus = new Set([301, 302, 303, 307, 308]);
var isRedirect = (code) => {
  return redirectStatus.has(code);
};
var INTERNALS$1 = Symbol("Response internals");
var Response2 = class extends Body {
  constructor(body = null, options2 = {}) {
    super(body, options2);
    const status = options2.status || 200;
    const headers = new Headers(options2.headers);
    if (body !== null && !headers.has("Content-Type")) {
      const contentType = extractContentType(body);
      if (contentType) {
        headers.append("Content-Type", contentType);
      }
    }
    this[INTERNALS$1] = {
      url: options2.url,
      status,
      statusText: options2.statusText || "",
      headers,
      counter: options2.counter,
      highWaterMark: options2.highWaterMark
    };
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
    return new Response2(clone(this, this.highWaterMark), {
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
    return new Response2(null, {
      headers: {
        location: new URL(url).toString()
      },
      status
    });
  }
  get [Symbol.toStringTag]() {
    return "Response";
  }
};
Object.defineProperties(Response2.prototype, {
  url: { enumerable: true },
  status: { enumerable: true },
  ok: { enumerable: true },
  redirected: { enumerable: true },
  statusText: { enumerable: true },
  headers: { enumerable: true },
  clone: { enumerable: true }
});
var getSearch = (parsedURL) => {
  if (parsedURL.search) {
    return parsedURL.search;
  }
  const lastOffset = parsedURL.href.length - 1;
  const hash2 = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
  return parsedURL.href[lastOffset - hash2.length] === "?" ? "?" : "";
};
var INTERNALS = Symbol("Request internals");
var isRequest = (object) => {
  return typeof object === "object" && typeof object[INTERNALS] === "object";
};
var Request = class extends Body {
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
    if (signal !== null && !isAbortSignal(signal)) {
      throw new TypeError("Expected signal to be an instanceof AbortSignal");
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
var getNodeRequestOptions = (request) => {
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
var AbortError = class extends FetchBaseError {
  constructor(message, type = "aborted") {
    super(message, type);
  }
};
var supportedSchemas = new Set(["data:", "http:", "https:"]);
async function fetch2(url, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url, options_);
    const options2 = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options2.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${options2.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options2.protocol === "data:") {
      const data = src(request.url);
      const response2 = new Response2(data, { headers: { "Content-Type": data.typeFull } });
      resolve2(response2);
      return;
    }
    const send = (options2.protocol === "https:" ? import_https.default : import_http.default).request;
    const { signal } = request;
    let response = null;
    const abort = () => {
      const error3 = new AbortError("The operation was aborted.");
      reject(error3);
      if (request.body && request.body instanceof import_stream.default.Readable) {
        request.body.destroy(error3);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error3);
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
    request_.on("error", (err) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, "system", err));
      finalize();
    });
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
              try {
                headers.set("Location", locationURL);
              } catch (error3) {
                reject(error3);
              }
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
            resolve2(fetch2(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
        }
      }
      response_.once("end", () => {
        if (signal) {
          signal.removeEventListener("abort", abortAndFinalize);
        }
      });
      let body = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error3) => {
        reject(error3);
      });
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
        response = new Response2(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: import_zlib.default.Z_SYNC_FLUSH,
        finishFlush: import_zlib.default.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createGunzip(zlibOptions), (error3) => {
          reject(error3);
        });
        response = new Response2(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error3) => {
          reject(error3);
        });
        raw.once("data", (chunk) => {
          if ((chunk[0] & 15) === 8) {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflate(), (error3) => {
              reject(error3);
            });
          } else {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflateRaw(), (error3) => {
              reject(error3);
            });
          }
          response = new Response2(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createBrotliDecompress(), (error3) => {
          reject(error3);
        });
        response = new Response2(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response2(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
globalThis.fetch = fetch2;
globalThis.Response = Response2;
globalThis.Request = Request;
globalThis.Headers = Headers;

// node_modules/@sveltejs/kit/dist/ssr.js
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
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
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
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
  }).sort(function(a2, b2) {
    return b2[1] - a2[1];
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
function noop() {
}
function safe_not_equal(a2, b2) {
  return a2 != a2 ? b2 == b2 : a2 !== b2 || (a2 && typeof a2 === "object" || typeof a2 === "function");
}
var subscriber_queue = [];
function writable(value, start = noop) {
  let stop;
  const subscribers = [];
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (let i = 0; i < subscribers.length; i += 1) {
          const s2 = subscribers[i];
          s2[1]();
          subscriber_queue.push(s2, value);
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
  function subscribe2(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      const index2 = subscribers.indexOf(subscriber);
      if (index2 !== -1) {
        subscribers.splice(index2, 1);
      }
      if (subscribers.length === 0) {
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
var s$1 = JSON.stringify;
async function render_response({
  options: options2,
  $session,
  page_config,
  status,
  error: error3,
  branch,
  page: page2
}) {
  const css2 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error3) {
    error3.stack = options2.get_stack(error3);
  }
  if (branch) {
    branch.forEach(({ node, loaded, fetched, uses_credentials }) => {
      if (node.css)
        node.css.forEach((url) => css2.add(url));
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
    ...Array.from(css2).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"><\/script>`;
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error4) => {
      throw new Error(`Failed to serialize session data: ${error4.message}`);
    })},
				host: ${page2 && page2.host ? s$1(page2.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				trailing_slash: ${s$1(options2.trailing_slash)},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error3)},
					nodes: [
						${branch.map(({ node }) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page2.host ? s$1(page2.host) : "location.host"}, // TODO this is redundant
						path: ${s$1(page2.path)},
						query: new URLSearchParams(${s$1(page2.query.toString())}),
						params: ${s$1(page2.params)}
					}
				}` : "null"}
			});
		<\/script>`;
  }
  const head = [
    rendered.head,
    styles.size && !options2.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({ url, body: body2, json }) => {
    return body2 ? `<script type="svelte-data" url="${url}" body="${hash(body2)}">${json}<\/script>` : `<script type="svelte-data" url="${url}">${json}<\/script>`;
  }).join("\n\n			")}
		`.replace(/^\t{2}/gm, "");
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
    body: options2.template({ head, body })
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(err);
    return null;
  }
}
function serialize_error(error3) {
  if (!error3)
    return null;
  let serialized = try_serialize(error3);
  if (!serialized) {
    const { name, message, stack } = error3;
    serialized = try_serialize({ name, message, stack });
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded) {
  if (loaded.error) {
    const error3 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    const status = loaded.status;
    if (!(error3 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error3}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return { status: 500, error: error3 };
    }
    return { status, error: error3 };
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
  return loaded;
}
function resolve(base, path) {
  const baseparts = path[0] === "/" ? [] : base.slice(1).split("/");
  const pathparts = path[0] === "/" ? path.slice(1).split("/") : path.split("/");
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
  return `/${baseparts.join("/")}`;
}
var s = JSON.stringify;
async function load_node({
  request,
  options: options2,
  state,
  route,
  page: page2,
  node,
  $session,
  context,
  is_leaf,
  is_error,
  status,
  error: error3
}) {
  const { module: module2 } = node;
  let uses_credentials = false;
  const fetched = [];
  let loaded;
  if (module2.load) {
    const load_input = {
      page: page2,
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
        if (options2.read && url.startsWith(options2.paths.assets)) {
          url = url.replace(options2.paths.assets, "");
        }
        if (url.startsWith("//")) {
          throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
        }
        let response;
        if (/^[a-zA-Z]+:/.test(url)) {
          response = await fetch(url, opts);
        } else {
          const [path, search] = url.split("?");
          const resolved = resolve(request.path, path);
          const filename = resolved.slice(1);
          const filename_html = `${filename}/index.html`;
          const asset = options2.manifest.assets.find((d) => d.file === filename || d.file === filename_html);
          if (asset) {
            if (options2.read) {
              response = new Response(options2.read(asset.file), {
                headers: {
                  "content-type": asset.type
                }
              });
            } else {
              response = await fetch(`http://${page2.host}/${asset.file}`, opts);
            }
          }
          if (!response) {
            const headers = { ...opts.headers };
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
            const rendered = await respond({
              host: request.host,
              method: opts.method || "GET",
              headers,
              path: resolved,
              rawBody: opts.body,
              query: new URLSearchParams(search)
            }, options2, {
              fetched: url,
              initiator: route
            });
            if (rendered) {
              if (state.prerender) {
                state.prerender.dependencies.set(resolved, rendered);
              }
              response = new Response(rendered.body, {
                status: rendered.status,
                headers: rendered.headers
              });
            }
          }
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, receiver) {
              async function text() {
                const body = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 !== "etag" && key2 !== "set-cookie")
                    headers[key2] = value;
                }
                if (!opts.body || typeof opts.body === "string") {
                  fetched.push({
                    url,
                    body: opts.body,
                    json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":${escape(body)}}`
                  });
                }
                return body;
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
      context: { ...context }
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error3;
    }
    loaded = await module2.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  return {
    node,
    loaded: normalize(loaded),
    context: loaded.context || context,
    fetched,
    uses_credentials
  };
}
var escaped = {
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
function escape(str) {
  let result = '"';
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped) {
      result += escaped[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += `\\u${code.toString(16).toUpperCase()}`;
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
async function respond_with_error({ request, options: options2, state, $session, status, error: error3 }) {
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
    context: {},
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
      context: loaded.context,
      is_leaf: false,
      is_error: true,
      status,
      error: error3
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
      error: error3,
      branch,
      page: page2
    });
  } catch (error4) {
    options2.handle_error(error4);
    return {
      status: 500,
      headers: {},
      body: error4.stack
    };
  }
}
async function respond$1({ request, options: options2, state, $session, route }) {
  const match = route.pattern.exec(request.path);
  const params = route.params(match);
  const page2 = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => id && options2.load_component(id)));
  } catch (error4) {
    options2.handle_error(error4);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error4
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  const page_config = {
    ssr: "ssr" in leaf ? leaf.ssr : options2.ssr,
    router: "router" in leaf ? leaf.router : options2.router,
    hydrate: "hydrate" in leaf ? leaf.hydrate : options2.hydrate
  };
  if (!leaf.prerender && state.prerender && !state.prerender.all) {
    return {
      status: 204,
      headers: {},
      body: null
    };
  }
  let branch;
  let status = 200;
  let error3;
  ssr:
    if (page_config.ssr) {
      let context = {};
      branch = [];
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              request,
              options: options2,
              state,
              route,
              page: page2,
              node,
              $session,
              context,
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            if (loaded.loaded.redirect) {
              return {
                status: loaded.loaded.status,
                headers: {
                  location: encodeURI(loaded.loaded.redirect)
                }
              };
            }
            if (loaded.loaded.error) {
              ({ status, error: error3 } = loaded.loaded);
            }
          } catch (e) {
            options2.handle_error(e);
            status = 500;
            error3 = e;
          }
          if (error3) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options2.load_component(route.b[i]);
                let error_loaded;
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  error_loaded = await load_node({
                    request,
                    options: options2,
                    state,
                    route,
                    page: page2,
                    node: error_node,
                    $session,
                    context: node_loaded.context,
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error3
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (e) {
                  options2.handle_error(e);
                  continue;
                }
              }
            }
            return await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error: error3
            });
          }
        }
        branch.push(loaded);
        if (loaded && loaded.loaded.context) {
          context = {
            ...context,
            ...loaded.loaded.context
          };
        }
      }
    }
  try {
    return await render_response({
      options: options2,
      $session,
      page_config,
      status,
      error: error3,
      branch: branch && branch.filter(Boolean),
      page: page2
    });
  } catch (error4) {
    options2.handle_error(error4);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error4
    });
  }
}
async function render_page(request, route, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const $session = await options2.hooks.getSession(request);
  if (route) {
    const response = await respond$1({
      request,
      options: options2,
      state,
      $session,
      route
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
  } else {
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 404,
      error: new Error(`Not found: ${request.path}`)
    });
  }
}
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function error(body) {
  return {
    status: 500,
    body,
    headers: {}
  };
}
async function render_route(request, route) {
  const mod = await route.load();
  const handler = mod[request.method.toLowerCase().replace("delete", "del")];
  if (handler) {
    const match = route.pattern.exec(request.path);
    const params = route.params(match);
    const response = await handler({ ...request, params });
    if (response) {
      if (typeof response !== "object") {
        return error(`Invalid response from route ${request.path}: expected an object, got ${typeof response}`);
      }
      let { status = 200, body, headers = {} } = response;
      headers = lowercase_keys(headers);
      const type = headers["content-type"];
      if (type === "application/octet-stream" && !(body instanceof Uint8Array)) {
        return error(`Invalid response from route ${request.path}: body must be an instance of Uint8Array if content type is application/octet-stream`);
      }
      if (body instanceof Uint8Array && type !== "application/octet-stream") {
        return error(`Invalid response from route ${request.path}: Uint8Array body must be accompanied by content-type: application/octet-stream header`);
      }
      let normalized_body;
      if (typeof body === "object" && (!type || type === "application/json")) {
        headers = { ...headers, "content-type": "application/json" };
        normalized_body = JSON.stringify(body);
      } else {
        normalized_body = body;
      }
      return { status, body: normalized_body, headers };
    }
  }
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        map.get(key).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
var ReadOnlyFormData = class {
  #map;
  constructor(map) {
    this.#map = map;
  }
  get(key) {
    const value = this.#map.get(key);
    return value && value[0];
  }
  getAll(key) {
    return this.#map.get(key);
  }
  has(key) {
    return this.#map.has(key);
  }
  *[Symbol.iterator]() {
    for (const [key, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *entries() {
    for (const [key, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *keys() {
    for (const [key, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield key;
      }
    }
  }
  *values() {
    for (const [, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield value;
      }
    }
  }
};
function parse_body(raw, headers) {
  if (!raw)
    return raw;
  const [type, ...directives] = headers["content-type"].split(/;\s*/);
  if (typeof raw === "string") {
    switch (type) {
      case "text/plain":
        return raw;
      case "application/json":
        return JSON.parse(raw);
      case "application/x-www-form-urlencoded":
        return get_urlencoded(raw);
      case "multipart/form-data": {
        const boundary = directives.find((directive) => directive.startsWith("boundary="));
        if (!boundary)
          throw new Error("Missing boundary");
        return get_multipart(raw, boundary.slice("boundary=".length));
      }
      default:
        throw new Error(`Invalid Content-Type ${type}`);
    }
  }
  return raw;
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
  const nope = () => {
    throw new Error("Malformed form data");
  };
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    nope();
  }
  const { data, append } = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    const raw_headers = match[1];
    const body = match[2].trim();
    let key;
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name, value] = raw_header.split(": ");
      name = name.toLowerCase();
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name2, value2] = raw_directive.split("=");
        directives[name2] = JSON.parse(value2);
      });
      if (name === "content-disposition") {
        if (value !== "form-data")
          nope();
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      nope();
    append(key, body);
  });
  return data;
}
async function respond(incoming, options2, state = {}) {
  if (incoming.path !== "/" && options2.trailing_slash !== "ignore") {
    const has_trailing_slash = incoming.path.endsWith("/");
    if (has_trailing_slash && options2.trailing_slash === "never" || !has_trailing_slash && options2.trailing_slash === "always" && !incoming.path.split("/").pop().includes(".")) {
      const path = has_trailing_slash ? incoming.path.slice(0, -1) : incoming.path + "/";
      const q = incoming.query.toString();
      return {
        status: 301,
        headers: {
          location: encodeURI(path + (q ? `?${q}` : ""))
        }
      };
    }
  }
  try {
    const headers = lowercase_keys(incoming.headers);
    return await options2.hooks.handle({
      request: {
        ...incoming,
        headers,
        body: parse_body(incoming.rawBody, headers),
        params: null,
        locals: {}
      },
      resolve: async (request) => {
        if (state.prerender && state.prerender.fallback) {
          return await render_response({
            options: options2,
            $session: await options2.hooks.getSession(request),
            page_config: { ssr: false, router: true, hydrate: true },
            status: 200,
            error: null,
            branch: [],
            page: null
          });
        }
        for (const route of options2.manifest.routes) {
          if (!route.pattern.test(request.path))
            continue;
          const response = route.type === "endpoint" ? await render_route(request, route) : await render_page(request, route, options2, state);
          if (response) {
            if (response.status === 200) {
              if (!/(no-store|immutable)/.test(response.headers["cache-control"])) {
                const etag = `"${hash(response.body)}"`;
                if (request.headers["if-none-match"] === etag) {
                  return {
                    status: 304,
                    headers: {},
                    body: null
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        return await render_page(request, null, options2, state);
      }
    });
  } catch (e) {
    options2.handle_error(e);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e.stack : e.message
    };
  }
}

// node_modules/svelte/internal/index.mjs
function noop2() {
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
function is_function(thing) {
  return typeof thing === "function";
}
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop2;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
var tasks = new Set();
function custom_event(type, detail) {
  const e = document.createEvent("CustomEvent");
  e.initCustomEvent(type, false, false, detail);
  return e;
}
var active_docs = new Set();
var current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
  get_current_component().$$.after_update.push(fn);
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
var resolved_promise = Promise.resolve();
var seen_callbacks = new Set();
var outroing = new Set();
var globals = typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : global;
var boolean_attributes = new Set([
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
var escaped2 = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escape2(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped2[match]);
}
function each(items, fn) {
  let str = "";
  for (let i = 0; i < items.length; i += 1) {
    str += fn(items[i], i);
  }
  return str;
}
var missing_component = {
  $$render: () => ""
};
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
var on_destroy;
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(parent_component ? parent_component.$$.context : context || []),
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
          code: Array.from(result.css).map((css2) => css2.code).join("\n"),
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
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape2(value)) : `"${value}"`}`}`;
}
function destroy_component(component, detaching) {
  const $$ = component.$$;
  if ($$.fragment !== null) {
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching);
    $$.on_destroy = $$.fragment = null;
    $$.ctx = [];
  }
}
var SvelteElement;
if (typeof HTMLElement === "function") {
  SvelteElement = class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
      const { on_mount } = this.$$;
      this.$$.on_disconnect = on_mount.map(run).filter(is_function);
      for (const key in this.$$.slotted) {
        this.appendChild(this.$$.slotted[key]);
      }
    }
    attributeChangedCallback(attr, _oldValue, newValue) {
      this[attr] = newValue;
    }
    disconnectedCallback() {
      run_all(this.$$.on_disconnect);
    }
    $destroy() {
      destroy_component(this, 1);
      this.$destroy = noop2;
    }
    $on(type, callback) {
      const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
      callbacks.push(callback);
      return () => {
        const index2 = callbacks.indexOf(callback);
        if (index2 !== -1)
          callbacks.splice(index2, 1);
      };
    }
    $set($$props) {
      if (this.$$set && !is_empty($$props)) {
        this.$$.skip_bound = true;
        this.$$set($$props);
        this.$$.skip_bound = false;
      }
    }
  };
}

// .svelte-kit/output/server/app.js
var css$2 = {
  code: "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\texport let props_2 = null;\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title || 'untitled page';\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n<\/script>\\n\\n<svelte:component this={components[0]} {...(props_0 || {})}>\\n\\t{#if components[1]}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}>\\n\\t\\t\\t{#if components[2]}\\n\\t\\t\\t\\t<svelte:component this={components[2]} {...(props_2 || {})}/>\\n\\t\\t\\t{/if}\\n\\t\\t</svelte:component>\\n\\t{/if}\\n</svelte:component>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\t{title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>\\n\\t#svelte-announcer {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\ttop: 0;\\n\\t\\tclip: rect(0 0 0 0);\\n\\t\\tclip-path: inset(50%);\\n\\t\\toverflow: hidden;\\n\\t\\twhite-space: nowrap;\\n\\t\\twidth: 1px;\\n\\t\\theight: 1px;\\n\\t}\\n</style>"],"names":[],"mappings":"AAsDC,iBAAiB,eAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACnB,SAAS,CAAE,MAAM,GAAG,CAAC,CACrB,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,AACZ,CAAC"}`
};
var Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { stores } = $$props;
  let { page: page2 } = $$props;
  let { components } = $$props;
  let { props_0 = null } = $$props;
  let { props_1 = null } = $$props;
  let { props_2 = null } = $$props;
  setContext("__svelte__", stores);
  afterUpdate(stores.page.notify);
  let mounted = false;
  let navigated = false;
  let title = null;
  onMount(() => {
    const unsubscribe = stores.page.subscribe(() => {
      if (mounted) {
        navigated = true;
        title = document.title || "untitled page";
      }
    });
    mounted = true;
    return unsubscribe;
  });
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
  $$result.css.add(css$2);
  {
    stores.page.set(page2);
  }
  return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
    default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
      default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {})}` : ``}`
    })}` : ``}`
  })}

${mounted ? `<div id="${"svelte-announcer"}" aria-live="${"assertive"}" aria-atomic="${"true"}" class="${"svelte-1j55zn5"}">${navigated ? `${escape2(title)}` : ``}</div>` : ``}`;
});
function set_paths(paths) {
}
function set_prerendering(value) {
}
var getPosts = async () => {
  let posts = await Promise.all(Object.entries({ "/src/routes/blog/a.md": () => Promise.resolve().then(function() {
    return a;
  }), "/src/routes/blog/b.md": () => Promise.resolve().then(function() {
    return b;
  }), "/src/routes/blog/learning-facilitation.md": () => Promise.resolve().then(function() {
    return learningFacilitation;
  }), "/src/routes/blog/political-economy.md": () => Promise.resolve().then(function() {
    return politicalEconomy;
  }), "/src/routes/blog/xianxiafensibao.md": () => Promise.resolve().then(function() {
    return xianxiafensibao;
  }) }).map(async ([path, page2]) => {
    const { metadata: metadata2 } = await page2();
    let pathComponents = path.split("/");
    const filename = pathComponents.pop();
    const slug = filename.split(".md", 1)[0];
    return { ...metadata2, filename, slug };
  }));
  posts.sort((a2, b2) => Date.parse(b2.date) - Date.parse(a2.date));
  return posts;
};
var getSession = async () => {
  return {
    posts: await getPosts()
  };
};
var user_hooks = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  getSession
});
var template = ({ head, body }) => '<!DOCTYPE html>\n<html lang="en">\n	<head>\n		<meta charset="utf-8" />\n		<link rel="icon" href="/favicon.png" />\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\n\n		' + head + '\n	</head>\n	<body>\n		<div id="svelte">' + body + "</div>\n	</body>\n</html>\n";
var options = null;
function init(settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: "/./_app/start-d44c12a0.js",
      css: ["/./_app/assets/start-8077b9bf.css"],
      js: ["/./_app/start-d44c12a0.js", "/./_app/chunks/vendor-bbaf0a40.js"]
    },
    fetched: void 0,
    floc: false,
    get_component_path: (id) => "/./_app/" + entry_lookup[id],
    get_stack: (error22) => String(error22),
    handle_error: (error22) => {
      console.error(error22.stack);
      error22.stack = options.get_stack(error22);
    },
    hooks: get_hooks(user_hooks),
    hydrate: true,
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    read: settings.read,
    root: Root,
    router: true,
    ssr: true,
    target: "#svelte",
    template,
    trailing_slash: "never"
  };
}
var empty = () => ({});
var manifest = {
  assets: [{ "file": "favicon.png", "size": 1571, "type": "image/png" }, { "file": "images/attitude.png", "size": 56155, "type": "image/png" }, { "file": "images/avatar.jpeg", "size": 23509, "type": "image/jpeg" }, { "file": "images/lanke.webp", "size": 35906, "type": "image/webp" }, { "file": "images/talk.png", "size": 22563, "type": "image/png" }, { "file": "images/xianxia.jpg", "size": 2664675, "type": "image/jpeg" }, { "file": "pdfs/facilitation.pdf", "size": 1242249, "type": "application/pdf" }, { "file": "pdfs/lp.pdf", "size": 583446, "type": "application/pdf" }, { "file": "robots.txt", "size": 67, "type": "text/plain" }, { "file": "svelte-welcome.png", "size": 360807, "type": "image/png" }, { "file": "svelte-welcome.webp", "size": 115470, "type": "image/webp" }],
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
      pattern: /^\/about\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/about.svelte"],
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
      pattern: /^\/blog\/learning-facilitation\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/blog/learning-facilitation.md"],
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
      pattern: /^\/blog\/xianxiafensibao\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/blog/xianxiafensibao.md"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/blog\/a\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/blog/a.md"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/blog\/b\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/blog/b.md"],
      b: [".svelte-kit/build/components/error.svelte"]
    }
  ]
};
var get_hooks = (hooks) => ({
  getSession: hooks.getSession || (() => ({})),
  handle: hooks.handle || (({ request, resolve: resolve2 }) => resolve2(request))
});
var module_lookup = {
  "src/routes/__layout.svelte": () => Promise.resolve().then(function() {
    return __layout;
  }),
  ".svelte-kit/build/components/error.svelte": () => Promise.resolve().then(function() {
    return error2;
  }),
  "src/routes/index.svelte": () => Promise.resolve().then(function() {
    return index$2;
  }),
  "src/routes/about.svelte": () => Promise.resolve().then(function() {
    return about;
  }),
  "src/routes/talks/index.svelte": () => Promise.resolve().then(function() {
    return index$1;
  }),
  "src/routes/blog/index.svelte": () => Promise.resolve().then(function() {
    return index;
  }),
  "src/routes/blog/learning-facilitation.md": () => Promise.resolve().then(function() {
    return learningFacilitation;
  }),
  "src/routes/blog/political-economy.md": () => Promise.resolve().then(function() {
    return politicalEconomy;
  }),
  "src/routes/blog/xianxiafensibao.md": () => Promise.resolve().then(function() {
    return xianxiafensibao;
  }),
  "src/routes/blog/a.md": () => Promise.resolve().then(function() {
    return a;
  }),
  "src/routes/blog/b.md": () => Promise.resolve().then(function() {
    return b;
  })
};
var metadata_lookup = { "src/routes/__layout.svelte": { "entry": "/./_app/pages/__layout.svelte-eee3285e.js", "css": ["/./_app/assets/pages/__layout.svelte-d50188c3.css"], "js": ["/./_app/pages/__layout.svelte-eee3285e.js", "/./_app/chunks/vendor-bbaf0a40.js"], "styles": null }, ".svelte-kit/build/components/error.svelte": { "entry": "/./_app/error.svelte-e5250758.js", "css": [], "js": ["/./_app/error.svelte-e5250758.js", "/./_app/chunks/vendor-bbaf0a40.js"], "styles": null }, "src/routes/index.svelte": { "entry": "/./_app/pages/index.svelte-7d824dd0.js", "css": [], "js": ["/./_app/pages/index.svelte-7d824dd0.js", "/./_app/chunks/vendor-bbaf0a40.js"], "styles": null }, "src/routes/about.svelte": { "entry": "/./_app/pages/about.svelte-94d8fb29.js", "css": [], "js": ["/./_app/pages/about.svelte-94d8fb29.js", "/./_app/chunks/vendor-bbaf0a40.js"], "styles": null }, "src/routes/talks/index.svelte": { "entry": "/./_app/pages/talks/index.svelte-31303867.js", "css": [], "js": ["/./_app/pages/talks/index.svelte-31303867.js", "/./_app/chunks/vendor-bbaf0a40.js", "/./_app/chunks/date-024ef54f.js"], "styles": null }, "src/routes/blog/index.svelte": { "entry": "/./_app/pages/blog/index.svelte-8473dc06.js", "css": [], "js": ["/./_app/pages/blog/index.svelte-8473dc06.js", "/./_app/chunks/vendor-bbaf0a40.js", "/./_app/chunks/date-024ef54f.js"], "styles": null }, "src/routes/blog/learning-facilitation.md": { "entry": "/./_app/pages/blog/learning-facilitation.md-e5b65a68.js", "css": [], "js": ["/./_app/pages/blog/learning-facilitation.md-e5b65a68.js", "/./_app/chunks/vendor-bbaf0a40.js", "/./_app/chunks/postLayout-62e65132.js", "/./_app/chunks/date-024ef54f.js"], "styles": null }, "src/routes/blog/political-economy.md": { "entry": "/./_app/pages/blog/political-economy.md-d4085844.js", "css": [], "js": ["/./_app/pages/blog/political-economy.md-d4085844.js", "/./_app/chunks/vendor-bbaf0a40.js", "/./_app/chunks/postLayout-62e65132.js", "/./_app/chunks/date-024ef54f.js"], "styles": null }, "src/routes/blog/xianxiafensibao.md": { "entry": "/./_app/pages/blog/xianxiafensibao.md-989e2d55.js", "css": [], "js": ["/./_app/pages/blog/xianxiafensibao.md-989e2d55.js", "/./_app/chunks/vendor-bbaf0a40.js", "/./_app/chunks/postLayout-62e65132.js", "/./_app/chunks/date-024ef54f.js"], "styles": null }, "src/routes/blog/a.md": { "entry": "/./_app/pages/blog/a.md-b8e230e5.js", "css": [], "js": ["/./_app/pages/blog/a.md-b8e230e5.js", "/./_app/chunks/vendor-bbaf0a40.js", "/./_app/chunks/postLayout-62e65132.js", "/./_app/chunks/date-024ef54f.js"], "styles": null }, "src/routes/blog/b.md": { "entry": "/./_app/pages/blog/b.md-f510b02a.js", "css": [], "js": ["/./_app/pages/blog/b.md-f510b02a.js", "/./_app/chunks/vendor-bbaf0a40.js", "/./_app/chunks/postLayout-62e65132.js", "/./_app/chunks/date-024ef54f.js"], "styles": null } };
async function load_component(file) {
  return {
    module: await module_lookup[file](),
    ...metadata_lookup[file]
  };
}
init({ paths: { "base": "", "assets": "/." } });
function render(request, {
  prerender: prerender2
} = {}) {
  const host = request.headers["host"];
  return respond({ ...request, host }, options, { prerender: prerender2 });
}
var formatDate = (value) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium"
  }).format(date);
};
var PostLayout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { title } = $$props;
  let { date } = $$props;
  let dateDisplay = formatDate(date);
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  if ($$props.date === void 0 && $$bindings.date && date !== void 0)
    $$bindings.date(date);
  return `${$$result.head += `${$$result.title = `<title>${escape2(title)} - J\xF6kull S\xF3lberg</title>`, ""}`, ""}

<div class="${"prose prose-sm sm:prose page max-w-none sm:max-w-none"}"><div class="${"py-8 sm:py-10 sm:text-center"}"><div class="${"font-bold text-4xl mb-4"}">${escape2(title)}</div>
		<div class="${"text-sm"}">${escape2(dateDisplay)}</div></div>
	
	${slots.default ? slots.default({}) : ``}</div>`;
});
var metadata$4 = {
  "title": "The First Post",
  "date": "2021-06-20",
  "tags": ["\u653F\u6CBB"]
};
var A = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(PostLayout, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign($$props, metadata$4), {}, {
    default: () => `<p>This is the first post.</p>`
  })}`;
});
var a = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": A,
  metadata: metadata$4
});
var metadata$3 = {
  "title": "The Second Post",
  "date": "2021-06-18"
};
var B = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(PostLayout, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign($$props, metadata$3), {}, {
    default: () => `<p>This is the second post.</p>`
  })}`;
});
var b = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": B,
  metadata: metadata$3
});
var metadata$2 = {
  "title": "Notes for Learning Facilitation",
  "date": "2021-04-26",
  "tags": ["\u57F9\u8BAD", "\u6559\u5B66\u8F85\u5BFC"],
  "category": "\u5DE5\u4F5C"
};
var Learning_facilitation = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(PostLayout, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign($$props, metadata$2), {}, {
    default: () => `<p>Here are some points I learn from class debate during ACTA training.  </p>
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
var learningFacilitation = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Learning_facilitation,
  metadata: metadata$2
});
var metadata$1 = {
  "title": "\u7B80\u660E\u653F\u6CBB\u7ECF\u6D4E\u5B66",
  "date": "2021-03-29",
  "tags": ["\u6BB5\u5B50", "\u653F\u6CBB"],
  "category": "\u5B66\u4E60"
};
var Political_economy = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(PostLayout, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign($$props, metadata$1), {}, {
    default: () => `<p>\u4EC0\u4E48\u662F\u7ECF\u6D4E\uFF1F\u7ECF\u6D4E\u5C31\u662F\u505A\u86CB\u7CD5\u3002</p>
<p>\u4EC0\u4E48\u662F\u653F\u6CBB\uFF1F\u653F\u6CBB\u5C31\u662F\u5206\u86CB\u7CD5\u3002</p>
<p>\u4EC0\u4E48\u662F\u5236\u5EA6\uFF1F\u5236\u5EA6\u5C31\u662F\u89C4\u5B9A\u8C01\u5148\u62FF\uFF0C\u8C01\u540E\u62FF\uFF1B\u8C01\u62FF\u5F97\u591A\uFF0C\u8C01\u62FF\u5F97\u5C11\uFF1B\u8C01\u62FF\u5F97\u597D\uFF0C\u8C01\u62FF\u5F97\u5DEE\u3002</p>
<p>\u597D\u5236\u5EA6\uFF1A\u5206\u86CB\u7CD5\u7684\u4EBA\u6700\u540E\u62FF\u86CB\u7CD5\u3002</p>
<p>\u574F\u5236\u5EA6\uFF1A\u5206\u86CB\u7CD5\u7684\u4EBA\u5148\u62FF\u86CB\u7CD5\u3002</p>
<p>\u6700\u574F\u7684\u5236\u5EA6\uFF1A\u5206\u86CB\u7CD5\u7684\u4EBA\u5148\u62FF\u4E86\uFF0C\u591A\u62FF\u4E86\u591A\u5C11\u8FD8\u4E0D\u8BA9\u4EBA\u77E5\u9053\u3002</p>
<p>\u800C\u5BA3\u4F20\uFF0C\u5C31\u662F\u8BA9\u505A\u86CB\u7CD5\u7684\u611F\u8C22\u5206\u86CB\u7CD5\u7684\u3002</p>`
  })}`;
});
var politicalEconomy = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Political_economy,
  metadata: metadata$1
});
var metadata = {
  "title": "\u9C9C\u867E\u7C89\u4E1D\u7172",
  "date": "2021-04-02",
  "tags": ["\u6D77\u9C9C", "\u83DC\u8C31"],
  "category": "\u751F\u6D3B"
};
var Xianxiafensibao = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(PostLayout, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign($$props, metadata), {}, {
    default: () => `<p>\u4ECA\u5929\u662F Good Friday\u3002\u672C\u6765\u60F3\u53EB\u4E2A<a href="${"https://www.facebook.com/wahkungfu/"}" rel="${"nofollow"}">\u86D9\u529F\u592B</a>\u6253\u6253\u7259\u796D\uFF0C\u4E0D\u6599\u4EBA\u5BB6\u5E97\u5927\u6B3A\u5BA2\uFF0C\u516C\u5171\u5047\u671F\u4E0D\u9001\u9910\u3002\u4ECA\u5929\u5403\u4EC0\u4E48\u7684\u95EE\u9898\u4E00\u4E0B\u5B50\u5C31\u6446\u5230\u9762\u524D\u6765\u4E86\u3002</p>
<p>\u9999\u8FA3\u87F9\uFF1F\u4E0D\u9001\u9910\uFF0C\u4E0D\u80FD\u8003\u8651\uFF0C\u8FD8\u8981\u8D76\u5DE5\u5462\u3002</p>
<p>\u6E58\u83DC\u9986\uFF1F\u65B0\u83DC\u54C1\u5C11\uFF0C\u6709\u70B9\u5403\u817B\u4E86\u7684\u611F\u89C9\u3002</p>
<p>\u897F\u5B89\u70E4\u7F8A\uFF1F\u662F\u7F8E\u5473\uFF0C\u53EF\u662F\u6015\u4E0A\u706B\u3002</p>
<p>\u7B97\u4E86\uFF0C\u81EA\u5DF1\u52A8\u624B\uFF0C\u4E30\u8863\u8DB3\u98DF\u3002\u4E0D\u662F\u521A\u5B66\u4E86\u9C9C\u867E\u7C89\u4E1D\u7172\u7684\u505A\u6CD5\u5417\uFF1F\u5F04\uFF01</p>
<img src="${"/images/xianxia.jpg"}" alt="${"xianxia"}" loading="${"lazy"}" width="${"400"}" class="${"block mx-auto w-full md:w-1/2 my-4"}">
<h4 id="${"\u98DF\u6750"}"><a href="${"#\u98DF\u6750"}">\u98DF\u6750</a></h4>
<ul><li>\u9C9C\u867E10\u53EA</li>
<li>\u7C89\u4E1D\u4E24\u628A</li>
<li>\u8471\u3001\u59DC\u3001\u849C\u3001\u5C0F\u5C16\u6912</li>
<li>\u6599\u9152\u3001\u751F\u62BD\u3001\u732A\u6CB9</li></ul>
<h4 id="${"\u98DF\u6750\u5904\u7406"}"><a href="${"#\u98DF\u6750\u5904\u7406"}">\u98DF\u6750\u5904\u7406</a></h4>
<ul><li>\u7C89\u4E1D\u7528\u51C9\u5F00\u6C34\u6D78\u6CE130\u5206\u949F</li>
<li>\u9C9C\u867E\u7528\u76D0\u548C\u6599\u9152\u814C\u523615\u5206\u949F</li>
<li>\u8471\u59DC\u849C\u6912\u5207\u672B\u5907\u7528</li></ul>
<h4 id="${"\u5236\u4F5C"}"><a href="${"#\u5236\u4F5C"}">\u5236\u4F5C</a></h4>
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
var xianxiafensibao = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Xianxiafensibao,
  metadata
});
var getStores = () => {
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
var page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
var Src = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { exclude = [] } = $$props;
  let child;
  createEventDispatcher();
  if ($$props.exclude === void 0 && $$bindings.exclude && exclude !== void 0)
    $$bindings.exclude(exclude);
  return `
<div${add_attribute("this", child, 1)}>${slots.default ? slots.default({}) : ``}</div>`;
});
var css$1 = {
  code: ".active.svelte-1xxynum.svelte-1xxynum{font-weight:700}svg.svelte-1xxynum.svelte-1xxynum{min-height:24px;transition:transform 0.2s ease-in-out}svg.svelte-1xxynum line.svelte-1xxynum{stroke:currentColor;stroke-width:3;transition:transform 0.2s ease-in-out\n	}button.svelte-1xxynum.svelte-1xxynum{z-index:20}.open.svelte-1xxynum svg.svelte-1xxynum{transform:scale(1)\n	}.open.svelte-1xxynum #top.svelte-1xxynum{transform:translate(6px, 0px) rotate(45deg)\n	}.open.svelte-1xxynum #middle.svelte-1xxynum{opacity:0}.open.svelte-1xxynum #bottom.svelte-1xxynum{transform:translate(-12px, 9px) rotate(-45deg)\n	}",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { page } from '$app/stores';\\nimport ClickOutside from \\"svelte-click-outside\\";\\nlet open = false;\\nconst toggleHeader = () => {\\n    open = !open;\\n};\\n<\/script>\\n\\n<header class=\\"sticky m-auto h-20 flex flex-wrap items-center w-full h-18 bg-yellow-50 shadow-lg px-4 md:px-12 top-0\\">\\n    <div>\\n    <img src=\\"/images/avatar.jpeg\\" alt=\\"avatar\\" width=48 height=48 class=\\"m-0\\" />\\n    </div>\\n\\n\\t<div>\\n    <a sveltekit:prefetch href=\\"/\\" class=\\"text-3xl font-bold hover:text-red-900 hover:bg-yellow-50\\">\u4E00\u6307\u7985</a>\\n    </div>\\n      <ClickOutside on:clickoutside=\\"{() => (open = false)}\\">\\n      <button class=\\"text-red-900 cursor-pointer mr-1 md:hidden border-none focus:outline-none\\" class:open on:click={toggleHeader}>\\n        <svg width=32 height=24>\\n          <line id=\\"top\\" x1=0 y1=2  x2=32 y2=2/>\\n          <line id=\\"middle\\" x1=0 y1=12 x2=24 y2=12/>\\n          <line id=\\"bottom\\" x1=0 y1=22 x2=32 y2=22/>\\n        </svg>\\n      </button>\\n    </ClickOutside>\\n\\n\\t<nav class=\\"w-full ml-auto text-lg font-medium md:flex md:w-auto\\" class:hidden=\\"{!open}\\">\\n\\t\\t<ul class=\\"list-none m-0 md:flex\\">\\n\\t\\t\\t<li class:active={$page.path === '/'} ><a sveltekit:prefetch href=\\"/\\" class=\\"block mt-4 mr-4 md:inline-block md:mt-0\\">Home</a></li>\\n\\t\\t\\t<li class:active={$page.path === '/blog'} ><a sveltekit:prefetch href=\\"/blog\\" class=\\"block mt-4 mr-4 md:inline-block md:mt-0\\">Blog</a></li>\\n\\t\\t\\t<li class:active={$page.path === '/talks'} ><a sveltekit:prefetch href=\\"/talks\\" class=\\"block mt-4 mr-4 md:inline-block md:mt-0\\">Talks</a></li>\\n\\t\\t\\t<li class:active={$page.path === '/about'} ><a sveltekit:prefetch href=\\"/about\\" class=\\"block mt-4 mr-4 md:inline-block md:mt-0\\">About</a></li>\\n\\t\\t</ul>\\t\\n\\t</nav>\\n</header>\\n\\n<style>\\n\\t\\n\\t.active {\\n\\t\\tfont-weight: 700;\\n\\t}\\n\\tsvg {\\n\\t\\tmin-height: 24px;\\n\\t\\ttransition: transform 0.2s ease-in-out;\\n\\t}\\n\\t\\n\\tsvg line {\\n\\t\\tstroke: currentColor;\\n\\t\\tstroke-width: 3;\\n\\t\\ttransition: transform 0.2s ease-in-out\\n\\t}\\n\\t\\n\\tbutton {\\n\\t\\tz-index: 20;\\n\\t}\\n\\t\\n\\t.open svg {\\n\\t\\ttransform: scale(1)\\n\\t}\\n\\t\\n\\t.open #top {\\n\\t\\ttransform: translate(6px, 0px) rotate(45deg)\\n\\t}\\n\\t\\n\\t.open #middle {\\n\\t\\topacity: 0;\\n\\t}\\n\\t\\n  .open #bottom {\\n\\t\\ttransform: translate(-12px, 9px) rotate(-45deg)\\n\\t}\\n\\t\\n</style>\\n"],"names":[],"mappings":"AAsCC,OAAO,8BAAC,CAAC,AACR,WAAW,CAAE,GAAG,AACjB,CAAC,AACD,GAAG,8BAAC,CAAC,AACJ,UAAU,CAAE,IAAI,CAChB,UAAU,CAAE,SAAS,CAAC,IAAI,CAAC,WAAW,AACvC,CAAC,AAED,kBAAG,CAAC,IAAI,eAAC,CAAC,AACT,MAAM,CAAE,YAAY,CACpB,YAAY,CAAE,CAAC,CACf,UAAU,CAAE,SAAS,CAAC,IAAI,CAAC,WAAW;CACvC,CAAC,AAED,MAAM,8BAAC,CAAC,AACP,OAAO,CAAE,EAAE,AACZ,CAAC,AAED,oBAAK,CAAC,GAAG,eAAC,CAAC,AACV,SAAS,CAAE,MAAM,CAAC,CAAC;CACpB,CAAC,AAED,oBAAK,CAAC,IAAI,eAAC,CAAC,AACX,SAAS,CAAE,UAAU,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,OAAO,KAAK,CAAC;CAC7C,CAAC,AAED,oBAAK,CAAC,OAAO,eAAC,CAAC,AACd,OAAO,CAAE,CAAC,AACX,CAAC,AAEA,oBAAK,CAAC,OAAO,eAAC,CAAC,AACf,SAAS,CAAE,UAAU,KAAK,CAAC,CAAC,GAAG,CAAC,CAAC,OAAO,MAAM,CAAC;CAChD,CAAC"}`
};
var Header = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  $$result.css.add(css$1);
  $$unsubscribe_page();
  return `<header class="${"sticky m-auto h-20 flex flex-wrap items-center w-full h-18 bg-yellow-50 shadow-lg px-4 md:px-12 top-0"}"><div><img src="${"/images/avatar.jpeg"}" alt="${"avatar"}" width="${"48"}" height="${"48"}" class="${"m-0"}"></div>

	<div><a sveltekit:prefetch href="${"/"}" class="${"text-3xl font-bold hover:text-red-900 hover:bg-yellow-50"}">\u4E00\u6307\u7985</a></div>
      ${validate_component(Src, "ClickOutside").$$render($$result, {}, {}, {
    default: () => `<button class="${[
      "text-red-900 cursor-pointer mr-1 md:hidden border-none focus:outline-none svelte-1xxynum",
      ""
    ].join(" ").trim()}"><svg width="${"32"}" height="${"24"}" class="${"svelte-1xxynum"}"><line id="${"top"}" x1="${"0"}" y1="${"2"}" x2="${"32"}" y2="${"2"}" class="${"svelte-1xxynum"}"></line><line id="${"middle"}" x1="${"0"}" y1="${"12"}" x2="${"24"}" y2="${"12"}" class="${"svelte-1xxynum"}"></line><line id="${"bottom"}" x1="${"0"}" y1="${"22"}" x2="${"32"}" y2="${"22"}" class="${"svelte-1xxynum"}"></line></svg></button>`
  })}

	<nav class="${["w-full ml-auto text-lg font-medium md:flex md:w-auto", "hidden"].join(" ").trim()}"><ul class="${"list-none m-0 md:flex"}"><li class="${["svelte-1xxynum", $page.path === "/" ? "active" : ""].join(" ").trim()}"><a sveltekit:prefetch href="${"/"}" class="${"block mt-4 mr-4 md:inline-block md:mt-0"}">Home</a></li>
			<li class="${["svelte-1xxynum", $page.path === "/blog" ? "active" : ""].join(" ").trim()}"><a sveltekit:prefetch href="${"/blog"}" class="${"block mt-4 mr-4 md:inline-block md:mt-0"}">Blog</a></li>
			<li class="${["svelte-1xxynum", $page.path === "/talks" ? "active" : ""].join(" ").trim()}"><a sveltekit:prefetch href="${"/talks"}" class="${"block mt-4 mr-4 md:inline-block md:mt-0"}">Talks</a></li>
			<li class="${["svelte-1xxynum", $page.path === "/about" ? "active" : ""].join(" ").trim()}"><a sveltekit:prefetch href="${"/about"}" class="${"block mt-4 mr-4 md:inline-block md:mt-0"}">About</a></li></ul></nav>
</header>`;
});
var Footer = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<footer class="${"sticky w-full py-2 h-10 bottom-0 text-sm text-center bg-yellow-50 shadow-inner"}"><p>Copyright \xA9 ${escape2(new Date().getFullYear())} Caesar </p></footer>`;
});
var css = {
  code: ".no-scrollbar.svelte-mxvvug::-webkit-scrollbar{display:none}.no-scrollbar.svelte-mxvvug{-ms-overflow-style:none;scrollbar-width:none}",
  map: `{"version":3,"file":"__layout.svelte","sources":["__layout.svelte"],"sourcesContent":["<script lang=\\"ts\\">import Header from '$lib/Header/index.svelte';\\nimport Footer from '$lib/Footer/index.svelte';\\nimport '../app.css';\\n<\/script>\\n\\n<section class=\\"flex-col h-screen\\">\\n<Header />\\n\\n<main class=\\"flex-col justify-center items-center p-2 md:p-8 h-full w-full max-w-screen-lg  mb-auto  mx-auto box-border flex-1 overflow-y-auto no-scrollbar\\">\\n\\t<slot />\\n</main>\\n\\n<Footer />\\n</section>\\n\\n\\n<style>\\n\\t/* Hide scrollbar for Chrome, Safari and Opera */\\n.no-scrollbar::-webkit-scrollbar {\\n    display: none;\\n}\\n\\n/* Hide scrollbar for IE, Edge and Firefox */\\n.no-scrollbar {\\n    -ms-overflow-style: none;  /* IE and Edge */\\n    scrollbar-width: none;  /* Firefox */\\n}\\n</style>"],"names":[],"mappings":"AAkBA,2BAAa,mBAAmB,AAAC,CAAC,AAC9B,OAAO,CAAE,IAAI,AACjB,CAAC,AAGD,aAAa,cAAC,CAAC,AACX,kBAAkB,CAAE,IAAI,CACxB,eAAe,CAAE,IAAI,AACzB,CAAC"}`
};
var _layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `<section class="${"flex-col h-screen"}">${validate_component(Header, "Header").$$render($$result, {}, {}, {})}

<main class="${"flex-col justify-center items-center p-2 md:p-8 h-full w-full max-w-screen-lg  mb-auto  mx-auto box-border flex-1 overflow-y-auto no-scrollbar svelte-mxvvug"}">${slots.default ? slots.default({}) : ``}</main>

${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}
</section>`;
});
var __layout = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _layout
});
function load$1({ error: error22, status }) {
  return { props: { error: error22, status } };
}
var Error2 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { status } = $$props;
  let { error: error22 } = $$props;
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error22 !== void 0)
    $$bindings.error(error22);
  return `<h1>${escape2(status)}</h1>

<p>${escape2(error22.message)}</p>


${error22.stack ? `<pre>${escape2(error22.stack)}</pre>` : ``}`;
});
var error2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Error2,
  load: load$1
});
var prerender$2 = true;
var Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { src: src2 = "/images/lanke.webp" } = $$props;
  let { alt = "lanke" } = $$props;
  if ($$props.src === void 0 && $$bindings.src && src2 !== void 0)
    $$bindings.src(src2);
  if ($$props.alt === void 0 && $$bindings.alt && alt !== void 0)
    $$bindings.alt(alt);
  return `${$$result.head += `${$$result.title = `<title>Home</title>`, ""}`, ""}

<section class="${"text-center flex-col"}"><img${add_attribute("src", src2, 0)}${add_attribute("alt", alt, 0)} width="${"1500"}" loading="${"lazy"}" class="${"max-w-full h-auto object-fill"}">
		<div class="${"mb-8"}"><h3>\u6E14 \u6A35 \u95EE \u7B54</h3>
	<span>[\u660E] \xB7 \u6768\u8868\u6B63</span></div>
	<div class="${"text-left md:px-8"}"><p>\u6E14\u95EE\u6A35\u66F0\uFF1A\u201C\u5B50\u4F55\u6C42? \u201D</p>
	
	<p>\u6A35\u7B54\u6E14\u66F0\uFF1A\u201C\u6570\u693D\u8305\u5C4B\uFF0C\u7EFF\u6811\u9752\u5C71\uFF0C\u65F6\u51FA\u65F6\u8FD8; \u751F\u6DAF\u4E0D\u5728\u897F\u65B9; \u65A7\u65A4\u4E01\u4E01\uFF0C\u4E91\u4E2D\u4E4B\u5CE6\u3002\u201D </p>
	
	<p>\u6E14\u53C8\u8BD8\u4E4B\uFF1A\u201C\u8349\u6728\u9022\u6625\uFF0C\u751F\u610F\u4E0D\u7136\u4E0D\u53EF\u904F; \u4EE3\u4E4B\u4E3A\u85AA\uFF0C\u751F\u957F\u83AB\u8FBE! \u201D </p>
	
	<p>\u6A35\u53C8\u7B54\u4E4B\u66F0\uFF1A\u201C\u6728\u80FD\u751F\u706B\uFF0C\u706B\u80FD\u719F\u7269\uFF0C\u706B\u4E0E\u6728\uFF0C\u5929\u4E0B\u53E4\u4ECA\u8C01\u6CA1? \u51B5\u5C71\u6728\u4E4B\u4E3A\u6027\u4E5F\u5F53\u751F\u5F53\u67AF; \u4F10\u4E4B\u800C\u540E\u66F4\u592D\u4E54\uFF0C\u53D6\u4E4B\u800C\u540E\u679D\u53F6\u6108\u8302\u3002\u201D </p>
	
	<p>\u6E14\u4E43\u7B11\u66F0\uFF1A\u201C\u56E0\u6728\u6C42\u8D22\uFF0C\u5FC3\u591A\u55DC\u6B32; \u56E0\u8D22\u53D1\u8EAB\uFF0C\u5FC3\u5FC5\u6052\u8FB1\u3002\u201D</p>
	
	<p>\u6A35\u66F0\uFF1A\u201C\u6614\u65E5\u6731\u4E70\u81E3\u672A\u9047\u5BCC\u8D35\u65F6\uFF0C\u643A\u4E66\u631F\u5377\u884C\u8BFB\u4E4B\uFF0C\u4E00\u4E14\u9AD8\u8F66\u9A77\u9A6C\u9A71\u9A70\uFF0C\u520D\u835B\u8131\u8FF9\uFF0C\u4E8E\u5B50\u5C82\u6709\u4E0D\u77E5? \u6211\u4ECA\u6267\u67EF\u4EE5\u4F10\u67EF\uFF0C\u4E91\u9F99\u98CE\u864E\uFF0C\u7EC8\u6709\u4F1A\u671F; \u4E91\u9F99\u98CE\u864E\uFF0C\u7EC8\u6709\u4F1A\u671F\u3002\u201D </p>
	
	<p>\u6A35\u66F0\uFF1A\u201C\u5B50\u4EA6\u4F55\u6613? \u201D</p>
	
	<p>\u6E14\u987E\u800C\u7B54\u66F0\uFF1A\u201C\u4E00\u7AFF\u4E00\u9493\u4E00\u6241\u821F;\u4E94\u6E56\u56DB\u6D77\uFF0C\u4EFB\u6211\u81EA\u5728\u9068\u6E38; \u5F97\u9C7C\u8D2F\u67F3\u800C\u5F52\uFF0C\u4E50\u89E5\u7B79\u3002\u201D</p>
	
	<p>\u6A35\u66F0\uFF1A\u201C\u4EBA\u5728\u4E16\uFF0C\u884C\u4E50\u597D\u592A\u5E73\uFF0C\u9C7C\u5728\u6C34\uFF0C\u626C\u9CCD\u9F13\u9AE1\u53D7\u4E0D\u8B66; \u5B50\u5782\u9646\u5177\uFF0C\u8FC7\u7528\u8BB8\u6781\u5FC3\uFF0C\u4F24\u751F\u5BB3\u547D\u4F55\u6DF1!?\u201D\u6E14\u53C8\u66F0\uFF1A\u201C\u4E0D\u4E13\u53D6\u5229\u629B\u7EB6\u9975\uFF0C\u60DF\u7231\u6C5F\u5C71\u98CE\u666F\u6E05\u3002\u201D</p>
	
	<p>\u6A35\u66F0\uFF1A\u201C\u5FD7\u4E0D\u5728\u6E14\u5782\u76F4\u9493? \u5FC3\u65E0\u8D2A\u5229\u5750\u5BB6\u541F; \u5B50\u4ECA\u6B63\u662F\u5CA9\u8FB9\u736D\uFF0C\u4F55\u9053\u5FD8\u79C1\u5F04\u6708\u660E? \u201D</p>
	
	<p>\u6E14\u4E43\u559C\u66F0\uFF1A\u201C\u5415\u671B\u5F53\u5E74\u6E2D\u6C34\u6EE8\uFF0C\u4E1D\u7EB6\u534A\u5377\u6D77\u971E\u6E05; \u6709\u671D\u5F97\u9047\u6587\u738B\u65E5\uFF0C\u8F7D\u4E0A\u5B89\u8F66\u8D4D\u9619\u4EAC; \u5609\u8A00\u8C20\u8BBA\u4E3A\u65F6\u6CD5\uFF0C\u5927\u5C55\u9E70\u626C\u6566\u592A\u5E73\u3002\u201D</p>
	
	<p>\u6A35\u51FB\u62C5\u800C\u5BF9\u66F0\uFF1A\u201C\u5B50\u5728\u6C5F\u516E\u6211\u5728\u5C71\uFF0C\u8BA1\u6765\u4E24\u7269\u4E00\u822C\u822C; \u606F\u80A9\u7F62\u9493\u76F8\u9022\u8BDD\uFF0C\u83AB\u628A\u6C5F\u5C71\u6BD4\u7B49\u95F2; \u6211\u662F\u5B50\u975E\u4F11\u518D\u8FA9\uFF0C\u6211\u975E\u5B50\u662F\u83AB\u865A\u8C08; \u4E0D\u5982\u5F97\u4E2A\u7EA2\u9CDE\u9CA4\uFF0C\u707C\u706B\u65B0\u84B8\u5171\u7B11\u989C\u201D\u3002</p>
	
	<p>\u6E14\u4E43\u559C\u66F0\uFF1A\u201C\u4E0D\u60DF\u8403\u8001\u6EAA\u5C71; \u8FD8\u671F\u5F02\u65E5\u5F97\u5FD7\u89C1\u9F99\u989C\uFF0C\u6295\u5374\u4E91\u5CF0\u70DF\u6C34\u4E1A\uFF0C\u5927\u65F1\u65BD\u9716\u96E8\uFF0C\u5DE8\u5DDD\u884C\u821F\u696B\uFF0C\u8863\u9526\u800C\u8FD8; \u53F9\u4EBA\u751F\u80FD\u6709\u51E0\u4F55\u6B22\u3002\u201D</p></div></section>`;
});
var index$2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Routes,
  prerender: prerender$2
});
var browser = false;
var dev = false;
var hydrate = dev;
var router = browser;
var prerender$1 = true;
var About = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${$$result.head += `${$$result.title = `<title>About</title>`, ""}`, ""}

<h1>About</h1>
<hr>

<p><strong>\u55E8\uFF0C\u4F60\u597D\uFF01\u6B22\u8FCE\u6765\u5230\u6211\u7684\u5C0F\u7AD9\u3002 </strong></p>
    <p>\u6211\uFF0C\u7F51\u540D\u732A\u521A\u70C8\uFF0C\u5916\u53F7\u4E00\u706F\uFF0C\u662F\u4E00\u540D\u5B66\u4E60\u8BBE\u8BA1\u5E08\uFF0C\u73B0\u670D\u52A1\u4E8E\u4E00\u5BB6\u793E\u533A\u57F9\u8BAD\u4E2D\u5FC3\u3002</p>
    <p>\u751F\u6D3B\u4E2D\uFF0C\u6211\u662F\u4E00\u4E2A\u4E50\u5929\u6D3E\u3002\u6211\u76F8\u4FE1\u529E\u6CD5\u603B\u6BD4\u95EE\u9898\u591A\uFF0C\u76F8\u4FE1\u6CA1\u6709\u4EC0\u4E48\u8FC7\u4E0D\u53BB\u7684\u574E\u513F\uFF0C\u76F8\u4FE1\u4E8B\u60C5\u603B\u4F1A\u5411\u597D\u7684\u65B9\u5411\u8F6C\u5316\u3002\u9047\u5230\u95EE\u9898\u7684\u65F6\u5019\uFF0C\u522B\u4EBA\u6025\u5F97\u8DF3\u811A\uFF0C\u6211\u5374\u80FD\u6DE1\u5B9A\u81EA\u82E5\uFF0C\u8868\u73B0\u5F97\u8DDF\u6CA1\u4E8B\u513F\u4E00\u6837\u3002\u56E0\u4E3A\u8FD9\u6837\u7684\u6027\u683C\uFF0C\u5E38\u5E38\u88AB\u67D0\u4E2A\u4EBA\u9A82\u201C\u6CA1\u5FC3\u6CA1\u80BA\u201D\u3002\u4E0B\u9762\u8FD9\u5F20\u56FE\u753B\u51FA\u4E86\u6211\u8FD9\u79CD\u6027\u683C\u80CC\u540E\u7684\u903B\u8F91\u3002</p>
    <img src="${"/images/attitude.png"}" alt="${"attitude"}" loading="${"lazy"}" class="${"w-full md:w-1/2 block ml-auto mr-auto my-8"}">
     <p>\u6211\u5BF9\u672A\u77E5\u5145\u6EE1\u597D\u5947\uFF0C\u56E0\u800C\u7279\u522B\u559C\u6B22\u8BFB\u4E66\u5B66\u4E60\u3002\u4E66\u5E97\u662F\u5E38\u53BB\u7684\u5730\u65B9\u3002\u521A\u5DE5\u4F5C\u90A3\u4F1A\u513F\uFF0C\u6536\u5165\u5FAE\u8584\uFF0C\u751F\u6D3B\u6349\u895F\u89C1\u8098\uFF0C\u4F46\u6BCF\u6708\u4ECD\u4F1A\u62FF\u51FA\u5DE5\u8D44\u7684\u4E03\u5206\u4E4B\u4E00\u6765\u8D2D\u4E70\u4E66\u7C4D\u3002\u5230\u6211\u8F9E\u804C\u7684\u65F6\u5019\uFF0C\u5BB6\u91CC\u7684\u4E66\u623F\u90FD\u5FEB\u53D8\u6210\u8FF7\u4F60\u56FE\u4E66\u9986\u4E86\u3002\u6211\u9605\u8BFB\u7684\u8303\u56F4\u57FA\u672C\u5C40\u9650\u4E8E\u54F2\u5B66\u3001\u793E\u4F1A\u79D1\u5B66\u548C\u79D1\u666E\u3002\u300A\u7EA2\u697C\u68A6\u300B\u8BFB\u51E0\u884C\u5C31\u60F3\u7761\u89C9\uFF0C\u300A\u81EA\u6740\u8BBA\u300B\u5374\u53EF\u4EE5\u8BFB\u901A\u5BB5\u800C\u4E0D\u77E5\u75B2\u5026\u3002\u5F97\u76CA\u4E8E\u9605\u8BFB\uFF0C\u6211\u80FD\u6E05\u695A\u5730\u7406\u89E3\u62BD\u8C61\u7684\u54F2\u5B66\u6982\u5FF5\uFF0C\u4E5F\u80FD\u5904\u7406\u68D8\u624B\u7684\u7EC4\u7EC7\u7BA1\u7406\u95EE\u9898\uFF0C\u8FD8\u80FD\u6B23\u8D4F\u8BD7\u8BCD\u6B4C\u8D4B\u4E2D\u8574\u6DB5\u7684\u610F\u5883\u3002\u6211\u662F\u8BFB\u8005\uFF0C\u4E5F\u662F\u4F5C\u8005\uFF0C\u53D1\u8868\u8FC7\u82E5\u5E72\u7AE0\u8282\u3001\u8BD1\u4F5C\uFF0C\u548C\u8BBA\u6587\u3002\u6211\u7684\u4F5C\u54C1\u770B\u7684\u4EBA\u4E0D\u591A\uFF0C\u4F46\u8FD8\u7B97\u6709\u89C1\u89E3\uFF0C\u4E0D\u4F1A\u8BA9\u8BFB\u8005\u611F\u89C9\u662F\u5728\u6D6A\u8D39\u65F6\u95F4\u3002</p>

    <p>\u6211\u5174\u8DA3\u5E7F\u6CDB\uFF0C\u559C\u6B22\u8FDC\u8DB3\uFF0C\u559C\u6B22\u9A91\u811A\u8E0F\u8F66\uFF0C\u559C\u6B22\u542C\u53E4\u5178\u97F3\u4E50\uFF0C\u559C\u6B22\u54C1\u8336\uFF0C\u559C\u6B22\u505A\u7F8E\u98DF......\u3002\u6211\u6700\u5927\u7684\u55DC\u597D\u662F\u4E0B\u56F4\u68CB\u3002\u4ECE\u5927\u5B66\u4E00\u5E74\u7EA7\u5F00\u59CB\u4E00\u76F4\u4E0B\u5230\u73B0\u5728\u3002\u56F4\u68CB\u8BA9\u6211\u660E\u767D\u4E86\u4E0D\u5C11\u9053\u7406\u3002\u8B6C\u5982\uFF0C\u820D\u5F03\u662F\u56F4\u68CB\u53D6\u80DC\u7684\u79D8\u8BC0\uFF1B\u820D\u5F97\u662F\u4EBA\u751F\u6210\u529F\u7684\u667A\u6167\u3002\u6709\u820D\u624D\u6709\u5F97\uFF0C\u4F1A\u820D\u624D\u4F1A\u5F97\u3002\u820D\u5F97\u4E4B\u9053\uFF0C\u4E7E\u5764\u5965\u5999\u3002</p>

    <p>\u6700\u8FD1, \u6211\u5BF9\u7F51\u7AD9\u5F00\u53D1\u4EA7\u751F\u4E86\u6D53\u539A\u7684\u5174\u8DA3\uFF0C\u4E8E\u662F\u5C31\u5F00\u59CB\u4E86 HTML\u3001CSS \u548C Javascript \u7684\u5B66\u4E60\u4E4B\u65C5\u3002\u4F60\u73B0\u5728\u6B63\u5728\u6D4F\u89C8\u7684\u8FD9\u4E2A\u7F51\u7AD9\u5C31\u662F\u8FD9\u6B21\u5B66\u4E60\u7684\u4E00\u4E2A\u521D\u6B65\u6210\u679C\uFF0C\u5B83\u662F\u57FA\u4E8E <a href="${"https://kit.svelte.dev/"}" target="${"_blank"}" rel="${"noreferrer"}">Sveltekit</a> \u548C <a href="${"https://tailwindcss.com"}" target="${"_blank"}" rel="${"noreferrer"}">Tailwindcss</a> \u6280\u672F\u6784\u5EFA\u7684\u3002\u600E\u4E48\u6837\uFF1F\u770B\u4E0A\u53BB\u8FD8\u4E0D\u9519\u5427\uFF1F<span role="${"img"}" aria-label="${"Smile"}">\u{1F60A}</span></p>`;
});
var about = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": About,
  hydrate,
  router,
  prerender: prerender$1
});
var talks = [
  {
    "title": "My First Talk",
    "date": "2018-08-01",
    "description": "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Harum repudiandae, autem eos voluptatum assumenda cum laborum iure nam in accusantium.",
    "slide": "/pdfs/lp.pdf",
    "image": "/images/talk.png"
  },
  {
    "title": "My Second Talk",
    "date": "2018-09-10",
    "description": "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Harum repudiandae, autem eos voluptatum assumenda cum laborum iure nam in accusantium.",
    "slide": "/pdfs/facilitation.pdf",
    "image": "/images/talk.png"
  }
];
var Talks = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<h1>Talks</h1>
        <hr>
    
        ${each(talks, (talk) => `${formatDate(talk.date) ? `<div class="${"md:px-10 md:flex md:space-x-4 md:space-y-4 md:justify-center md: items-center"}"><img${add_attribute("src", talk.image, 0)} alt="${"talk1"}" loading="${"lazy"}" class="${"w-full md:w-1/4 block ml-auto mr-auto mb-4"}">
            <div><h4>${escape2(talk.title)}</h4>
            <p>${escape2(talk.description)}</p>
            <a${add_attribute("href", talk.slide, 0)} target="${"_blank"}" class="${"flex items-center w-max px-2 "}">\u4E0B\u8F7D PDF</a></div>
        </div>` : ``}`)}`;
});
var index$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Talks
});
var prerender = true;
async function load({ session }) {
  const posts = session.posts;
  return { props: { posts } };
}
var Blog = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { posts } = $$props;
  if ($$props.posts === void 0 && $$bindings.posts && posts !== void 0)
    $$bindings.posts(posts);
  return `${$$result.head += `${$$result.title = `<title>Blog</title>`, ""}`, ""}

<div><h1>Posts</h1>
	<hr>
	${each(posts, (post) => `<div class="${"flex justify-between items-center"}"><a${add_attribute("href", `./blog/${post.slug}`, 0)} class="${"block mb-4 pb-4 last:border-none last:mb-0 font-bold"}">${escape2(post.title)}</a>
		<p>${escape2(formatDate(post.date))}</p>
	</div>`)}</div>`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Blog,
  prerender,
  load
});

// .svelte-kit/vercel/entry.js
var entry_default = async (req, res) => {
  const { pathname, searchParams } = new URL(req.url || "", "http://localhost");
  let body;
  try {
    body = await getRawBody(req);
  } catch (err) {
    res.statusCode = err.status || 400;
    return res.end(err.reason || "Invalid request body");
  }
  const rendered = await render({
    method: req.method,
    headers: req.headers,
    path: pathname,
    query: searchParams,
    rawBody: body
  });
  if (rendered) {
    const { status, headers, body: body2 } = rendered;
    return res.writeHead(status, headers).end(body2);
  }
  return res.writeHead(404).end();
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
