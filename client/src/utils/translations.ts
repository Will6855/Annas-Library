// Utility to get translated category name
export function getCategoryName(t: any, categoryId: string): string {
    // Try direct key lookup with 'categories.' prefix
    // This will work with the properly configured i18next
    const directKey = `categories.${categoryId}`;
    const translated = t(directKey);
    
    // If we got a real translation (not the key itself), return it
    if (translated && translated !== directKey) {
        return translated;
    }
    
    // Fallback: try getting the categories object directly
    try {
        const categoriesObj = t('categories', { returnObjects: true });
        if (categoriesObj && typeof categoriesObj === 'object' && categoryId in categoriesObj) {
            const value = categoriesObj[categoryId];
            if (value && typeof value === 'string') {
                return value;
            }
        }
    } catch (e) {
        // Fallback if returnObjects doesn't work
    }

    // Final fallback to formatted version
    const cleanId = categoryId.replace('zlib_category_id:', '');
    return `Category ${cleanId}`;
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
