import React, { memo, useMemo } from 'react';
import DOMPurify from 'dompurify';

const SvgRenderer = memo(({ svgString, maxWidth = 300, className = '' }) => {
    const sanitizedSvg = useMemo(() => {
        if (!svgString || typeof svgString !== 'string') return null;

        let svg = svgString.trim();

        // Ensure it starts with <svg and ends with </svg>
        const svgStart = svg.indexOf('<svg');
        const svgEnd = svg.lastIndexOf('</svg>');
        if (svgStart === -1 || svgEnd === -1) return null;
        svg = svg.substring(svgStart, svgEnd + 6);

        // Sanitize with DOMPurify's SVG profile — robust against the bypasses that
        // defeat regex stripping (split tags, <foreignObject>, <use href>, namespaced
        // handlers, encoded javascript:, etc.). SVG comes from AI/imported JSON.
        svg = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
        if (!svg || svg.indexOf('<svg') === -1) return null;

        // Force SVG to be responsive: remove fixed width/height, keep viewBox
        svg = svg.replace(/<svg([^>]*)>/, (match, attrs) => {
            // Remove fixed width and height attributes
            let newAttrs = attrs
                .replace(/\bwidth\s*=\s*["'][^"']*["']/gi, '')
                .replace(/\bheight\s*=\s*["'][^"']*["']/gi, '');
            // Ensure style makes it responsive
            if (!newAttrs.includes('style=')) {
                newAttrs += ' style="width:100%;height:auto;max-width:' + maxWidth + 'px"';
            }
            return `<svg${newAttrs}>`;
        });

        return svg;
    }, [svgString, maxWidth]);

    if (!sanitizedSvg) {
        return (
            <div className="flex items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 text-sm">
                ⚠️ ไม่สามารถแสดงรูปภาพได้
            </div>
        );
    }

    return (
        <div
            className={`svg-renderer flex items-center justify-center w-full ${className}`}
            style={{ maxWidth: '100%' }}
            dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
        />
    );
});

export default SvgRenderer;
