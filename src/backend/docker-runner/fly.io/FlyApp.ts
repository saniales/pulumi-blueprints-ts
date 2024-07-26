import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";

class FlyApp extends ComponentResource {
    constructor(name: string, opts: ComponentResourceOptions = {}) {
        super("backend:docker-runner:fly-app", name, {}, opts);
    }
}

export { FlyApp };