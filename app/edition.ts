declare const __FLINT_PUBLIC__: boolean | undefined;
// Local Vinext builds retain the owner's source-pack links. The Pages build
// includes references only and never copies the purchased source documents.
export const publicEdition = typeof __FLINT_PUBLIC__ !== 'undefined' && __FLINT_PUBLIC__;
