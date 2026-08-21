/**
 * Runtime validators for the two trust boundaries:
 *   - zOnboardingSubmission — the agency POST /api/onboarding handler.
 *   - zIntake / zQueuedIntake — the console intake/import handler.
 *
 * These are intentionally structural (not exhaustive on every copy field) so
 * they reject malformed envelopes without rejecting valid, partially-filled
 * submissions. Deep copy objects use passthrough; the mapper owns their shape.
 */
import { z } from "zod";
export declare const zImageMeta: z.ZodObject<{
    url: z.ZodString;
    filename: z.ZodString;
    alt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    url: string;
    alt: string;
    filename: string;
}, {
    url: string;
    alt: string;
    filename: string;
}>;
export declare const zAdditionalSiteEntry: z.ZodObject<{
    brandName: z.ZodString;
    brandShort: z.ZodDefault<z.ZodString>;
    brandTagline: z.ZodDefault<z.ZodString>;
    email: z.ZodDefault<z.ZodString>;
    phone: z.ZodDefault<z.ZodString>;
    address: z.ZodDefault<z.ZodString>;
    paletteAccent: z.ZodDefault<z.ZodString>;
    paletteBg: z.ZodDefault<z.ZodString>;
    paletteBgSoft: z.ZodDefault<z.ZodString>;
    paletteInk: z.ZodDefault<z.ZodString>;
    paletteInkSoft: z.ZodDefault<z.ZodString>;
    paletteRule: z.ZodDefault<z.ZodString>;
    heroHeadline: z.ZodDefault<z.ZodString>;
    heroSub: z.ZodDefault<z.ZodString>;
    businessHours: z.ZodDefault<z.ZodString>;
    usp: z.ZodDefault<z.ZodString>;
    services: z.ZodDefault<z.ZodArray<z.ZodObject<{
        t: z.ZodString;
        tag: z.ZodString;
        d: z.ZodString;
        images: z.ZodDefault<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        t: string;
        tag: string;
        d: string;
        images: {
            url: string;
            alt: string;
            filename: string;
        }[];
    }, {
        t: string;
        tag: string;
        d: string;
        images?: {
            url: string;
            alt: string;
            filename: string;
        }[] | undefined;
    }>, "many">>;
    faqs: z.ZodDefault<z.ZodArray<z.ZodObject<{
        q: z.ZodString;
        a: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        q: string;
        a: string;
    }, {
        q: string;
        a: string;
    }>, "many">>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    brandName: z.ZodString;
    brandShort: z.ZodDefault<z.ZodString>;
    brandTagline: z.ZodDefault<z.ZodString>;
    email: z.ZodDefault<z.ZodString>;
    phone: z.ZodDefault<z.ZodString>;
    address: z.ZodDefault<z.ZodString>;
    paletteAccent: z.ZodDefault<z.ZodString>;
    paletteBg: z.ZodDefault<z.ZodString>;
    paletteBgSoft: z.ZodDefault<z.ZodString>;
    paletteInk: z.ZodDefault<z.ZodString>;
    paletteInkSoft: z.ZodDefault<z.ZodString>;
    paletteRule: z.ZodDefault<z.ZodString>;
    heroHeadline: z.ZodDefault<z.ZodString>;
    heroSub: z.ZodDefault<z.ZodString>;
    businessHours: z.ZodDefault<z.ZodString>;
    usp: z.ZodDefault<z.ZodString>;
    services: z.ZodDefault<z.ZodArray<z.ZodObject<{
        t: z.ZodString;
        tag: z.ZodString;
        d: z.ZodString;
        images: z.ZodDefault<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        t: string;
        tag: string;
        d: string;
        images: {
            url: string;
            alt: string;
            filename: string;
        }[];
    }, {
        t: string;
        tag: string;
        d: string;
        images?: {
            url: string;
            alt: string;
            filename: string;
        }[] | undefined;
    }>, "many">>;
    faqs: z.ZodDefault<z.ZodArray<z.ZodObject<{
        q: z.ZodString;
        a: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        q: string;
        a: string;
    }, {
        q: string;
        a: string;
    }>, "many">>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    brandName: z.ZodString;
    brandShort: z.ZodDefault<z.ZodString>;
    brandTagline: z.ZodDefault<z.ZodString>;
    email: z.ZodDefault<z.ZodString>;
    phone: z.ZodDefault<z.ZodString>;
    address: z.ZodDefault<z.ZodString>;
    paletteAccent: z.ZodDefault<z.ZodString>;
    paletteBg: z.ZodDefault<z.ZodString>;
    paletteBgSoft: z.ZodDefault<z.ZodString>;
    paletteInk: z.ZodDefault<z.ZodString>;
    paletteInkSoft: z.ZodDefault<z.ZodString>;
    paletteRule: z.ZodDefault<z.ZodString>;
    heroHeadline: z.ZodDefault<z.ZodString>;
    heroSub: z.ZodDefault<z.ZodString>;
    businessHours: z.ZodDefault<z.ZodString>;
    usp: z.ZodDefault<z.ZodString>;
    services: z.ZodDefault<z.ZodArray<z.ZodObject<{
        t: z.ZodString;
        tag: z.ZodString;
        d: z.ZodString;
        images: z.ZodDefault<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        t: string;
        tag: string;
        d: string;
        images: {
            url: string;
            alt: string;
            filename: string;
        }[];
    }, {
        t: string;
        tag: string;
        d: string;
        images?: {
            url: string;
            alt: string;
            filename: string;
        }[] | undefined;
    }>, "many">>;
    faqs: z.ZodDefault<z.ZodArray<z.ZodObject<{
        q: z.ZodString;
        a: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        q: string;
        a: string;
    }, {
        q: string;
        a: string;
    }>, "many">>;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Structural validation of the onboarding payload. Top-level shape is required;
 * nested objects allow unknown keys (passthrough) to stay forward-compatible.
 */
export declare const zOnboardingSubmission: z.ZodObject<{
    selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
    contact: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    businessDetails: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    branding: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    announcement: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    seo: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    extensions: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    socialMedia: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    hero: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    about: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    servicesSection: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    work: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    testimonialsMeta: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    faqMeta: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    finalCta: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    footer: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    images: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    services: z.ZodDefault<z.ZodArray<z.ZodObject<{
        t: z.ZodString;
        tag: z.ZodString;
        d: z.ZodString;
        images: z.ZodDefault<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        t: string;
        tag: string;
        d: string;
        images: {
            url: string;
            alt: string;
            filename: string;
        }[];
    }, {
        t: string;
        tag: string;
        d: string;
        images?: {
            url: string;
            alt: string;
            filename: string;
        }[] | undefined;
    }>, "many">>;
    testimonials: z.ZodDefault<z.ZodArray<z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>, "many">>;
    heroBullets: z.ZodDefault<z.ZodArray<z.ZodObject<{
        value: z.ZodString;
        label: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value: string;
        label: string;
    }, {
        value: string;
        label: string;
    }>, "many">>;
    faqs: z.ZodDefault<z.ZodArray<z.ZodObject<{
        q: z.ZodString;
        a: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        q: string;
        a: string;
    }, {
        q: string;
        a: string;
    }>, "many">>;
    additionalSites: z.ZodOptional<z.ZodArray<z.ZodObject<{
        brandName: z.ZodString;
        brandShort: z.ZodDefault<z.ZodString>;
        brandTagline: z.ZodDefault<z.ZodString>;
        email: z.ZodDefault<z.ZodString>;
        phone: z.ZodDefault<z.ZodString>;
        address: z.ZodDefault<z.ZodString>;
        paletteAccent: z.ZodDefault<z.ZodString>;
        paletteBg: z.ZodDefault<z.ZodString>;
        paletteBgSoft: z.ZodDefault<z.ZodString>;
        paletteInk: z.ZodDefault<z.ZodString>;
        paletteInkSoft: z.ZodDefault<z.ZodString>;
        paletteRule: z.ZodDefault<z.ZodString>;
        heroHeadline: z.ZodDefault<z.ZodString>;
        heroSub: z.ZodDefault<z.ZodString>;
        businessHours: z.ZodDefault<z.ZodString>;
        usp: z.ZodDefault<z.ZodString>;
        services: z.ZodDefault<z.ZodArray<z.ZodObject<{
            t: z.ZodString;
            tag: z.ZodString;
            d: z.ZodString;
            images: z.ZodDefault<z.ZodArray<z.ZodObject<{
                url: z.ZodString;
                filename: z.ZodString;
                alt: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                url: string;
                alt: string;
                filename: string;
            }, {
                url: string;
                alt: string;
                filename: string;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            t: string;
            tag: string;
            d: string;
            images: {
                url: string;
                alt: string;
                filename: string;
            }[];
        }, {
            t: string;
            tag: string;
            d: string;
            images?: {
                url: string;
                alt: string;
                filename: string;
            }[] | undefined;
        }>, "many">>;
        faqs: z.ZodDefault<z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            a: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            q: string;
            a: string;
        }, {
            q: string;
            a: string;
        }>, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        brandName: z.ZodString;
        brandShort: z.ZodDefault<z.ZodString>;
        brandTagline: z.ZodDefault<z.ZodString>;
        email: z.ZodDefault<z.ZodString>;
        phone: z.ZodDefault<z.ZodString>;
        address: z.ZodDefault<z.ZodString>;
        paletteAccent: z.ZodDefault<z.ZodString>;
        paletteBg: z.ZodDefault<z.ZodString>;
        paletteBgSoft: z.ZodDefault<z.ZodString>;
        paletteInk: z.ZodDefault<z.ZodString>;
        paletteInkSoft: z.ZodDefault<z.ZodString>;
        paletteRule: z.ZodDefault<z.ZodString>;
        heroHeadline: z.ZodDefault<z.ZodString>;
        heroSub: z.ZodDefault<z.ZodString>;
        businessHours: z.ZodDefault<z.ZodString>;
        usp: z.ZodDefault<z.ZodString>;
        services: z.ZodDefault<z.ZodArray<z.ZodObject<{
            t: z.ZodString;
            tag: z.ZodString;
            d: z.ZodString;
            images: z.ZodDefault<z.ZodArray<z.ZodObject<{
                url: z.ZodString;
                filename: z.ZodString;
                alt: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                url: string;
                alt: string;
                filename: string;
            }, {
                url: string;
                alt: string;
                filename: string;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            t: string;
            tag: string;
            d: string;
            images: {
                url: string;
                alt: string;
                filename: string;
            }[];
        }, {
            t: string;
            tag: string;
            d: string;
            images?: {
                url: string;
                alt: string;
                filename: string;
            }[] | undefined;
        }>, "many">>;
        faqs: z.ZodDefault<z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            a: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            q: string;
            a: string;
        }, {
            q: string;
            a: string;
        }>, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        brandName: z.ZodString;
        brandShort: z.ZodDefault<z.ZodString>;
        brandTagline: z.ZodDefault<z.ZodString>;
        email: z.ZodDefault<z.ZodString>;
        phone: z.ZodDefault<z.ZodString>;
        address: z.ZodDefault<z.ZodString>;
        paletteAccent: z.ZodDefault<z.ZodString>;
        paletteBg: z.ZodDefault<z.ZodString>;
        paletteBgSoft: z.ZodDefault<z.ZodString>;
        paletteInk: z.ZodDefault<z.ZodString>;
        paletteInkSoft: z.ZodDefault<z.ZodString>;
        paletteRule: z.ZodDefault<z.ZodString>;
        heroHeadline: z.ZodDefault<z.ZodString>;
        heroSub: z.ZodDefault<z.ZodString>;
        businessHours: z.ZodDefault<z.ZodString>;
        usp: z.ZodDefault<z.ZodString>;
        services: z.ZodDefault<z.ZodArray<z.ZodObject<{
            t: z.ZodString;
            tag: z.ZodString;
            d: z.ZodString;
            images: z.ZodDefault<z.ZodArray<z.ZodObject<{
                url: z.ZodString;
                filename: z.ZodString;
                alt: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                url: string;
                alt: string;
                filename: string;
            }, {
                url: string;
                alt: string;
                filename: string;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            t: string;
            tag: string;
            d: string;
            images: {
                url: string;
                alt: string;
                filename: string;
            }[];
        }, {
            t: string;
            tag: string;
            d: string;
            images?: {
                url: string;
                alt: string;
                filename: string;
            }[] | undefined;
        }>, "many">>;
        faqs: z.ZodDefault<z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            a: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            q: string;
            a: string;
        }, {
            q: string;
            a: string;
        }>, "many">>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    formMode: z.ZodOptional<z.ZodEnum<["basic", "detailed"]>>;
    scrapeExistingWebsite: z.ZodOptional<z.ZodBoolean>;
    scrapeWebsiteDomain: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
    contact: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    businessDetails: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    branding: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    announcement: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    seo: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    extensions: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    socialMedia: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    hero: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    about: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    servicesSection: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    work: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    testimonialsMeta: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    faqMeta: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    finalCta: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    footer: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    images: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    services: z.ZodDefault<z.ZodArray<z.ZodObject<{
        t: z.ZodString;
        tag: z.ZodString;
        d: z.ZodString;
        images: z.ZodDefault<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        t: string;
        tag: string;
        d: string;
        images: {
            url: string;
            alt: string;
            filename: string;
        }[];
    }, {
        t: string;
        tag: string;
        d: string;
        images?: {
            url: string;
            alt: string;
            filename: string;
        }[] | undefined;
    }>, "many">>;
    testimonials: z.ZodDefault<z.ZodArray<z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>, "many">>;
    heroBullets: z.ZodDefault<z.ZodArray<z.ZodObject<{
        value: z.ZodString;
        label: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value: string;
        label: string;
    }, {
        value: string;
        label: string;
    }>, "many">>;
    faqs: z.ZodDefault<z.ZodArray<z.ZodObject<{
        q: z.ZodString;
        a: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        q: string;
        a: string;
    }, {
        q: string;
        a: string;
    }>, "many">>;
    additionalSites: z.ZodOptional<z.ZodArray<z.ZodObject<{
        brandName: z.ZodString;
        brandShort: z.ZodDefault<z.ZodString>;
        brandTagline: z.ZodDefault<z.ZodString>;
        email: z.ZodDefault<z.ZodString>;
        phone: z.ZodDefault<z.ZodString>;
        address: z.ZodDefault<z.ZodString>;
        paletteAccent: z.ZodDefault<z.ZodString>;
        paletteBg: z.ZodDefault<z.ZodString>;
        paletteBgSoft: z.ZodDefault<z.ZodString>;
        paletteInk: z.ZodDefault<z.ZodString>;
        paletteInkSoft: z.ZodDefault<z.ZodString>;
        paletteRule: z.ZodDefault<z.ZodString>;
        heroHeadline: z.ZodDefault<z.ZodString>;
        heroSub: z.ZodDefault<z.ZodString>;
        businessHours: z.ZodDefault<z.ZodString>;
        usp: z.ZodDefault<z.ZodString>;
        services: z.ZodDefault<z.ZodArray<z.ZodObject<{
            t: z.ZodString;
            tag: z.ZodString;
            d: z.ZodString;
            images: z.ZodDefault<z.ZodArray<z.ZodObject<{
                url: z.ZodString;
                filename: z.ZodString;
                alt: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                url: string;
                alt: string;
                filename: string;
            }, {
                url: string;
                alt: string;
                filename: string;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            t: string;
            tag: string;
            d: string;
            images: {
                url: string;
                alt: string;
                filename: string;
            }[];
        }, {
            t: string;
            tag: string;
            d: string;
            images?: {
                url: string;
                alt: string;
                filename: string;
            }[] | undefined;
        }>, "many">>;
        faqs: z.ZodDefault<z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            a: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            q: string;
            a: string;
        }, {
            q: string;
            a: string;
        }>, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        brandName: z.ZodString;
        brandShort: z.ZodDefault<z.ZodString>;
        brandTagline: z.ZodDefault<z.ZodString>;
        email: z.ZodDefault<z.ZodString>;
        phone: z.ZodDefault<z.ZodString>;
        address: z.ZodDefault<z.ZodString>;
        paletteAccent: z.ZodDefault<z.ZodString>;
        paletteBg: z.ZodDefault<z.ZodString>;
        paletteBgSoft: z.ZodDefault<z.ZodString>;
        paletteInk: z.ZodDefault<z.ZodString>;
        paletteInkSoft: z.ZodDefault<z.ZodString>;
        paletteRule: z.ZodDefault<z.ZodString>;
        heroHeadline: z.ZodDefault<z.ZodString>;
        heroSub: z.ZodDefault<z.ZodString>;
        businessHours: z.ZodDefault<z.ZodString>;
        usp: z.ZodDefault<z.ZodString>;
        services: z.ZodDefault<z.ZodArray<z.ZodObject<{
            t: z.ZodString;
            tag: z.ZodString;
            d: z.ZodString;
            images: z.ZodDefault<z.ZodArray<z.ZodObject<{
                url: z.ZodString;
                filename: z.ZodString;
                alt: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                url: string;
                alt: string;
                filename: string;
            }, {
                url: string;
                alt: string;
                filename: string;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            t: string;
            tag: string;
            d: string;
            images: {
                url: string;
                alt: string;
                filename: string;
            }[];
        }, {
            t: string;
            tag: string;
            d: string;
            images?: {
                url: string;
                alt: string;
                filename: string;
            }[] | undefined;
        }>, "many">>;
        faqs: z.ZodDefault<z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            a: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            q: string;
            a: string;
        }, {
            q: string;
            a: string;
        }>, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        brandName: z.ZodString;
        brandShort: z.ZodDefault<z.ZodString>;
        brandTagline: z.ZodDefault<z.ZodString>;
        email: z.ZodDefault<z.ZodString>;
        phone: z.ZodDefault<z.ZodString>;
        address: z.ZodDefault<z.ZodString>;
        paletteAccent: z.ZodDefault<z.ZodString>;
        paletteBg: z.ZodDefault<z.ZodString>;
        paletteBgSoft: z.ZodDefault<z.ZodString>;
        paletteInk: z.ZodDefault<z.ZodString>;
        paletteInkSoft: z.ZodDefault<z.ZodString>;
        paletteRule: z.ZodDefault<z.ZodString>;
        heroHeadline: z.ZodDefault<z.ZodString>;
        heroSub: z.ZodDefault<z.ZodString>;
        businessHours: z.ZodDefault<z.ZodString>;
        usp: z.ZodDefault<z.ZodString>;
        services: z.ZodDefault<z.ZodArray<z.ZodObject<{
            t: z.ZodString;
            tag: z.ZodString;
            d: z.ZodString;
            images: z.ZodDefault<z.ZodArray<z.ZodObject<{
                url: z.ZodString;
                filename: z.ZodString;
                alt: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                url: string;
                alt: string;
                filename: string;
            }, {
                url: string;
                alt: string;
                filename: string;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            t: string;
            tag: string;
            d: string;
            images: {
                url: string;
                alt: string;
                filename: string;
            }[];
        }, {
            t: string;
            tag: string;
            d: string;
            images?: {
                url: string;
                alt: string;
                filename: string;
            }[] | undefined;
        }>, "many">>;
        faqs: z.ZodDefault<z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            a: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            q: string;
            a: string;
        }, {
            q: string;
            a: string;
        }>, "many">>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    formMode: z.ZodOptional<z.ZodEnum<["basic", "detailed"]>>;
    scrapeExistingWebsite: z.ZodOptional<z.ZodBoolean>;
    scrapeWebsiteDomain: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
    contact: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    businessDetails: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    branding: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    announcement: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    seo: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    extensions: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    socialMedia: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    hero: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    about: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    servicesSection: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    work: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    testimonialsMeta: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    faqMeta: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    finalCta: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    footer: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    images: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    services: z.ZodDefault<z.ZodArray<z.ZodObject<{
        t: z.ZodString;
        tag: z.ZodString;
        d: z.ZodString;
        images: z.ZodDefault<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        t: string;
        tag: string;
        d: string;
        images: {
            url: string;
            alt: string;
            filename: string;
        }[];
    }, {
        t: string;
        tag: string;
        d: string;
        images?: {
            url: string;
            alt: string;
            filename: string;
        }[] | undefined;
    }>, "many">>;
    testimonials: z.ZodDefault<z.ZodArray<z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>, "many">>;
    heroBullets: z.ZodDefault<z.ZodArray<z.ZodObject<{
        value: z.ZodString;
        label: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value: string;
        label: string;
    }, {
        value: string;
        label: string;
    }>, "many">>;
    faqs: z.ZodDefault<z.ZodArray<z.ZodObject<{
        q: z.ZodString;
        a: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        q: string;
        a: string;
    }, {
        q: string;
        a: string;
    }>, "many">>;
    additionalSites: z.ZodOptional<z.ZodArray<z.ZodObject<{
        brandName: z.ZodString;
        brandShort: z.ZodDefault<z.ZodString>;
        brandTagline: z.ZodDefault<z.ZodString>;
        email: z.ZodDefault<z.ZodString>;
        phone: z.ZodDefault<z.ZodString>;
        address: z.ZodDefault<z.ZodString>;
        paletteAccent: z.ZodDefault<z.ZodString>;
        paletteBg: z.ZodDefault<z.ZodString>;
        paletteBgSoft: z.ZodDefault<z.ZodString>;
        paletteInk: z.ZodDefault<z.ZodString>;
        paletteInkSoft: z.ZodDefault<z.ZodString>;
        paletteRule: z.ZodDefault<z.ZodString>;
        heroHeadline: z.ZodDefault<z.ZodString>;
        heroSub: z.ZodDefault<z.ZodString>;
        businessHours: z.ZodDefault<z.ZodString>;
        usp: z.ZodDefault<z.ZodString>;
        services: z.ZodDefault<z.ZodArray<z.ZodObject<{
            t: z.ZodString;
            tag: z.ZodString;
            d: z.ZodString;
            images: z.ZodDefault<z.ZodArray<z.ZodObject<{
                url: z.ZodString;
                filename: z.ZodString;
                alt: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                url: string;
                alt: string;
                filename: string;
            }, {
                url: string;
                alt: string;
                filename: string;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            t: string;
            tag: string;
            d: string;
            images: {
                url: string;
                alt: string;
                filename: string;
            }[];
        }, {
            t: string;
            tag: string;
            d: string;
            images?: {
                url: string;
                alt: string;
                filename: string;
            }[] | undefined;
        }>, "many">>;
        faqs: z.ZodDefault<z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            a: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            q: string;
            a: string;
        }, {
            q: string;
            a: string;
        }>, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        brandName: z.ZodString;
        brandShort: z.ZodDefault<z.ZodString>;
        brandTagline: z.ZodDefault<z.ZodString>;
        email: z.ZodDefault<z.ZodString>;
        phone: z.ZodDefault<z.ZodString>;
        address: z.ZodDefault<z.ZodString>;
        paletteAccent: z.ZodDefault<z.ZodString>;
        paletteBg: z.ZodDefault<z.ZodString>;
        paletteBgSoft: z.ZodDefault<z.ZodString>;
        paletteInk: z.ZodDefault<z.ZodString>;
        paletteInkSoft: z.ZodDefault<z.ZodString>;
        paletteRule: z.ZodDefault<z.ZodString>;
        heroHeadline: z.ZodDefault<z.ZodString>;
        heroSub: z.ZodDefault<z.ZodString>;
        businessHours: z.ZodDefault<z.ZodString>;
        usp: z.ZodDefault<z.ZodString>;
        services: z.ZodDefault<z.ZodArray<z.ZodObject<{
            t: z.ZodString;
            tag: z.ZodString;
            d: z.ZodString;
            images: z.ZodDefault<z.ZodArray<z.ZodObject<{
                url: z.ZodString;
                filename: z.ZodString;
                alt: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                url: string;
                alt: string;
                filename: string;
            }, {
                url: string;
                alt: string;
                filename: string;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            t: string;
            tag: string;
            d: string;
            images: {
                url: string;
                alt: string;
                filename: string;
            }[];
        }, {
            t: string;
            tag: string;
            d: string;
            images?: {
                url: string;
                alt: string;
                filename: string;
            }[] | undefined;
        }>, "many">>;
        faqs: z.ZodDefault<z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            a: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            q: string;
            a: string;
        }, {
            q: string;
            a: string;
        }>, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        brandName: z.ZodString;
        brandShort: z.ZodDefault<z.ZodString>;
        brandTagline: z.ZodDefault<z.ZodString>;
        email: z.ZodDefault<z.ZodString>;
        phone: z.ZodDefault<z.ZodString>;
        address: z.ZodDefault<z.ZodString>;
        paletteAccent: z.ZodDefault<z.ZodString>;
        paletteBg: z.ZodDefault<z.ZodString>;
        paletteBgSoft: z.ZodDefault<z.ZodString>;
        paletteInk: z.ZodDefault<z.ZodString>;
        paletteInkSoft: z.ZodDefault<z.ZodString>;
        paletteRule: z.ZodDefault<z.ZodString>;
        heroHeadline: z.ZodDefault<z.ZodString>;
        heroSub: z.ZodDefault<z.ZodString>;
        businessHours: z.ZodDefault<z.ZodString>;
        usp: z.ZodDefault<z.ZodString>;
        services: z.ZodDefault<z.ZodArray<z.ZodObject<{
            t: z.ZodString;
            tag: z.ZodString;
            d: z.ZodString;
            images: z.ZodDefault<z.ZodArray<z.ZodObject<{
                url: z.ZodString;
                filename: z.ZodString;
                alt: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                url: string;
                alt: string;
                filename: string;
            }, {
                url: string;
                alt: string;
                filename: string;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            t: string;
            tag: string;
            d: string;
            images: {
                url: string;
                alt: string;
                filename: string;
            }[];
        }, {
            t: string;
            tag: string;
            d: string;
            images?: {
                url: string;
                alt: string;
                filename: string;
            }[] | undefined;
        }>, "many">>;
        faqs: z.ZodDefault<z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            a: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            q: string;
            a: string;
        }, {
            q: string;
            a: string;
        }>, "many">>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    formMode: z.ZodOptional<z.ZodEnum<["basic", "detailed"]>>;
    scrapeExistingWebsite: z.ZodOptional<z.ZodBoolean>;
    scrapeWebsiteDomain: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
/** A site is validated structurally: brand + _meta present, rest passthrough. */
export declare const zSiteContent: z.ZodObject<{
    brand: z.ZodObject<{
        name: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
    _meta: z.ZodObject<{
        schema_version: z.ZodString;
        missing_fields: z.ZodArray<z.ZodString, "many">;
        selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        schema_version: z.ZodString;
        missing_fields: z.ZodArray<z.ZodString, "many">;
        selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        schema_version: z.ZodString;
        missing_fields: z.ZodArray<z.ZodString, "many">;
        selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
    }, z.ZodTypeAny, "passthrough">>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    brand: z.ZodObject<{
        name: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
    _meta: z.ZodObject<{
        schema_version: z.ZodString;
        missing_fields: z.ZodArray<z.ZodString, "many">;
        selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        schema_version: z.ZodString;
        missing_fields: z.ZodArray<z.ZodString, "many">;
        selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        schema_version: z.ZodString;
        missing_fields: z.ZodArray<z.ZodString, "many">;
        selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
    }, z.ZodTypeAny, "passthrough">>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    brand: z.ZodObject<{
        name: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
    _meta: z.ZodObject<{
        schema_version: z.ZodString;
        missing_fields: z.ZodArray<z.ZodString, "many">;
        selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        schema_version: z.ZodString;
        missing_fields: z.ZodArray<z.ZodString, "many">;
        selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        schema_version: z.ZodString;
        missing_fields: z.ZodArray<z.ZodString, "many">;
        selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
    }, z.ZodTypeAny, "passthrough">>;
}, z.ZodTypeAny, "passthrough">>;
/** v1.11.0 — SMS alert opt-in snapshot carried on the envelope. */
export declare const zSmsAlerts: z.ZodObject<{
    consented: z.ZodBoolean;
    phone: z.ZodNullable<z.ZodString>;
    consentedAt: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    phone: string | null;
    consented: boolean;
    consentedAt: string | null;
}, {
    phone: string | null;
    consented: boolean;
    consentedAt: string | null;
}>;
export declare const zIntake: z.ZodObject<{
    plan: z.ZodEnum<["starter", "growth", "enterprise"]>;
    siteCount: z.ZodOptional<z.ZodNumber>;
    sites: z.ZodArray<z.ZodObject<{
        brand: z.ZodObject<{
            name: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        _meta: z.ZodObject<{
            schema_version: z.ZodString;
            missing_fields: z.ZodArray<z.ZodString, "many">;
            selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            schema_version: z.ZodString;
            missing_fields: z.ZodArray<z.ZodString, "many">;
            selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            schema_version: z.ZodString;
            missing_fields: z.ZodArray<z.ZodString, "many">;
            selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
        }, z.ZodTypeAny, "passthrough">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        brand: z.ZodObject<{
            name: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        _meta: z.ZodObject<{
            schema_version: z.ZodString;
            missing_fields: z.ZodArray<z.ZodString, "many">;
            selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            schema_version: z.ZodString;
            missing_fields: z.ZodArray<z.ZodString, "many">;
            selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            schema_version: z.ZodString;
            missing_fields: z.ZodArray<z.ZodString, "many">;
            selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        brand: z.ZodObject<{
            name: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        _meta: z.ZodObject<{
            schema_version: z.ZodString;
            missing_fields: z.ZodArray<z.ZodString, "many">;
            selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            schema_version: z.ZodString;
            missing_fields: z.ZodArray<z.ZodString, "many">;
            selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            schema_version: z.ZodString;
            missing_fields: z.ZodArray<z.ZodString, "many">;
            selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    smsAlerts: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        consented: z.ZodBoolean;
        phone: z.ZodNullable<z.ZodString>;
        consentedAt: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        phone: string | null;
        consented: boolean;
        consentedAt: string | null;
    }, {
        phone: string | null;
        consented: boolean;
        consentedAt: string | null;
    }>>>;
}, "strip", z.ZodTypeAny, {
    plan: "starter" | "growth" | "enterprise";
    sites: z.objectOutputType<{
        brand: z.ZodObject<{
            name: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        _meta: z.ZodObject<{
            schema_version: z.ZodString;
            missing_fields: z.ZodArray<z.ZodString, "many">;
            selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            schema_version: z.ZodString;
            missing_fields: z.ZodArray<z.ZodString, "many">;
            selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            schema_version: z.ZodString;
            missing_fields: z.ZodArray<z.ZodString, "many">;
            selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">[];
    siteCount?: number | undefined;
    smsAlerts?: {
        phone: string | null;
        consented: boolean;
        consentedAt: string | null;
    } | null | undefined;
}, {
    plan: "starter" | "growth" | "enterprise";
    sites: z.objectInputType<{
        brand: z.ZodObject<{
            name: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        _meta: z.ZodObject<{
            schema_version: z.ZodString;
            missing_fields: z.ZodArray<z.ZodString, "many">;
            selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            schema_version: z.ZodString;
            missing_fields: z.ZodArray<z.ZodString, "many">;
            selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            schema_version: z.ZodString;
            missing_fields: z.ZodArray<z.ZodString, "many">;
            selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">[];
    siteCount?: number | undefined;
    smsAlerts?: {
        phone: string | null;
        consented: boolean;
        consentedAt: string | null;
    } | null | undefined;
}>;
export declare const zQueuedIntake: z.ZodObject<{
    id: z.ZodString;
    receivedAt: z.ZodNumber;
    status: z.ZodEnum<["pending", "imported"]>;
    plan: z.ZodString;
    brandName: z.ZodString;
    slugGuess: z.ZodString;
    sessionId: z.ZodString;
    intake: z.ZodObject<{
        plan: z.ZodEnum<["starter", "growth", "enterprise"]>;
        siteCount: z.ZodOptional<z.ZodNumber>;
        sites: z.ZodArray<z.ZodObject<{
            brand: z.ZodObject<{
                name: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            _meta: z.ZodObject<{
                schema_version: z.ZodString;
                missing_fields: z.ZodArray<z.ZodString, "many">;
                selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                schema_version: z.ZodString;
                missing_fields: z.ZodArray<z.ZodString, "many">;
                selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                schema_version: z.ZodString;
                missing_fields: z.ZodArray<z.ZodString, "many">;
                selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
            }, z.ZodTypeAny, "passthrough">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            brand: z.ZodObject<{
                name: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            _meta: z.ZodObject<{
                schema_version: z.ZodString;
                missing_fields: z.ZodArray<z.ZodString, "many">;
                selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                schema_version: z.ZodString;
                missing_fields: z.ZodArray<z.ZodString, "many">;
                selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                schema_version: z.ZodString;
                missing_fields: z.ZodArray<z.ZodString, "many">;
                selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
            }, z.ZodTypeAny, "passthrough">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            brand: z.ZodObject<{
                name: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            _meta: z.ZodObject<{
                schema_version: z.ZodString;
                missing_fields: z.ZodArray<z.ZodString, "many">;
                selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                schema_version: z.ZodString;
                missing_fields: z.ZodArray<z.ZodString, "many">;
                selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                schema_version: z.ZodString;
                missing_fields: z.ZodArray<z.ZodString, "many">;
                selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
            }, z.ZodTypeAny, "passthrough">>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        smsAlerts: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            consented: z.ZodBoolean;
            phone: z.ZodNullable<z.ZodString>;
            consentedAt: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            phone: string | null;
            consented: boolean;
            consentedAt: string | null;
        }, {
            phone: string | null;
            consented: boolean;
            consentedAt: string | null;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        plan: "starter" | "growth" | "enterprise";
        sites: z.objectOutputType<{
            brand: z.ZodObject<{
                name: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            _meta: z.ZodObject<{
                schema_version: z.ZodString;
                missing_fields: z.ZodArray<z.ZodString, "many">;
                selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                schema_version: z.ZodString;
                missing_fields: z.ZodArray<z.ZodString, "many">;
                selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                schema_version: z.ZodString;
                missing_fields: z.ZodArray<z.ZodString, "many">;
                selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
            }, z.ZodTypeAny, "passthrough">>;
        }, z.ZodTypeAny, "passthrough">[];
        siteCount?: number | undefined;
        smsAlerts?: {
            phone: string | null;
            consented: boolean;
            consentedAt: string | null;
        } | null | undefined;
    }, {
        plan: "starter" | "growth" | "enterprise";
        sites: z.objectInputType<{
            brand: z.ZodObject<{
                name: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            _meta: z.ZodObject<{
                schema_version: z.ZodString;
                missing_fields: z.ZodArray<z.ZodString, "many">;
                selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                schema_version: z.ZodString;
                missing_fields: z.ZodArray<z.ZodString, "many">;
                selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                schema_version: z.ZodString;
                missing_fields: z.ZodArray<z.ZodString, "many">;
                selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
            }, z.ZodTypeAny, "passthrough">>;
        }, z.ZodTypeAny, "passthrough">[];
        siteCount?: number | undefined;
        smsAlerts?: {
            phone: string | null;
            consented: boolean;
            consentedAt: string | null;
        } | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "imported";
    plan: string;
    sessionId: string;
    id: string;
    brandName: string;
    receivedAt: number;
    slugGuess: string;
    intake: {
        plan: "starter" | "growth" | "enterprise";
        sites: z.objectOutputType<{
            brand: z.ZodObject<{
                name: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            _meta: z.ZodObject<{
                schema_version: z.ZodString;
                missing_fields: z.ZodArray<z.ZodString, "many">;
                selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                schema_version: z.ZodString;
                missing_fields: z.ZodArray<z.ZodString, "many">;
                selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                schema_version: z.ZodString;
                missing_fields: z.ZodArray<z.ZodString, "many">;
                selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
            }, z.ZodTypeAny, "passthrough">>;
        }, z.ZodTypeAny, "passthrough">[];
        siteCount?: number | undefined;
        smsAlerts?: {
            phone: string | null;
            consented: boolean;
            consentedAt: string | null;
        } | null | undefined;
    };
}, {
    status: "pending" | "imported";
    plan: string;
    sessionId: string;
    id: string;
    brandName: string;
    receivedAt: number;
    slugGuess: string;
    intake: {
        plan: "starter" | "growth" | "enterprise";
        sites: z.objectInputType<{
            brand: z.ZodObject<{
                name: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            _meta: z.ZodObject<{
                schema_version: z.ZodString;
                missing_fields: z.ZodArray<z.ZodString, "many">;
                selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                schema_version: z.ZodString;
                missing_fields: z.ZodArray<z.ZodString, "many">;
                selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                schema_version: z.ZodString;
                missing_fields: z.ZodArray<z.ZodString, "many">;
                selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
            }, z.ZodTypeAny, "passthrough">>;
        }, z.ZodTypeAny, "passthrough">[];
        siteCount?: number | undefined;
        smsAlerts?: {
            phone: string | null;
            consented: boolean;
            consentedAt: string | null;
        } | null | undefined;
    };
}>;
export declare const zBrandDirection: z.ZodObject<{
    differentiators: z.ZodDefault<z.ZodString>;
    targetCustomer: z.ZodDefault<z.ZodString>;
    vibe: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    tone: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    adjectives: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    references: z.ZodDefault<z.ZodString>;
    forbidden: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    differentiators: string;
    targetCustomer: string;
    vibe: string[];
    tone: string[];
    adjectives: string[];
    references: string;
    forbidden: string;
}, {
    differentiators?: string | undefined;
    targetCustomer?: string | undefined;
    vibe?: string[] | undefined;
    tone?: string[] | undefined;
    adjectives?: string[] | undefined;
    references?: string | undefined;
    forbidden?: string | undefined;
}>;
export declare const zPalettePick: z.ZodObject<{
    mode: z.ZodEnum<["preset", "custom"]>;
    presetId: z.ZodOptional<z.ZodString>;
    baseColor: z.ZodOptional<z.ZodString>;
    accentColor: z.ZodOptional<z.ZodString>;
    bgMood: z.ZodOptional<z.ZodEnum<["white", "warm", "cool", "soft-dark", "deep-dark"]>>;
    overrides: z.ZodOptional<z.ZodObject<{
        accent: z.ZodOptional<z.ZodString>;
        accentFg: z.ZodOptional<z.ZodString>;
        bg: z.ZodOptional<z.ZodString>;
        bgSoft: z.ZodOptional<z.ZodString>;
        ink: z.ZodOptional<z.ZodString>;
        inkSoft: z.ZodOptional<z.ZodString>;
        rule: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        accent?: string | undefined;
        accentFg?: string | undefined;
        bg?: string | undefined;
        bgSoft?: string | undefined;
        ink?: string | undefined;
        inkSoft?: string | undefined;
        rule?: string | undefined;
    }, {
        accent?: string | undefined;
        accentFg?: string | undefined;
        bg?: string | undefined;
        bgSoft?: string | undefined;
        ink?: string | undefined;
        inkSoft?: string | undefined;
        rule?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    mode: "custom" | "preset";
    presetId?: string | undefined;
    baseColor?: string | undefined;
    accentColor?: string | undefined;
    bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
    overrides?: {
        accent?: string | undefined;
        accentFg?: string | undefined;
        bg?: string | undefined;
        bgSoft?: string | undefined;
        ink?: string | undefined;
        inkSoft?: string | undefined;
        rule?: string | undefined;
    } | undefined;
}, {
    mode: "custom" | "preset";
    presetId?: string | undefined;
    baseColor?: string | undefined;
    accentColor?: string | undefined;
    bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
    overrides?: {
        accent?: string | undefined;
        accentFg?: string | undefined;
        bg?: string | undefined;
        bgSoft?: string | undefined;
        ink?: string | undefined;
        inkSoft?: string | undefined;
        rule?: string | undefined;
    } | undefined;
}>;
export declare const zBrandIntakeSubmission: z.ZodObject<{
    selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
    brandName: z.ZodDefault<z.ZodString>;
    brandShort: z.ZodDefault<z.ZodString>;
    email: z.ZodDefault<z.ZodString>;
    phone: z.ZodDefault<z.ZodString>;
    address: z.ZodDefault<z.ZodString>;
    license: z.ZodDefault<z.ZodString>;
    industry: z.ZodDefault<z.ZodString>;
    established: z.ZodDefault<z.ZodString>;
    notableClients: z.ZodDefault<z.ZodString>;
    certifications: z.ZodDefault<z.ZodString>;
    businessHours: z.ZodDefault<z.ZodString>;
    serviceArea: z.ZodDefault<z.ZodString>;
    agentName: z.ZodDefault<z.ZodString>;
    serviceList: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        tag: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        tag: string;
    }, {
        name: string;
        tag?: string | undefined;
    }>, "many">>;
    brandDirection: z.ZodObject<{
        differentiators: z.ZodDefault<z.ZodString>;
        targetCustomer: z.ZodDefault<z.ZodString>;
        vibe: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        tone: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        adjectives: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        references: z.ZodDefault<z.ZodString>;
        forbidden: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        differentiators: string;
        targetCustomer: string;
        vibe: string[];
        tone: string[];
        adjectives: string[];
        references: string;
        forbidden: string;
    }, {
        differentiators?: string | undefined;
        targetCustomer?: string | undefined;
        vibe?: string[] | undefined;
        tone?: string[] | undefined;
        adjectives?: string[] | undefined;
        references?: string | undefined;
        forbidden?: string | undefined;
    }>;
    palette: z.ZodObject<{
        mode: z.ZodEnum<["preset", "custom"]>;
        presetId: z.ZodOptional<z.ZodString>;
        baseColor: z.ZodOptional<z.ZodString>;
        accentColor: z.ZodOptional<z.ZodString>;
        bgMood: z.ZodOptional<z.ZodEnum<["white", "warm", "cool", "soft-dark", "deep-dark"]>>;
        overrides: z.ZodOptional<z.ZodObject<{
            accent: z.ZodOptional<z.ZodString>;
            accentFg: z.ZodOptional<z.ZodString>;
            bg: z.ZodOptional<z.ZodString>;
            bgSoft: z.ZodOptional<z.ZodString>;
            ink: z.ZodOptional<z.ZodString>;
            inkSoft: z.ZodOptional<z.ZodString>;
            rule: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            accent?: string | undefined;
            accentFg?: string | undefined;
            bg?: string | undefined;
            bgSoft?: string | undefined;
            ink?: string | undefined;
            inkSoft?: string | undefined;
            rule?: string | undefined;
        }, {
            accent?: string | undefined;
            accentFg?: string | undefined;
            bg?: string | undefined;
            bgSoft?: string | undefined;
            ink?: string | undefined;
            inkSoft?: string | undefined;
            rule?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        mode: "custom" | "preset";
        presetId?: string | undefined;
        baseColor?: string | undefined;
        accentColor?: string | undefined;
        bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
        overrides?: {
            accent?: string | undefined;
            accentFg?: string | undefined;
            bg?: string | undefined;
            bgSoft?: string | undefined;
            ink?: string | undefined;
            inkSoft?: string | undefined;
            rule?: string | undefined;
        } | undefined;
    }, {
        mode: "custom" | "preset";
        presetId?: string | undefined;
        baseColor?: string | undefined;
        accentColor?: string | undefined;
        bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
        overrides?: {
            accent?: string | undefined;
            accentFg?: string | undefined;
            bg?: string | undefined;
            bgSoft?: string | undefined;
            ink?: string | undefined;
            inkSoft?: string | undefined;
            rule?: string | undefined;
        } | undefined;
    }>;
    hasLogo: z.ZodDefault<z.ZodBoolean>;
    images: z.ZodObject<{
        logo: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>>;
        heroSlides: z.ZodDefault<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>, "many">>;
        aboutFeature: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        logo: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>>;
        heroSlides: z.ZodDefault<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>, "many">>;
        aboutFeature: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        logo: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>>;
        heroSlides: z.ZodDefault<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>, "many">>;
        aboutFeature: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>>;
    }, z.ZodTypeAny, "passthrough">>;
    existingWebsiteUrl: z.ZodDefault<z.ZodString>;
    announcement: z.ZodDefault<z.ZodString>;
    additionalSites: z.ZodOptional<z.ZodArray<z.ZodObject<{
        brandName: z.ZodString;
        brandShort: z.ZodDefault<z.ZodString>;
        email: z.ZodDefault<z.ZodString>;
        phone: z.ZodDefault<z.ZodString>;
        address: z.ZodDefault<z.ZodString>;
        businessHours: z.ZodDefault<z.ZodString>;
        serviceList: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            tag: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            tag: string;
        }, {
            name: string;
            tag?: string | undefined;
        }>, "many">>;
        palette: z.ZodObject<{
            mode: z.ZodEnum<["preset", "custom"]>;
            presetId: z.ZodOptional<z.ZodString>;
            baseColor: z.ZodOptional<z.ZodString>;
            accentColor: z.ZodOptional<z.ZodString>;
            bgMood: z.ZodOptional<z.ZodEnum<["white", "warm", "cool", "soft-dark", "deep-dark"]>>;
            overrides: z.ZodOptional<z.ZodObject<{
                accent: z.ZodOptional<z.ZodString>;
                accentFg: z.ZodOptional<z.ZodString>;
                bg: z.ZodOptional<z.ZodString>;
                bgSoft: z.ZodOptional<z.ZodString>;
                ink: z.ZodOptional<z.ZodString>;
                inkSoft: z.ZodOptional<z.ZodString>;
                rule: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            }, {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            mode: "custom" | "preset";
            presetId?: string | undefined;
            baseColor?: string | undefined;
            accentColor?: string | undefined;
            bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
            overrides?: {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            } | undefined;
        }, {
            mode: "custom" | "preset";
            presetId?: string | undefined;
            baseColor?: string | undefined;
            accentColor?: string | undefined;
            bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
            overrides?: {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            } | undefined;
        }>;
        brandDirection: z.ZodObject<{
            differentiators: z.ZodDefault<z.ZodString>;
            targetCustomer: z.ZodDefault<z.ZodString>;
            vibe: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            tone: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            adjectives: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            references: z.ZodDefault<z.ZodString>;
            forbidden: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            differentiators: string;
            targetCustomer: string;
            vibe: string[];
            tone: string[];
            adjectives: string[];
            references: string;
            forbidden: string;
        }, {
            differentiators?: string | undefined;
            targetCustomer?: string | undefined;
            vibe?: string[] | undefined;
            tone?: string[] | undefined;
            adjectives?: string[] | undefined;
            references?: string | undefined;
            forbidden?: string | undefined;
        }>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        brandName: z.ZodString;
        brandShort: z.ZodDefault<z.ZodString>;
        email: z.ZodDefault<z.ZodString>;
        phone: z.ZodDefault<z.ZodString>;
        address: z.ZodDefault<z.ZodString>;
        businessHours: z.ZodDefault<z.ZodString>;
        serviceList: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            tag: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            tag: string;
        }, {
            name: string;
            tag?: string | undefined;
        }>, "many">>;
        palette: z.ZodObject<{
            mode: z.ZodEnum<["preset", "custom"]>;
            presetId: z.ZodOptional<z.ZodString>;
            baseColor: z.ZodOptional<z.ZodString>;
            accentColor: z.ZodOptional<z.ZodString>;
            bgMood: z.ZodOptional<z.ZodEnum<["white", "warm", "cool", "soft-dark", "deep-dark"]>>;
            overrides: z.ZodOptional<z.ZodObject<{
                accent: z.ZodOptional<z.ZodString>;
                accentFg: z.ZodOptional<z.ZodString>;
                bg: z.ZodOptional<z.ZodString>;
                bgSoft: z.ZodOptional<z.ZodString>;
                ink: z.ZodOptional<z.ZodString>;
                inkSoft: z.ZodOptional<z.ZodString>;
                rule: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            }, {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            mode: "custom" | "preset";
            presetId?: string | undefined;
            baseColor?: string | undefined;
            accentColor?: string | undefined;
            bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
            overrides?: {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            } | undefined;
        }, {
            mode: "custom" | "preset";
            presetId?: string | undefined;
            baseColor?: string | undefined;
            accentColor?: string | undefined;
            bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
            overrides?: {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            } | undefined;
        }>;
        brandDirection: z.ZodObject<{
            differentiators: z.ZodDefault<z.ZodString>;
            targetCustomer: z.ZodDefault<z.ZodString>;
            vibe: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            tone: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            adjectives: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            references: z.ZodDefault<z.ZodString>;
            forbidden: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            differentiators: string;
            targetCustomer: string;
            vibe: string[];
            tone: string[];
            adjectives: string[];
            references: string;
            forbidden: string;
        }, {
            differentiators?: string | undefined;
            targetCustomer?: string | undefined;
            vibe?: string[] | undefined;
            tone?: string[] | undefined;
            adjectives?: string[] | undefined;
            references?: string | undefined;
            forbidden?: string | undefined;
        }>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        brandName: z.ZodString;
        brandShort: z.ZodDefault<z.ZodString>;
        email: z.ZodDefault<z.ZodString>;
        phone: z.ZodDefault<z.ZodString>;
        address: z.ZodDefault<z.ZodString>;
        businessHours: z.ZodDefault<z.ZodString>;
        serviceList: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            tag: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            tag: string;
        }, {
            name: string;
            tag?: string | undefined;
        }>, "many">>;
        palette: z.ZodObject<{
            mode: z.ZodEnum<["preset", "custom"]>;
            presetId: z.ZodOptional<z.ZodString>;
            baseColor: z.ZodOptional<z.ZodString>;
            accentColor: z.ZodOptional<z.ZodString>;
            bgMood: z.ZodOptional<z.ZodEnum<["white", "warm", "cool", "soft-dark", "deep-dark"]>>;
            overrides: z.ZodOptional<z.ZodObject<{
                accent: z.ZodOptional<z.ZodString>;
                accentFg: z.ZodOptional<z.ZodString>;
                bg: z.ZodOptional<z.ZodString>;
                bgSoft: z.ZodOptional<z.ZodString>;
                ink: z.ZodOptional<z.ZodString>;
                inkSoft: z.ZodOptional<z.ZodString>;
                rule: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            }, {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            mode: "custom" | "preset";
            presetId?: string | undefined;
            baseColor?: string | undefined;
            accentColor?: string | undefined;
            bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
            overrides?: {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            } | undefined;
        }, {
            mode: "custom" | "preset";
            presetId?: string | undefined;
            baseColor?: string | undefined;
            accentColor?: string | undefined;
            bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
            overrides?: {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            } | undefined;
        }>;
        brandDirection: z.ZodObject<{
            differentiators: z.ZodDefault<z.ZodString>;
            targetCustomer: z.ZodDefault<z.ZodString>;
            vibe: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            tone: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            adjectives: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            references: z.ZodDefault<z.ZodString>;
            forbidden: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            differentiators: string;
            targetCustomer: string;
            vibe: string[];
            tone: string[];
            adjectives: string[];
            references: string;
            forbidden: string;
        }, {
            differentiators?: string | undefined;
            targetCustomer?: string | undefined;
            vibe?: string[] | undefined;
            tone?: string[] | undefined;
            adjectives?: string[] | undefined;
            references?: string | undefined;
            forbidden?: string | undefined;
        }>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
    brandName: z.ZodDefault<z.ZodString>;
    brandShort: z.ZodDefault<z.ZodString>;
    email: z.ZodDefault<z.ZodString>;
    phone: z.ZodDefault<z.ZodString>;
    address: z.ZodDefault<z.ZodString>;
    license: z.ZodDefault<z.ZodString>;
    industry: z.ZodDefault<z.ZodString>;
    established: z.ZodDefault<z.ZodString>;
    notableClients: z.ZodDefault<z.ZodString>;
    certifications: z.ZodDefault<z.ZodString>;
    businessHours: z.ZodDefault<z.ZodString>;
    serviceArea: z.ZodDefault<z.ZodString>;
    agentName: z.ZodDefault<z.ZodString>;
    serviceList: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        tag: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        tag: string;
    }, {
        name: string;
        tag?: string | undefined;
    }>, "many">>;
    brandDirection: z.ZodObject<{
        differentiators: z.ZodDefault<z.ZodString>;
        targetCustomer: z.ZodDefault<z.ZodString>;
        vibe: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        tone: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        adjectives: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        references: z.ZodDefault<z.ZodString>;
        forbidden: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        differentiators: string;
        targetCustomer: string;
        vibe: string[];
        tone: string[];
        adjectives: string[];
        references: string;
        forbidden: string;
    }, {
        differentiators?: string | undefined;
        targetCustomer?: string | undefined;
        vibe?: string[] | undefined;
        tone?: string[] | undefined;
        adjectives?: string[] | undefined;
        references?: string | undefined;
        forbidden?: string | undefined;
    }>;
    palette: z.ZodObject<{
        mode: z.ZodEnum<["preset", "custom"]>;
        presetId: z.ZodOptional<z.ZodString>;
        baseColor: z.ZodOptional<z.ZodString>;
        accentColor: z.ZodOptional<z.ZodString>;
        bgMood: z.ZodOptional<z.ZodEnum<["white", "warm", "cool", "soft-dark", "deep-dark"]>>;
        overrides: z.ZodOptional<z.ZodObject<{
            accent: z.ZodOptional<z.ZodString>;
            accentFg: z.ZodOptional<z.ZodString>;
            bg: z.ZodOptional<z.ZodString>;
            bgSoft: z.ZodOptional<z.ZodString>;
            ink: z.ZodOptional<z.ZodString>;
            inkSoft: z.ZodOptional<z.ZodString>;
            rule: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            accent?: string | undefined;
            accentFg?: string | undefined;
            bg?: string | undefined;
            bgSoft?: string | undefined;
            ink?: string | undefined;
            inkSoft?: string | undefined;
            rule?: string | undefined;
        }, {
            accent?: string | undefined;
            accentFg?: string | undefined;
            bg?: string | undefined;
            bgSoft?: string | undefined;
            ink?: string | undefined;
            inkSoft?: string | undefined;
            rule?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        mode: "custom" | "preset";
        presetId?: string | undefined;
        baseColor?: string | undefined;
        accentColor?: string | undefined;
        bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
        overrides?: {
            accent?: string | undefined;
            accentFg?: string | undefined;
            bg?: string | undefined;
            bgSoft?: string | undefined;
            ink?: string | undefined;
            inkSoft?: string | undefined;
            rule?: string | undefined;
        } | undefined;
    }, {
        mode: "custom" | "preset";
        presetId?: string | undefined;
        baseColor?: string | undefined;
        accentColor?: string | undefined;
        bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
        overrides?: {
            accent?: string | undefined;
            accentFg?: string | undefined;
            bg?: string | undefined;
            bgSoft?: string | undefined;
            ink?: string | undefined;
            inkSoft?: string | undefined;
            rule?: string | undefined;
        } | undefined;
    }>;
    hasLogo: z.ZodDefault<z.ZodBoolean>;
    images: z.ZodObject<{
        logo: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>>;
        heroSlides: z.ZodDefault<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>, "many">>;
        aboutFeature: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        logo: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>>;
        heroSlides: z.ZodDefault<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>, "many">>;
        aboutFeature: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        logo: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>>;
        heroSlides: z.ZodDefault<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>, "many">>;
        aboutFeature: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>>;
    }, z.ZodTypeAny, "passthrough">>;
    existingWebsiteUrl: z.ZodDefault<z.ZodString>;
    announcement: z.ZodDefault<z.ZodString>;
    additionalSites: z.ZodOptional<z.ZodArray<z.ZodObject<{
        brandName: z.ZodString;
        brandShort: z.ZodDefault<z.ZodString>;
        email: z.ZodDefault<z.ZodString>;
        phone: z.ZodDefault<z.ZodString>;
        address: z.ZodDefault<z.ZodString>;
        businessHours: z.ZodDefault<z.ZodString>;
        serviceList: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            tag: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            tag: string;
        }, {
            name: string;
            tag?: string | undefined;
        }>, "many">>;
        palette: z.ZodObject<{
            mode: z.ZodEnum<["preset", "custom"]>;
            presetId: z.ZodOptional<z.ZodString>;
            baseColor: z.ZodOptional<z.ZodString>;
            accentColor: z.ZodOptional<z.ZodString>;
            bgMood: z.ZodOptional<z.ZodEnum<["white", "warm", "cool", "soft-dark", "deep-dark"]>>;
            overrides: z.ZodOptional<z.ZodObject<{
                accent: z.ZodOptional<z.ZodString>;
                accentFg: z.ZodOptional<z.ZodString>;
                bg: z.ZodOptional<z.ZodString>;
                bgSoft: z.ZodOptional<z.ZodString>;
                ink: z.ZodOptional<z.ZodString>;
                inkSoft: z.ZodOptional<z.ZodString>;
                rule: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            }, {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            mode: "custom" | "preset";
            presetId?: string | undefined;
            baseColor?: string | undefined;
            accentColor?: string | undefined;
            bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
            overrides?: {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            } | undefined;
        }, {
            mode: "custom" | "preset";
            presetId?: string | undefined;
            baseColor?: string | undefined;
            accentColor?: string | undefined;
            bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
            overrides?: {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            } | undefined;
        }>;
        brandDirection: z.ZodObject<{
            differentiators: z.ZodDefault<z.ZodString>;
            targetCustomer: z.ZodDefault<z.ZodString>;
            vibe: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            tone: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            adjectives: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            references: z.ZodDefault<z.ZodString>;
            forbidden: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            differentiators: string;
            targetCustomer: string;
            vibe: string[];
            tone: string[];
            adjectives: string[];
            references: string;
            forbidden: string;
        }, {
            differentiators?: string | undefined;
            targetCustomer?: string | undefined;
            vibe?: string[] | undefined;
            tone?: string[] | undefined;
            adjectives?: string[] | undefined;
            references?: string | undefined;
            forbidden?: string | undefined;
        }>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        brandName: z.ZodString;
        brandShort: z.ZodDefault<z.ZodString>;
        email: z.ZodDefault<z.ZodString>;
        phone: z.ZodDefault<z.ZodString>;
        address: z.ZodDefault<z.ZodString>;
        businessHours: z.ZodDefault<z.ZodString>;
        serviceList: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            tag: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            tag: string;
        }, {
            name: string;
            tag?: string | undefined;
        }>, "many">>;
        palette: z.ZodObject<{
            mode: z.ZodEnum<["preset", "custom"]>;
            presetId: z.ZodOptional<z.ZodString>;
            baseColor: z.ZodOptional<z.ZodString>;
            accentColor: z.ZodOptional<z.ZodString>;
            bgMood: z.ZodOptional<z.ZodEnum<["white", "warm", "cool", "soft-dark", "deep-dark"]>>;
            overrides: z.ZodOptional<z.ZodObject<{
                accent: z.ZodOptional<z.ZodString>;
                accentFg: z.ZodOptional<z.ZodString>;
                bg: z.ZodOptional<z.ZodString>;
                bgSoft: z.ZodOptional<z.ZodString>;
                ink: z.ZodOptional<z.ZodString>;
                inkSoft: z.ZodOptional<z.ZodString>;
                rule: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            }, {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            mode: "custom" | "preset";
            presetId?: string | undefined;
            baseColor?: string | undefined;
            accentColor?: string | undefined;
            bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
            overrides?: {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            } | undefined;
        }, {
            mode: "custom" | "preset";
            presetId?: string | undefined;
            baseColor?: string | undefined;
            accentColor?: string | undefined;
            bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
            overrides?: {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            } | undefined;
        }>;
        brandDirection: z.ZodObject<{
            differentiators: z.ZodDefault<z.ZodString>;
            targetCustomer: z.ZodDefault<z.ZodString>;
            vibe: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            tone: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            adjectives: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            references: z.ZodDefault<z.ZodString>;
            forbidden: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            differentiators: string;
            targetCustomer: string;
            vibe: string[];
            tone: string[];
            adjectives: string[];
            references: string;
            forbidden: string;
        }, {
            differentiators?: string | undefined;
            targetCustomer?: string | undefined;
            vibe?: string[] | undefined;
            tone?: string[] | undefined;
            adjectives?: string[] | undefined;
            references?: string | undefined;
            forbidden?: string | undefined;
        }>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        brandName: z.ZodString;
        brandShort: z.ZodDefault<z.ZodString>;
        email: z.ZodDefault<z.ZodString>;
        phone: z.ZodDefault<z.ZodString>;
        address: z.ZodDefault<z.ZodString>;
        businessHours: z.ZodDefault<z.ZodString>;
        serviceList: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            tag: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            tag: string;
        }, {
            name: string;
            tag?: string | undefined;
        }>, "many">>;
        palette: z.ZodObject<{
            mode: z.ZodEnum<["preset", "custom"]>;
            presetId: z.ZodOptional<z.ZodString>;
            baseColor: z.ZodOptional<z.ZodString>;
            accentColor: z.ZodOptional<z.ZodString>;
            bgMood: z.ZodOptional<z.ZodEnum<["white", "warm", "cool", "soft-dark", "deep-dark"]>>;
            overrides: z.ZodOptional<z.ZodObject<{
                accent: z.ZodOptional<z.ZodString>;
                accentFg: z.ZodOptional<z.ZodString>;
                bg: z.ZodOptional<z.ZodString>;
                bgSoft: z.ZodOptional<z.ZodString>;
                ink: z.ZodOptional<z.ZodString>;
                inkSoft: z.ZodOptional<z.ZodString>;
                rule: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            }, {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            mode: "custom" | "preset";
            presetId?: string | undefined;
            baseColor?: string | undefined;
            accentColor?: string | undefined;
            bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
            overrides?: {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            } | undefined;
        }, {
            mode: "custom" | "preset";
            presetId?: string | undefined;
            baseColor?: string | undefined;
            accentColor?: string | undefined;
            bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
            overrides?: {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            } | undefined;
        }>;
        brandDirection: z.ZodObject<{
            differentiators: z.ZodDefault<z.ZodString>;
            targetCustomer: z.ZodDefault<z.ZodString>;
            vibe: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            tone: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            adjectives: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            references: z.ZodDefault<z.ZodString>;
            forbidden: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            differentiators: string;
            targetCustomer: string;
            vibe: string[];
            tone: string[];
            adjectives: string[];
            references: string;
            forbidden: string;
        }, {
            differentiators?: string | undefined;
            targetCustomer?: string | undefined;
            vibe?: string[] | undefined;
            tone?: string[] | undefined;
            adjectives?: string[] | undefined;
            references?: string | undefined;
            forbidden?: string | undefined;
        }>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    selectedPlan: z.ZodEnum<["starter", "growth", "enterprise"]>;
    brandName: z.ZodDefault<z.ZodString>;
    brandShort: z.ZodDefault<z.ZodString>;
    email: z.ZodDefault<z.ZodString>;
    phone: z.ZodDefault<z.ZodString>;
    address: z.ZodDefault<z.ZodString>;
    license: z.ZodDefault<z.ZodString>;
    industry: z.ZodDefault<z.ZodString>;
    established: z.ZodDefault<z.ZodString>;
    notableClients: z.ZodDefault<z.ZodString>;
    certifications: z.ZodDefault<z.ZodString>;
    businessHours: z.ZodDefault<z.ZodString>;
    serviceArea: z.ZodDefault<z.ZodString>;
    agentName: z.ZodDefault<z.ZodString>;
    serviceList: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        tag: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        tag: string;
    }, {
        name: string;
        tag?: string | undefined;
    }>, "many">>;
    brandDirection: z.ZodObject<{
        differentiators: z.ZodDefault<z.ZodString>;
        targetCustomer: z.ZodDefault<z.ZodString>;
        vibe: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        tone: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        adjectives: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        references: z.ZodDefault<z.ZodString>;
        forbidden: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        differentiators: string;
        targetCustomer: string;
        vibe: string[];
        tone: string[];
        adjectives: string[];
        references: string;
        forbidden: string;
    }, {
        differentiators?: string | undefined;
        targetCustomer?: string | undefined;
        vibe?: string[] | undefined;
        tone?: string[] | undefined;
        adjectives?: string[] | undefined;
        references?: string | undefined;
        forbidden?: string | undefined;
    }>;
    palette: z.ZodObject<{
        mode: z.ZodEnum<["preset", "custom"]>;
        presetId: z.ZodOptional<z.ZodString>;
        baseColor: z.ZodOptional<z.ZodString>;
        accentColor: z.ZodOptional<z.ZodString>;
        bgMood: z.ZodOptional<z.ZodEnum<["white", "warm", "cool", "soft-dark", "deep-dark"]>>;
        overrides: z.ZodOptional<z.ZodObject<{
            accent: z.ZodOptional<z.ZodString>;
            accentFg: z.ZodOptional<z.ZodString>;
            bg: z.ZodOptional<z.ZodString>;
            bgSoft: z.ZodOptional<z.ZodString>;
            ink: z.ZodOptional<z.ZodString>;
            inkSoft: z.ZodOptional<z.ZodString>;
            rule: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            accent?: string | undefined;
            accentFg?: string | undefined;
            bg?: string | undefined;
            bgSoft?: string | undefined;
            ink?: string | undefined;
            inkSoft?: string | undefined;
            rule?: string | undefined;
        }, {
            accent?: string | undefined;
            accentFg?: string | undefined;
            bg?: string | undefined;
            bgSoft?: string | undefined;
            ink?: string | undefined;
            inkSoft?: string | undefined;
            rule?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        mode: "custom" | "preset";
        presetId?: string | undefined;
        baseColor?: string | undefined;
        accentColor?: string | undefined;
        bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
        overrides?: {
            accent?: string | undefined;
            accentFg?: string | undefined;
            bg?: string | undefined;
            bgSoft?: string | undefined;
            ink?: string | undefined;
            inkSoft?: string | undefined;
            rule?: string | undefined;
        } | undefined;
    }, {
        mode: "custom" | "preset";
        presetId?: string | undefined;
        baseColor?: string | undefined;
        accentColor?: string | undefined;
        bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
        overrides?: {
            accent?: string | undefined;
            accentFg?: string | undefined;
            bg?: string | undefined;
            bgSoft?: string | undefined;
            ink?: string | undefined;
            inkSoft?: string | undefined;
            rule?: string | undefined;
        } | undefined;
    }>;
    hasLogo: z.ZodDefault<z.ZodBoolean>;
    images: z.ZodObject<{
        logo: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>>;
        heroSlides: z.ZodDefault<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>, "many">>;
        aboutFeature: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        logo: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>>;
        heroSlides: z.ZodDefault<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>, "many">>;
        aboutFeature: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        logo: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>>;
        heroSlides: z.ZodDefault<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>, "many">>;
        aboutFeature: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            filename: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
            filename: string;
        }, {
            url: string;
            alt: string;
            filename: string;
        }>>;
    }, z.ZodTypeAny, "passthrough">>;
    existingWebsiteUrl: z.ZodDefault<z.ZodString>;
    announcement: z.ZodDefault<z.ZodString>;
    additionalSites: z.ZodOptional<z.ZodArray<z.ZodObject<{
        brandName: z.ZodString;
        brandShort: z.ZodDefault<z.ZodString>;
        email: z.ZodDefault<z.ZodString>;
        phone: z.ZodDefault<z.ZodString>;
        address: z.ZodDefault<z.ZodString>;
        businessHours: z.ZodDefault<z.ZodString>;
        serviceList: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            tag: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            tag: string;
        }, {
            name: string;
            tag?: string | undefined;
        }>, "many">>;
        palette: z.ZodObject<{
            mode: z.ZodEnum<["preset", "custom"]>;
            presetId: z.ZodOptional<z.ZodString>;
            baseColor: z.ZodOptional<z.ZodString>;
            accentColor: z.ZodOptional<z.ZodString>;
            bgMood: z.ZodOptional<z.ZodEnum<["white", "warm", "cool", "soft-dark", "deep-dark"]>>;
            overrides: z.ZodOptional<z.ZodObject<{
                accent: z.ZodOptional<z.ZodString>;
                accentFg: z.ZodOptional<z.ZodString>;
                bg: z.ZodOptional<z.ZodString>;
                bgSoft: z.ZodOptional<z.ZodString>;
                ink: z.ZodOptional<z.ZodString>;
                inkSoft: z.ZodOptional<z.ZodString>;
                rule: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            }, {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            mode: "custom" | "preset";
            presetId?: string | undefined;
            baseColor?: string | undefined;
            accentColor?: string | undefined;
            bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
            overrides?: {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            } | undefined;
        }, {
            mode: "custom" | "preset";
            presetId?: string | undefined;
            baseColor?: string | undefined;
            accentColor?: string | undefined;
            bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
            overrides?: {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            } | undefined;
        }>;
        brandDirection: z.ZodObject<{
            differentiators: z.ZodDefault<z.ZodString>;
            targetCustomer: z.ZodDefault<z.ZodString>;
            vibe: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            tone: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            adjectives: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            references: z.ZodDefault<z.ZodString>;
            forbidden: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            differentiators: string;
            targetCustomer: string;
            vibe: string[];
            tone: string[];
            adjectives: string[];
            references: string;
            forbidden: string;
        }, {
            differentiators?: string | undefined;
            targetCustomer?: string | undefined;
            vibe?: string[] | undefined;
            tone?: string[] | undefined;
            adjectives?: string[] | undefined;
            references?: string | undefined;
            forbidden?: string | undefined;
        }>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        brandName: z.ZodString;
        brandShort: z.ZodDefault<z.ZodString>;
        email: z.ZodDefault<z.ZodString>;
        phone: z.ZodDefault<z.ZodString>;
        address: z.ZodDefault<z.ZodString>;
        businessHours: z.ZodDefault<z.ZodString>;
        serviceList: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            tag: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            tag: string;
        }, {
            name: string;
            tag?: string | undefined;
        }>, "many">>;
        palette: z.ZodObject<{
            mode: z.ZodEnum<["preset", "custom"]>;
            presetId: z.ZodOptional<z.ZodString>;
            baseColor: z.ZodOptional<z.ZodString>;
            accentColor: z.ZodOptional<z.ZodString>;
            bgMood: z.ZodOptional<z.ZodEnum<["white", "warm", "cool", "soft-dark", "deep-dark"]>>;
            overrides: z.ZodOptional<z.ZodObject<{
                accent: z.ZodOptional<z.ZodString>;
                accentFg: z.ZodOptional<z.ZodString>;
                bg: z.ZodOptional<z.ZodString>;
                bgSoft: z.ZodOptional<z.ZodString>;
                ink: z.ZodOptional<z.ZodString>;
                inkSoft: z.ZodOptional<z.ZodString>;
                rule: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            }, {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            mode: "custom" | "preset";
            presetId?: string | undefined;
            baseColor?: string | undefined;
            accentColor?: string | undefined;
            bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
            overrides?: {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            } | undefined;
        }, {
            mode: "custom" | "preset";
            presetId?: string | undefined;
            baseColor?: string | undefined;
            accentColor?: string | undefined;
            bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
            overrides?: {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            } | undefined;
        }>;
        brandDirection: z.ZodObject<{
            differentiators: z.ZodDefault<z.ZodString>;
            targetCustomer: z.ZodDefault<z.ZodString>;
            vibe: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            tone: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            adjectives: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            references: z.ZodDefault<z.ZodString>;
            forbidden: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            differentiators: string;
            targetCustomer: string;
            vibe: string[];
            tone: string[];
            adjectives: string[];
            references: string;
            forbidden: string;
        }, {
            differentiators?: string | undefined;
            targetCustomer?: string | undefined;
            vibe?: string[] | undefined;
            tone?: string[] | undefined;
            adjectives?: string[] | undefined;
            references?: string | undefined;
            forbidden?: string | undefined;
        }>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        brandName: z.ZodString;
        brandShort: z.ZodDefault<z.ZodString>;
        email: z.ZodDefault<z.ZodString>;
        phone: z.ZodDefault<z.ZodString>;
        address: z.ZodDefault<z.ZodString>;
        businessHours: z.ZodDefault<z.ZodString>;
        serviceList: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            tag: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            tag: string;
        }, {
            name: string;
            tag?: string | undefined;
        }>, "many">>;
        palette: z.ZodObject<{
            mode: z.ZodEnum<["preset", "custom"]>;
            presetId: z.ZodOptional<z.ZodString>;
            baseColor: z.ZodOptional<z.ZodString>;
            accentColor: z.ZodOptional<z.ZodString>;
            bgMood: z.ZodOptional<z.ZodEnum<["white", "warm", "cool", "soft-dark", "deep-dark"]>>;
            overrides: z.ZodOptional<z.ZodObject<{
                accent: z.ZodOptional<z.ZodString>;
                accentFg: z.ZodOptional<z.ZodString>;
                bg: z.ZodOptional<z.ZodString>;
                bgSoft: z.ZodOptional<z.ZodString>;
                ink: z.ZodOptional<z.ZodString>;
                inkSoft: z.ZodOptional<z.ZodString>;
                rule: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            }, {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            mode: "custom" | "preset";
            presetId?: string | undefined;
            baseColor?: string | undefined;
            accentColor?: string | undefined;
            bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
            overrides?: {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            } | undefined;
        }, {
            mode: "custom" | "preset";
            presetId?: string | undefined;
            baseColor?: string | undefined;
            accentColor?: string | undefined;
            bgMood?: "white" | "warm" | "cool" | "soft-dark" | "deep-dark" | undefined;
            overrides?: {
                accent?: string | undefined;
                accentFg?: string | undefined;
                bg?: string | undefined;
                bgSoft?: string | undefined;
                ink?: string | undefined;
                inkSoft?: string | undefined;
                rule?: string | undefined;
            } | undefined;
        }>;
        brandDirection: z.ZodObject<{
            differentiators: z.ZodDefault<z.ZodString>;
            targetCustomer: z.ZodDefault<z.ZodString>;
            vibe: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            tone: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            adjectives: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            references: z.ZodDefault<z.ZodString>;
            forbidden: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            differentiators: string;
            targetCustomer: string;
            vibe: string[];
            tone: string[];
            adjectives: string[];
            references: string;
            forbidden: string;
        }, {
            differentiators?: string | undefined;
            targetCustomer?: string | undefined;
            vibe?: string[] | undefined;
            tone?: string[] | undefined;
            adjectives?: string[] | undefined;
            references?: string | undefined;
            forbidden?: string | undefined;
        }>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
}, z.ZodTypeAny, "passthrough">>;
//# sourceMappingURL=zod.d.ts.map