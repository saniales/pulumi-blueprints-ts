import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";

class SentryProject extends ComponentResource {
    constructor(name: string, opts: ComponentResourceOptions = {}) {
        super("project:repository:github", name, {}, opts);
    }
}

export { SentryProject };