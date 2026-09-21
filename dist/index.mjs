import{createRequire}from'node:module';const require=createRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/tunnel@0.0.6/node_modules/tunnel/lib/tunnel.js
var require_tunnel = __commonJS({
  "node_modules/.pnpm/tunnel@0.0.6/node_modules/tunnel/lib/tunnel.js"(exports) {
    "use strict";
    var net = __require("net");
    var tls = __require("tls");
    var http = __require("http");
    var https = __require("https");
    var events = __require("events");
    var assert = __require("assert");
    var util = __require("util");
    exports.httpOverHttp = httpOverHttp2;
    exports.httpsOverHttp = httpsOverHttp2;
    exports.httpOverHttps = httpOverHttps2;
    exports.httpsOverHttps = httpsOverHttps2;
    function httpOverHttp2(options) {
      var agent = new TunnelingAgent(options);
      agent.request = http.request;
      return agent;
    }
    function httpsOverHttp2(options) {
      var agent = new TunnelingAgent(options);
      agent.request = http.request;
      agent.createSocket = createSecureSocket;
      agent.defaultPort = 443;
      return agent;
    }
    function httpOverHttps2(options) {
      var agent = new TunnelingAgent(options);
      agent.request = https.request;
      return agent;
    }
    function httpsOverHttps2(options) {
      var agent = new TunnelingAgent(options);
      agent.request = https.request;
      agent.createSocket = createSecureSocket;
      agent.defaultPort = 443;
      return agent;
    }
    function TunnelingAgent(options) {
      var self = this;
      self.options = options || {};
      self.proxyOptions = self.options.proxy || {};
      self.maxSockets = self.options.maxSockets || http.Agent.defaultMaxSockets;
      self.requests = [];
      self.sockets = [];
      self.on("free", function onFree(socket, host, port, localAddress) {
        var options2 = toOptions(host, port, localAddress);
        for (var i = 0, len = self.requests.length; i < len; ++i) {
          var pending = self.requests[i];
          if (pending.host === options2.host && pending.port === options2.port) {
            self.requests.splice(i, 1);
            pending.request.onSocket(socket);
            return;
          }
        }
        socket.destroy();
        self.removeSocket(socket);
      });
    }
    util.inherits(TunnelingAgent, events.EventEmitter);
    TunnelingAgent.prototype.addRequest = function addRequest(req, host, port, localAddress) {
      var self = this;
      var options = mergeOptions({ request: req }, self.options, toOptions(host, port, localAddress));
      if (self.sockets.length >= this.maxSockets) {
        self.requests.push(options);
        return;
      }
      self.createSocket(options, function(socket) {
        socket.on("free", onFree);
        socket.on("close", onCloseOrRemove);
        socket.on("agentRemove", onCloseOrRemove);
        req.onSocket(socket);
        function onFree() {
          self.emit("free", socket, options);
        }
        function onCloseOrRemove(err) {
          self.removeSocket(socket);
          socket.removeListener("free", onFree);
          socket.removeListener("close", onCloseOrRemove);
          socket.removeListener("agentRemove", onCloseOrRemove);
        }
      });
    };
    TunnelingAgent.prototype.createSocket = function createSocket(options, cb) {
      var self = this;
      var placeholder = {};
      self.sockets.push(placeholder);
      var connectOptions = mergeOptions({}, self.proxyOptions, {
        method: "CONNECT",
        path: options.host + ":" + options.port,
        agent: false,
        headers: {
          host: options.host + ":" + options.port
        }
      });
      if (options.localAddress) {
        connectOptions.localAddress = options.localAddress;
      }
      if (connectOptions.proxyAuth) {
        connectOptions.headers = connectOptions.headers || {};
        connectOptions.headers["Proxy-Authorization"] = "Basic " + new Buffer(connectOptions.proxyAuth).toString("base64");
      }
      debug2("making CONNECT request");
      var connectReq = self.request(connectOptions);
      connectReq.useChunkedEncodingByDefault = false;
      connectReq.once("response", onResponse);
      connectReq.once("upgrade", onUpgrade);
      connectReq.once("connect", onConnect);
      connectReq.once("error", onError);
      connectReq.end();
      function onResponse(res) {
        res.upgrade = true;
      }
      function onUpgrade(res, socket, head) {
        process.nextTick(function() {
          onConnect(res, socket, head);
        });
      }
      function onConnect(res, socket, head) {
        connectReq.removeAllListeners();
        socket.removeAllListeners();
        if (res.statusCode !== 200) {
          debug2(
            "tunneling socket could not be established, statusCode=%d",
            res.statusCode
          );
          socket.destroy();
          var error2 = new Error("tunneling socket could not be established, statusCode=" + res.statusCode);
          error2.code = "ECONNRESET";
          options.request.emit("error", error2);
          self.removeSocket(placeholder);
          return;
        }
        if (head.length > 0) {
          debug2("got illegal response body from proxy");
          socket.destroy();
          var error2 = new Error("got illegal response body from proxy");
          error2.code = "ECONNRESET";
          options.request.emit("error", error2);
          self.removeSocket(placeholder);
          return;
        }
        debug2("tunneling connection has established");
        self.sockets[self.sockets.indexOf(placeholder)] = socket;
        return cb(socket);
      }
      function onError(cause) {
        connectReq.removeAllListeners();
        debug2(
          "tunneling socket could not be established, cause=%s\n",
          cause.message,
          cause.stack
        );
        var error2 = new Error("tunneling socket could not be established, cause=" + cause.message);
        error2.code = "ECONNRESET";
        options.request.emit("error", error2);
        self.removeSocket(placeholder);
      }
    };
    TunnelingAgent.prototype.removeSocket = function removeSocket(socket) {
      var pos = this.sockets.indexOf(socket);
      if (pos === -1) {
        return;
      }
      this.sockets.splice(pos, 1);
      var pending = this.requests.shift();
      if (pending) {
        this.createSocket(pending, function(socket2) {
          pending.request.onSocket(socket2);
        });
      }
    };
    function createSecureSocket(options, cb) {
      var self = this;
      TunnelingAgent.prototype.createSocket.call(self, options, function(socket) {
        var hostHeader = options.request.getHeader("host");
        var tlsOptions = mergeOptions({}, self.options, {
          socket,
          servername: hostHeader ? hostHeader.replace(/:.*$/, "") : options.host
        });
        var secureSocket = tls.connect(0, tlsOptions);
        self.sockets[self.sockets.indexOf(socket)] = secureSocket;
        cb(secureSocket);
      });
    }
    function toOptions(host, port, localAddress) {
      if (typeof host === "string") {
        return {
          host,
          port,
          localAddress
        };
      }
      return host;
    }
    function mergeOptions(target) {
      for (var i = 1, len = arguments.length; i < len; ++i) {
        var overrides = arguments[i];
        if (typeof overrides === "object") {
          var keys = Object.keys(overrides);
          for (var j = 0, keyLen = keys.length; j < keyLen; ++j) {
            var k = keys[j];
            if (overrides[k] !== void 0) {
              target[k] = overrides[k];
            }
          }
        }
      }
      return target;
    }
    var debug2;
    if (process.env.NODE_DEBUG && /\btunnel\b/.test(process.env.NODE_DEBUG)) {
      debug2 = function() {
        var args = Array.prototype.slice.call(arguments);
        if (typeof args[0] === "string") {
          args[0] = "TUNNEL: " + args[0];
        } else {
          args.unshift("TUNNEL:");
        }
        console.error.apply(console, args);
      };
    } else {
      debug2 = function() {
      };
    }
    exports.debug = debug2;
  }
});

// node_modules/.pnpm/tunnel@0.0.6/node_modules/tunnel/index.js
var require_tunnel2 = __commonJS({
  "node_modules/.pnpm/tunnel@0.0.6/node_modules/tunnel/index.js"(exports, module) {
    module.exports = require_tunnel();
  }
});

// node_modules/.pnpm/@actions+core@3.0.1/node_modules/@actions/core/lib/command.js
import * as os from "os";

// node_modules/.pnpm/@actions+core@3.0.1/node_modules/@actions/core/lib/utils.js
function toCommandValue(input) {
  if (input === null || input === void 0) {
    return "";
  } else if (typeof input === "string" || input instanceof String) {
    return input;
  }
  return JSON.stringify(input);
}
function toCommandProperties(annotationProperties) {
  if (!Object.keys(annotationProperties).length) {
    return {};
  }
  return {
    title: annotationProperties.title,
    file: annotationProperties.file,
    line: annotationProperties.startLine,
    endLine: annotationProperties.endLine,
    col: annotationProperties.startColumn,
    endColumn: annotationProperties.endColumn
  };
}

// node_modules/.pnpm/@actions+core@3.0.1/node_modules/@actions/core/lib/command.js
function issueCommand(command, properties, message) {
  const cmd = new Command(command, properties, message);
  process.stdout.write(cmd.toString() + os.EOL);
}
var CMD_STRING = "::";
var Command = class {
  constructor(command, properties, message) {
    if (!command) {
      command = "missing.command";
    }
    this.command = command;
    this.properties = properties;
    this.message = message;
  }
  toString() {
    let cmdStr = CMD_STRING + this.command;
    if (this.properties && Object.keys(this.properties).length > 0) {
      cmdStr += " ";
      let first = true;
      for (const key in this.properties) {
        if (this.properties.hasOwnProperty(key)) {
          const val = this.properties[key];
          if (val) {
            if (first) {
              first = false;
            } else {
              cmdStr += ",";
            }
            cmdStr += `${key}=${escapeProperty(val)}`;
          }
        }
      }
    }
    cmdStr += `${CMD_STRING}${escapeData(this.message)}`;
    return cmdStr;
  }
};
function escapeData(s) {
  return toCommandValue(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}
function escapeProperty(s) {
  return toCommandValue(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A").replace(/:/g, "%3A").replace(/,/g, "%2C");
}

// node_modules/.pnpm/@actions+core@3.0.1/node_modules/@actions/core/lib/core.js
import * as os3 from "os";

// node_modules/.pnpm/@actions+http-client@4.0.1/node_modules/@actions/http-client/lib/index.js
var tunnel = __toESM(require_tunnel2(), 1);
var HttpCodes;
(function(HttpCodes2) {
  HttpCodes2[HttpCodes2["OK"] = 200] = "OK";
  HttpCodes2[HttpCodes2["MultipleChoices"] = 300] = "MultipleChoices";
  HttpCodes2[HttpCodes2["MovedPermanently"] = 301] = "MovedPermanently";
  HttpCodes2[HttpCodes2["ResourceMoved"] = 302] = "ResourceMoved";
  HttpCodes2[HttpCodes2["SeeOther"] = 303] = "SeeOther";
  HttpCodes2[HttpCodes2["NotModified"] = 304] = "NotModified";
  HttpCodes2[HttpCodes2["UseProxy"] = 305] = "UseProxy";
  HttpCodes2[HttpCodes2["SwitchProxy"] = 306] = "SwitchProxy";
  HttpCodes2[HttpCodes2["TemporaryRedirect"] = 307] = "TemporaryRedirect";
  HttpCodes2[HttpCodes2["PermanentRedirect"] = 308] = "PermanentRedirect";
  HttpCodes2[HttpCodes2["BadRequest"] = 400] = "BadRequest";
  HttpCodes2[HttpCodes2["Unauthorized"] = 401] = "Unauthorized";
  HttpCodes2[HttpCodes2["PaymentRequired"] = 402] = "PaymentRequired";
  HttpCodes2[HttpCodes2["Forbidden"] = 403] = "Forbidden";
  HttpCodes2[HttpCodes2["NotFound"] = 404] = "NotFound";
  HttpCodes2[HttpCodes2["MethodNotAllowed"] = 405] = "MethodNotAllowed";
  HttpCodes2[HttpCodes2["NotAcceptable"] = 406] = "NotAcceptable";
  HttpCodes2[HttpCodes2["ProxyAuthenticationRequired"] = 407] = "ProxyAuthenticationRequired";
  HttpCodes2[HttpCodes2["RequestTimeout"] = 408] = "RequestTimeout";
  HttpCodes2[HttpCodes2["Conflict"] = 409] = "Conflict";
  HttpCodes2[HttpCodes2["Gone"] = 410] = "Gone";
  HttpCodes2[HttpCodes2["TooManyRequests"] = 429] = "TooManyRequests";
  HttpCodes2[HttpCodes2["InternalServerError"] = 500] = "InternalServerError";
  HttpCodes2[HttpCodes2["NotImplemented"] = 501] = "NotImplemented";
  HttpCodes2[HttpCodes2["BadGateway"] = 502] = "BadGateway";
  HttpCodes2[HttpCodes2["ServiceUnavailable"] = 503] = "ServiceUnavailable";
  HttpCodes2[HttpCodes2["GatewayTimeout"] = 504] = "GatewayTimeout";
})(HttpCodes || (HttpCodes = {}));
var Headers;
(function(Headers2) {
  Headers2["Accept"] = "accept";
  Headers2["ContentType"] = "content-type";
})(Headers || (Headers = {}));
var MediaTypes;
(function(MediaTypes2) {
  MediaTypes2["ApplicationJson"] = "application/json";
})(MediaTypes || (MediaTypes = {}));
var HttpRedirectCodes = [
  HttpCodes.MovedPermanently,
  HttpCodes.ResourceMoved,
  HttpCodes.SeeOther,
  HttpCodes.TemporaryRedirect,
  HttpCodes.PermanentRedirect
];
var HttpResponseRetryCodes = [
  HttpCodes.BadGateway,
  HttpCodes.ServiceUnavailable,
  HttpCodes.GatewayTimeout
];

// node_modules/.pnpm/@actions+core@3.0.1/node_modules/@actions/core/lib/summary.js
import { EOL as EOL2 } from "os";
import { constants, promises } from "fs";
var __awaiter = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var { access, appendFile, writeFile } = promises;
var SUMMARY_ENV_VAR = "GITHUB_STEP_SUMMARY";
var Summary = class {
  constructor() {
    this._buffer = "";
  }
  /**
   * Finds the summary file path from the environment, rejects if env var is not found or file does not exist
   * Also checks r/w permissions.
   *
   * @returns step summary file path
   */
  filePath() {
    return __awaiter(this, void 0, void 0, function* () {
      if (this._filePath) {
        return this._filePath;
      }
      const pathFromEnv = process.env[SUMMARY_ENV_VAR];
      if (!pathFromEnv) {
        throw new Error(`Unable to find environment variable for $${SUMMARY_ENV_VAR}. Check if your runtime environment supports job summaries.`);
      }
      try {
        yield access(pathFromEnv, constants.R_OK | constants.W_OK);
      } catch (_a) {
        throw new Error(`Unable to access summary file: '${pathFromEnv}'. Check if the file has correct read/write permissions.`);
      }
      this._filePath = pathFromEnv;
      return this._filePath;
    });
  }
  /**
   * Wraps content in an HTML tag, adding any HTML attributes
   *
   * @param {string} tag HTML tag to wrap
   * @param {string | null} content content within the tag
   * @param {[attribute: string]: string} attrs key-value list of HTML attributes to add
   *
   * @returns {string} content wrapped in HTML element
   */
  wrap(tag, content, attrs = {}) {
    const htmlAttrs = Object.entries(attrs).map(([key, value]) => ` ${key}="${value}"`).join("");
    if (!content) {
      return `<${tag}${htmlAttrs}>`;
    }
    return `<${tag}${htmlAttrs}>${content}</${tag}>`;
  }
  /**
   * Writes text in the buffer to the summary buffer file and empties buffer. Will append by default.
   *
   * @param {SummaryWriteOptions} [options] (optional) options for write operation
   *
   * @returns {Promise<Summary>} summary instance
   */
  write(options) {
    return __awaiter(this, void 0, void 0, function* () {
      const overwrite = !!(options === null || options === void 0 ? void 0 : options.overwrite);
      const filePath = yield this.filePath();
      const writeFunc = overwrite ? writeFile : appendFile;
      yield writeFunc(filePath, this._buffer, { encoding: "utf8" });
      return this.emptyBuffer();
    });
  }
  /**
   * Clears the summary buffer and wipes the summary file
   *
   * @returns {Summary} summary instance
   */
  clear() {
    return __awaiter(this, void 0, void 0, function* () {
      return this.emptyBuffer().write({ overwrite: true });
    });
  }
  /**
   * Returns the current summary buffer as a string
   *
   * @returns {string} string of summary buffer
   */
  stringify() {
    return this._buffer;
  }
  /**
   * If the summary buffer is empty
   *
   * @returns {boolen} true if the buffer is empty
   */
  isEmptyBuffer() {
    return this._buffer.length === 0;
  }
  /**
   * Resets the summary buffer without writing to summary file
   *
   * @returns {Summary} summary instance
   */
  emptyBuffer() {
    this._buffer = "";
    return this;
  }
  /**
   * Adds raw text to the summary buffer
   *
   * @param {string} text content to add
   * @param {boolean} [addEOL=false] (optional) append an EOL to the raw text (default: false)
   *
   * @returns {Summary} summary instance
   */
  addRaw(text, addEOL = false) {
    this._buffer += text;
    return addEOL ? this.addEOL() : this;
  }
  /**
   * Adds the operating system-specific end-of-line marker to the buffer
   *
   * @returns {Summary} summary instance
   */
  addEOL() {
    return this.addRaw(EOL2);
  }
  /**
   * Adds an HTML codeblock to the summary buffer
   *
   * @param {string} code content to render within fenced code block
   * @param {string} lang (optional) language to syntax highlight code
   *
   * @returns {Summary} summary instance
   */
  addCodeBlock(code, lang) {
    const attrs = Object.assign({}, lang && { lang });
    const element = this.wrap("pre", this.wrap("code", code), attrs);
    return this.addRaw(element).addEOL();
  }
  /**
   * Adds an HTML list to the summary buffer
   *
   * @param {string[]} items list of items to render
   * @param {boolean} [ordered=false] (optional) if the rendered list should be ordered or not (default: false)
   *
   * @returns {Summary} summary instance
   */
  addList(items, ordered = false) {
    const tag = ordered ? "ol" : "ul";
    const listItems = items.map((item) => this.wrap("li", item)).join("");
    const element = this.wrap(tag, listItems);
    return this.addRaw(element).addEOL();
  }
  /**
   * Adds an HTML table to the summary buffer
   *
   * @param {SummaryTableCell[]} rows table rows
   *
   * @returns {Summary} summary instance
   */
  addTable(rows) {
    const tableBody = rows.map((row) => {
      const cells = row.map((cell) => {
        if (typeof cell === "string") {
          return this.wrap("td", cell);
        }
        const { header, data, colspan, rowspan } = cell;
        const tag = header ? "th" : "td";
        const attrs = Object.assign(Object.assign({}, colspan && { colspan }), rowspan && { rowspan });
        return this.wrap(tag, data, attrs);
      }).join("");
      return this.wrap("tr", cells);
    }).join("");
    const element = this.wrap("table", tableBody);
    return this.addRaw(element).addEOL();
  }
  /**
   * Adds a collapsable HTML details element to the summary buffer
   *
   * @param {string} label text for the closed state
   * @param {string} content collapsable content
   *
   * @returns {Summary} summary instance
   */
  addDetails(label, content) {
    const element = this.wrap("details", this.wrap("summary", label) + content);
    return this.addRaw(element).addEOL();
  }
  /**
   * Adds an HTML image tag to the summary buffer
   *
   * @param {string} src path to the image you to embed
   * @param {string} alt text description of the image
   * @param {SummaryImageOptions} options (optional) addition image attributes
   *
   * @returns {Summary} summary instance
   */
  addImage(src, alt, options) {
    const { width, height } = options || {};
    const attrs = Object.assign(Object.assign({}, width && { width }), height && { height });
    const element = this.wrap("img", null, Object.assign({ src, alt }, attrs));
    return this.addRaw(element).addEOL();
  }
  /**
   * Adds an HTML section heading element
   *
   * @param {string} text heading text
   * @param {number | string} [level=1] (optional) the heading level, default: 1
   *
   * @returns {Summary} summary instance
   */
  addHeading(text, level) {
    const tag = `h${level}`;
    const allowedTag = ["h1", "h2", "h3", "h4", "h5", "h6"].includes(tag) ? tag : "h1";
    const element = this.wrap(allowedTag, text);
    return this.addRaw(element).addEOL();
  }
  /**
   * Adds an HTML thematic break (<hr>) to the summary buffer
   *
   * @returns {Summary} summary instance
   */
  addSeparator() {
    const element = this.wrap("hr", null);
    return this.addRaw(element).addEOL();
  }
  /**
   * Adds an HTML line break (<br>) to the summary buffer
   *
   * @returns {Summary} summary instance
   */
  addBreak() {
    const element = this.wrap("br", null);
    return this.addRaw(element).addEOL();
  }
  /**
   * Adds an HTML blockquote to the summary buffer
   *
   * @param {string} text quote text
   * @param {string} cite (optional) citation url
   *
   * @returns {Summary} summary instance
   */
  addQuote(text, cite) {
    const attrs = Object.assign({}, cite && { cite });
    const element = this.wrap("blockquote", text, attrs);
    return this.addRaw(element).addEOL();
  }
  /**
   * Adds an HTML anchor tag to the summary buffer
   *
   * @param {string} text link text/content
   * @param {string} href hyperlink
   *
   * @returns {Summary} summary instance
   */
  addLink(text, href) {
    const element = this.wrap("a", text, { href });
    return this.addRaw(element).addEOL();
  }
};
var _summary = new Summary();

// node_modules/.pnpm/@actions+core@3.0.1/node_modules/@actions/core/lib/platform.js
import os2 from "os";

// node_modules/.pnpm/@actions+io@3.0.2/node_modules/@actions/io/lib/io-util.js
import * as fs from "fs";
var { chmod, copyFile, lstat, mkdir, open, readdir, rename, rm, rmdir, stat, symlink, unlink } = fs.promises;
var IS_WINDOWS = process.platform === "win32";
var READONLY = fs.constants.O_RDONLY;

// node_modules/.pnpm/@actions+exec@3.0.0/node_modules/@actions/exec/lib/toolrunner.js
var IS_WINDOWS2 = process.platform === "win32";

// node_modules/.pnpm/@actions+core@3.0.1/node_modules/@actions/core/lib/platform.js
var platform = os2.platform();
var arch = os2.arch();

// node_modules/.pnpm/@actions+core@3.0.1/node_modules/@actions/core/lib/core.js
var ExitCode;
(function(ExitCode2) {
  ExitCode2[ExitCode2["Success"] = 0] = "Success";
  ExitCode2[ExitCode2["Failure"] = 1] = "Failure";
})(ExitCode || (ExitCode = {}));
function setSecret(secret) {
  issueCommand("add-mask", {}, secret);
}
function getInput(name, options) {
  const val = process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] || "";
  if (options && options.required && !val) {
    throw new Error(`Input required and not supplied: ${name}`);
  }
  if (options && options.trimWhitespace === false) {
    return val;
  }
  return val.trim();
}
function setFailed(message) {
  process.exitCode = ExitCode.Failure;
  error(message);
}
function error(message, properties = {}) {
  issueCommand("error", toCommandProperties(properties), message instanceof Error ? message.toString() : message);
}
function info(message) {
  process.stdout.write(message + os3.EOL);
}

// src/index.mjs
import { readFileSync } from "node:fs";
function protectClientPayload(clientPayload, exceptAllowlist) {
  clientPayload = clientPayload || {};
  console.log("Protecting members from client_payload:");
  recurseMembers(
    clientPayload,
    (val, memberName) => {
      if (exceptAllowlist.includes(memberName)) {
        return;
      }
      info(`- protecting ${memberName}`);
      if (val) {
        setSecret(val.toString());
      }
    }
  );
}
function recurseMembers(obj, memberCallback, path) {
  const members = Object.keys(obj);
  path = path || [];
  for (let member of members) {
    const val = obj[member];
    const memberPath = [...path, member];
    if (typeof val === "object") {
      recurseMembers(val, memberCallback, memberPath);
    } else {
      memberCallback(val, memberPath.join("."));
    }
  }
}
function readEventPayload() {
  return JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
}
try {
  const eventName = process.env.GITHUB_EVENT_NAME;
  if (eventName === "repository_dispatch") {
    let allowlist = (getInput("allowlist") || "").split(",").filter((n) => n);
    protectClientPayload(readEventPayload().client_payload, allowlist);
  } else {
    console.log(`Ignoring ${eventName} event`);
  }
} catch (error2) {
  setFailed(error2.message);
}
