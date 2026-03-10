// =============================================
// BrandVortix — Embeddable Widget Compiler
// Generates a self-contained JS snippet that creates
// a shadow DOM with the compiled landing HTML
// =============================================

/**
 * Compiles a landing HTML string into an embeddable JavaScript widget.
 * The widget creates a shadow DOM to avoid CSS conflicts with the host page.
 *
 * Usage: paste the returned <script> tag into any website.
 */
export function compileWidget(
    landingHtml: string,
    options: {
        containerId?: string
        maxWidth?: string
        height?: string
    } = {},
): string {
    const id = options.containerId ?? 'bv-widget'
    const maxWidth = options.maxWidth ?? '100%'
    const height = options.height ?? '100vh'

    // Escape backticks and backslashes for template literal embedding
    const escapedHtml = landingHtml
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$')

    return `<script>
(function(){
  var c=document.getElementById("${id}");
  if(!c){c=document.createElement("div");c.id="${id}";document.currentScript.parentNode.insertBefore(c,document.currentScript)}
  var s=c.attachShadow({mode:"closed"});
  var f=document.createElement("iframe");
  f.style.cssText="width:100%;max-width:${maxWidth};height:${height};border:none;display:block;margin:0 auto";
  f.sandbox="allow-scripts allow-same-origin allow-popups allow-forms";
  s.appendChild(f);
  f.contentDocument.open();
  f.contentDocument.write(\`${escapedHtml}\`);
  f.contentDocument.close();
})();
</script>`
}

/**
 * Generates a widget embed code snippet for display to the user.
 * Includes a CDN-like URL for hosted version, or inline version.
 */
export function generateEmbedSnippet(projectSlug: string, baseUrl: string): string {
    return `<!-- BrandVortix Widget — ${projectSlug} -->
<div id="bv-widget-${projectSlug}"></div>
<script src="${baseUrl}/api/exports/widget?slug=${encodeURIComponent(projectSlug)}"></script>`
}
