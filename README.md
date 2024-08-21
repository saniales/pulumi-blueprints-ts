# pulumi-blueprints-ts

A collection of Pulumi blueprints in Typescript

## Usage

``` bash
npm install @saniales/pulumi-blueprints-ts
```

and then in your pulumi script

``` Typescript
import * as pulumi from "@pulumi/pulumi";

import { AWSNetwork } from "@saniales/pulumi-blueprints-ts/infra/networking/aws";

const awsNetwork = new AWSNetwork("test-network", {
    region: "eu-central-1",
    vpc: {
        cidrBlock: "10.0.0.0/16",
        enableDnsHostnames: true,
        enableDnsSupport: true,
    }
});

// ...
```
