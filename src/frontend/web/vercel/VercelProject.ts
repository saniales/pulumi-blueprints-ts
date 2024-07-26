import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";

class VercelWebsite extends ComponentResource {
    constructor(name: string, opts: ComponentResourceOptions = {}) {
        super("frontend:website:vercel", name, {}, opts);
    }
}

export { VercelWebsite };