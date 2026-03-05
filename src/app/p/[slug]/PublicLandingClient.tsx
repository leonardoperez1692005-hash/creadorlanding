'use client'

import { LivePreview } from '@/features/wizard/components/LivePreview'
import type { WizardSection, DesignColors } from '@/features/wizard/types'
import Script from 'next/script'

interface PublicLandingClientProps {
    projectName: string
    visualModel: string
    sections: WizardSection[]
    colors: Record<string, string>
    meta: Record<string, string>
}

export function PublicLandingClient({
    projectName,
    visualModel,
    sections,
    colors,
    meta,
}: PublicLandingClientProps) {
    return (
        <>
            {/* Tracking Scripts */}
            {meta.facebook_pixel_id && (
                <Script id="fb-pixel" strategy="afterInteractive">{`
                    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
                    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
                    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
                    document,'script','https://connect.facebook.net/en_US/fbevents.js');
                    fbq('init', '${meta.facebook_pixel_id}');
                    fbq('track', 'PageView');
                `}</Script>
            )}
            {meta.google_analytics_id && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${meta.google_analytics_id}`}
                        strategy="afterInteractive"
                    />
                    <Script id="ga4" strategy="afterInteractive">{`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${meta.google_analytics_id}');
                    `}</Script>
                </>
            )}

            <div className="w-full min-h-screen">
                <LivePreview
                    data={{
                        sections,
                        customColors: colors as DesignColors,
                        visualModel: visualModel as 'dark' | 'light',
                        projectName,
                    }}
                />
            </div>
        </>
    )
}
