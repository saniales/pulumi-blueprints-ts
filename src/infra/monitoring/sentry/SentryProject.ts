import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";

class SentryProject extends ComponentResource {
    constructor(name: string, opts: ComponentResourceOptions = {}) {
        super("monitoring:sentry:sentry-project", name, {}, opts);
    }
}

export { SentryProject };