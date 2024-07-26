import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";

class AWSAppRunner extends ComponentResource {
    constructor(name: string, opts: ComponentResourceOptions = {}) {
        super("backend:docker-runner:aws-apprunner", name, {}, opts);
    }
}

export { AWSAppRunner };