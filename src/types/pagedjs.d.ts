// Type definitions for pagedjs
declare module 'pagedjs' {
    export class Previewer {
        preview(
            content: HTMLElement | string,
            stylesheets?: Array<{ type: string; content: string }>,
            container?: HTMLElement
        ): Promise<{ total: number; pages: HTMLElement[] }>;
    }

    export class Chunker {
        // Add other types as needed
    }

    export class Polisher {
        // Add other types as needed  
    }
}
