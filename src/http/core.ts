import { type RequestOptions } from './drivers';
import { Exception } from '../errors';
import type { Dict } from '../types';
import Response from './response';
import Headers from './headers';
import Request from './request';
import { is } from '../utils';

export * from './drivers';


type ClientRequestOptions = RequestOptions & {
  delay?: number;
  headers?: Dict<string> | Headers;
  body?: XMLHttpRequestBodyInit | Dict<unknown> | Document | ReadableStream;
}

type CreateClientOptions = {
  defaultHeaders?: Dict<string> | Headers;
  userAgent?: string;
}

interface HttpClient {
  get(endpoint: string, options?: ClientRequestOptions): Promise<Response>;
  post(endpoint: string, options?: ClientRequestOptions): Promise<Response>;
  put(endpoint: string, options?: ClientRequestOptions): Promise<Response>;
  patch(endpoint: string, options?: ClientRequestOptions): Promise<Response>;
  trace(endpoint: string, options?: ClientRequestOptions): Promise<Response>;
  delete(endpoint: string, options?: ClientRequestOptions): Promise<Response>;
  options(endpoint: string, options?: ClientRequestOptions): Promise<Response>;
  connect(endpoint: string, options?: ClientRequestOptions): Promise<Response>;
  head(endpoint: string, options?: ClientRequestOptions): Promise<Response>;
}

export const createClient = (function(baseurl: string | URL, options?: CreateClientOptions): HttpClient {
  if(!is.isString(baseurl) && !(baseurl instanceof URL)) {
    throw new Exception('Invalid baseurl provided, use an string or URL instance.');
  }

  if(!options) {
    options = {};
  }

  if(!options?.defaultHeaders) {
    options.defaultHeaders = {};
  }

  if(options.defaultHeaders && options.defaultHeaders instanceof Headers) {
    const h = options.defaultHeaders;
    options.defaultHeaders = {};

    for(const [name, value] of h.entries()) {
      options.defaultHeaders[name] = value;
    }
  }

  if(options.userAgent) {
    options.defaultHeaders['User-Agent'] = options.userAgent;
  }

  function _prepareRequest(endpoint: string, method: string, ro?: ClientRequestOptions): Request {
    const req = new Request(new URL(endpoint, baseurl), {
      method: method as unknown as any,
      redirect: ro?.redirect ?? 'follow',
    });

    if(ro?.headers && ro.headers instanceof Headers) {
      const h = ro.headers;
      ro.headers = {};

      for(const [name, value] of h.entries()) {
        ro.headers[name] = value;
      }
    }

    const headers = Object.assign({}, ro?.headers, options?.defaultHeaders);

    for(const prop in headers) {
      req.setHeader(prop, headers[prop]);
    }

    if(ro?.body) {
      req.setBody(ro.body);
    }

    if(ro?.delay) {
      req.delay = ro.delay;
    }

    if(ro?.timeout) {
      req.setTimeout(ro.timeout);
    }

    return req;
  }


  function _get(endpoint: string, ro?: ClientRequestOptions): Promise<Response> {
    const request = _prepareRequest(endpoint, 'GET', ro);
    return request.send();
  }

  function _post(endpoint: string, ro?: ClientRequestOptions): Promise<Response> {
    const request = _prepareRequest(endpoint, 'POST', ro);
    return request.send();
  }

  function _put(endpoint: string, ro?: ClientRequestOptions): Promise<Response> {
    const request = _prepareRequest(endpoint, 'PUT', ro);
    return request.send();
  }

  function _patch(endpoint: string, ro?: ClientRequestOptions): Promise<Response> {
    const request = _prepareRequest(endpoint, 'PATCH', ro);
    return request.send();
  }

  function _delete(endpoint: string, ro?: ClientRequestOptions): Promise<Response> {
    const request = _prepareRequest(endpoint, 'DELETE', ro);
    return request.send();
  }

  function _options(endpoint: string, ro?: ClientRequestOptions): Promise<Response> {
    const request = _prepareRequest(endpoint, 'OPTIONS', ro);
    return request.send();
  }

  function _head(endpoint: string, ro?: ClientRequestOptions): Promise<Response> {
    const request = _prepareRequest(endpoint, 'HEAD', ro);
    return request.send();
  }

  function _connect(endpoint: string, ro?: ClientRequestOptions): Promise<Response> {
    const request = _prepareRequest(endpoint, 'CONNECT', ro);
    return request.send();
  }

  function _trace(endpoint: string, ro?: ClientRequestOptions): Promise<Response> {
    const request = _prepareRequest(endpoint, 'TRACE', ro);
    return request.send();
  }

  return Object.freeze({
    get get() {
      return _get;
    },

    get post() {
      return _post;
    },

    get put() {
      return _put;
    },

    get patch() {
      return _patch;
    },

    get delete() {
      return _delete;
    },

    get options() {
      return _options;
    },

    get head() {
      return _head;
    },

    get connect() {
      return _connect;
    },

    get trace() {
      return _trace;
    },
  });
});