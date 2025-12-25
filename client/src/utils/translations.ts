// Utility to get translated category name
export function getCategoryName(t: any, categoryId: string): string {
    // Use bracket notation to access nested keys with colons
    // Instead of 'categories.zlib_category_id:1', we need to access it properly
    const translated = t(`categories.${categoryId}`, { keySeparator: false });

    // If translation failed, fallback
    if (!translated || translated === `categories.${categoryId}`) {
        const cleanId = categoryId.replace('zlib_category_id:', '');
        return `Category ${cleanId}`;
    }

    return translated;
}

// Utility to get translated content type name  
export function getContentTypeName(t: (key: string) => string, contentTypeId: string): string {
    // First try the direct key (server-side format like "book_fiction")
    let translated = t(contentTypeId);

    // If not found, try with "content." prefix
    if (translated === contentTypeId) {
        translated = t(`content.${contentTypeId}`);
    }

    // If still not found, fallback to formatted version
    if (translated === contentTypeId || translated === `content.${contentTypeId}`) {
        return contentTypeId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    return translated;
}
