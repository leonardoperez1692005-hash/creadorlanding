'use client'

/**
 * Renders pre-compiled standalone HTML in an iframe that fills the viewport.
 * This approach ensures the compiled page is completely isolated from Next.js
 * styles/scripts, giving pixel-perfect output identical to WordPress deployment.
 */
export function CompiledHtmlPage({ html }: { html: string }) {
    return (
        <iframe
            srcDoc={html}
            title="Landing Page"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                border: 'none',
                margin: 0,
                padding: 0,
            }}
        />
    )
}
