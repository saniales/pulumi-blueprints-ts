import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";

class AWSRDSCluster extends ComponentResource {
    constructor(name: string, opts: ComponentResourceOptions = {}) {
        super("database:aws:rds-cluster", name, {}, opts);
    }
}

export { AWSRDSCluster };