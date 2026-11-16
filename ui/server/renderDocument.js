export function renderDocument(
  template,
  { html = "", styles = "" } = {},
  initialData = null,
) {
  // Escape '<' so data cannot close the script element and inject HTML.
  const data =
    initialData == null
      ? ""
      : `<script id="initial-data" type="application/json">${JSON.stringify(
          initialData,
        ).replace(/</g, "\\u003c")}</script>`;
  return template
    .replace("<!--ssr-styles-->", () => styles)
    .replace("<!--ssr-outlet-->", () => html)
    .replace("<!--ssr-data-->", () => data);
}
