type PageCallback = (...args: any[]) => void;

interface Route {
  pattern: RegExp;
  cb?: PageCallback;
}

interface Redirect {
  from: RegExp;
  to: string;
  cb?: PageCallback;
}

let _use: "hash" | "history";
let _url: string = "/";
let _routes: Route[] = [];
let _redirects: Redirect[] = [];
let _fallback: (() => void) | undefined;

function run(use: "hash" | "history", cb?: () => void) {
  _use = use;

  if (cb) cb();

  if (use === "hash")
    window.addEventListener("hashchange", () => { to() })

  to();
}

function to(url?: string) {
  switch (_use) {
    case "hash":
      if (!url) {
        const hashUrl = window.location.hash.substring(1);
        if (hashUrl !== "" && hashUrl !== "/") _url = hashUrl;
      }
      else {
        _url = url;
        window.location.hash = _url;
        return;
      }
      break;
    case "history":
      // TODO: Implement
      //if (!url) {
      //  url = window.location.pathname;
      //
      //  if (url.length > 1 && url.lastIndexOf("/") === url.length - 1)
      //    url = url.substring(0, url.length - 1);
      //}
      //else {
      //  window.history.replaceState(null, "", url);
      //}
      break;
    default:
      return;
  }

  // Handle redirect
  for (let i = 0; i < _redirects.length; ++i) {
    const match = _url.match(_redirects[i].from);
    if (match) {
      const oldUrl = _url;
      if (_redirects[i].cb) (_redirects[i].cb as PageCallback)(...match.slice(1));
      const newUrl = _url;

      if (oldUrl === newUrl) {
        if (_use === "hash") {
          window.location.hash = _redirects[i].to;
          return;
        }
        else {
          //_url = _redirects[i].to;
          //window.history.replaceState(null, "", _url);
        }
      }
      else {
        return;
      }
    }
  }

  // Handle routes
  for (let i = 0; i < _routes.length; ++i) {
    const match = _url.match(_routes[i].pattern);
    if (match) {
      if (_routes[i].cb) (_routes[i].cb as PageCallback)(...match.slice(1));
      return;
    }
  }

  // Handle fallback
  if (_fallback)
    _fallback();
}

function route(pattern: string, cb?: PageCallback) {
  _routes.push({
    pattern: new RegExp("^" + pattern + "$", "i"),
    cb: cb
  })
}

function redirect(pattern: string, to: string, cb?: PageCallback) {
  _redirects.push({
    from: new RegExp("^" + pattern + "$", "i"),
    to: to,
    cb: cb
  })
}

function fallback(cb: () => void) {
  _fallback = cb;
}

export const superpage = {
  run,
  to,
  route,
  redirect,
  fallback
};