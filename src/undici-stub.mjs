const unsupported = () => {
  throw new Error('undici is stubbed out of this bundle; the action makes no HTTP requests')
}

export class ProxyAgent { constructor() { unsupported() } }
export class Agent { constructor() { unsupported() } }
export const fetch = unsupported
