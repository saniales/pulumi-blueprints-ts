import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";

class AWSRDSInstance extends ComponentResource {
    constructor(name: string, opts: ComponentResourceOptions = {}) {
        super("database:aws:rds-instance", name, {}, opts);
    }
}

export { AWSRDSInstance };