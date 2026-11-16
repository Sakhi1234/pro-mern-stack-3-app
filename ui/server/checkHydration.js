// Isolated browser-like verification of the actual production client bundle.
// This worker never connects to the user's browser or an external website.
import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { JSDOM, VirtualConsole } from "jsdom";

const [origin, route, mode = "anonymous"] = process.argv.slice(2);
const cookie = mode === "signed-in" ? "jwt=alice" : "";
const response = await fetch(`${origin}${route}`, {
  headers: cookie ? { cookie } : {},
});
const html = await response.text();
const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", (error) => errors.push(error.message));
const dom = new JSDOM(html, {
  url: `${origin}${route}`,
  pretendToBeVisual: true,
  virtualConsole,
});
if (cookie) dom.window.document.cookie = cookie;
for (const name of [
  "window",
  "document",
  "navigator",
  "location",
  "HTMLElement",
  "Element",
  "Node",
  "DocumentFragment",
  "MutationObserver",
  "ShadowRoot",
  "SVGElement",
]) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: dom.window[name],
  });
}
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(
  dom.window,
);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(
  dom.window,
);
const requests = [];
const originalOpen = dom.window.XMLHttpRequest.prototype.open;
dom.window.XMLHttpRequest.prototype.open = function (method, url, ...args) {
  requests.push({ method, url: String(url) });
  return originalOpen.call(this, method, url, ...args);
};
globalThis.XMLHttpRequest = dom.window.XMLHttpRequest;
const originalError = console.error;
console.error = (...args) => errors.push(args.map(String).join(" "));

const waitFor = async (predicate, label) => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`Timed out: ${label}`);
};

try {
  const assets = new URL("../dist/client/assets/", import.meta.url);
  const entry = (await readdir(assets)).find(
    (name) => name.startsWith("index-") && name.endsWith(".js"),
  );
  await import(pathToFileURL(fileURLToPath(new URL(entry, assets))).href);
  // Allow initial hydration and passive effects to run before checking for duplicate requests.
  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.equal(errors.length, 0, errors.join("\n"));
  assert.equal(
    requests.length,
    0,
    `Initial hydration unexpectedly fetched: ${JSON.stringify(requests)}`,
  );
  const root = document.getElementById("root");
  assert.ok(root.textContent.trim().length > 0);

  if (route === "/issues" && mode === "anonymous") {
    const wrappers = [
      ...root.querySelectorAll('span[aria-label="Sign in to create an issue"]'),
    ];
    assert.equal(wrappers.length, 2);
    const cardCta = wrappers.find((wrapper) => !wrapper.closest("header"));
    // jsdom has no layout engine; give Popper a visible anchor for this interaction.
    cardCta.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 40,
      width: 100,
      height: 40,
    });
    cardCta.dispatchEvent(
      new window.MouseEvent("mouseover", { bubbles: true }),
    );
    await waitFor(
      () =>
        document.querySelector('[role="tooltip"]')?.textContent ===
        "Sign in to create an issue",
      "signed-out card tooltip",
    );
  } else if (route.startsWith("/issues/12")) {
    assert.ok(root.textContent.includes("SSR comment included"));
    const back = [...root.querySelectorAll("button")].find(
      (button) => button.textContent === "Back to Issues",
    );
    back.click();
    await waitFor(
      () => root.textContent.includes("issue page 1"),
      "detail to list navigation",
    );
    assert.ok(requests.some((request) => request.url.includes("/api/issues?")));
  } else if (route.startsWith("/report")) {
    window.history.pushState({}, "", "/report?status=Fixed");
    window.dispatchEvent(new window.PopStateEvent("popstate"));
    await waitFor(
      () => requests.some((request) => request.url.includes("status=Fixed")),
      "report query navigation",
    );
  } else if (route.startsWith("/edit/12") || route === "/create") {
    const title = root.querySelector('input[name="title"]');
    assert.ok(title);
    // Drive React's normal input/blur handling, then inspect the resulting form payload.
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    ).set;
    title.focus();
    setter.call(title, "Hydration form check");
    title.dispatchEvent(new window.Event("input", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    title.blur();
    await new Promise((resolve) => setTimeout(resolve, 30));
    const updatedTitle = root.querySelector('input[name="title"]');
    assert.equal(updatedTitle.value, "Hydration form check");
    if (mode === "signed-in") {
      updatedTitle
        .closest("form")
        .dispatchEvent(
          new window.Event("submit", { bubbles: true, cancelable: true }),
        );
      const method = route === "/create" ? "POST" : "PATCH";
      await waitFor(
        () => requests.some((request) => request.method === method),
        "form mutation to mock API",
      );
      await waitFor(
        () => root.textContent.includes("Mock form submission received"),
        "mock form response",
      );
    }
  }
  assert.equal(errors.length, 0, errors.join("\n"));
  originalError.call(console, `Hydration OK: ${route} (${mode})`);
} finally {
  console.error = originalError;
  dom.window.close();
}
// MUI toast/transition timers may still be active; this worker's assertions are complete.
process.exit(0);
