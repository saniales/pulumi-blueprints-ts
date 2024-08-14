import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";
import { AWSNetwork, AWSNetworkArgs } from "@/infra/networking/aws/AWSNetwork";

interface AWSAppRunnerArgs {
    network? : AWSNetwork | null
}

class AWSAppRunner extends ComponentResource {
    private static defaultArgs: AWSAppRunnerArgs = {
        network: null
    };

    private args : AWSAppRunnerArgs;

    constructor(
        name: string,
        args: Partial<AWSAppRunnerArgs>,
        opts: ComponentResourceOptions = {},
    ) {
        super("backend:docker-runner:aws-network", name, {}, opts);

        this.args = {...AWSAppRunner.defaultArgs, ...args};

        if (!this.args.network) {
            const networkArgs : Partial<AWSNetworkArgs> = {
                
            };

            const networkOpts : ComponentResourceOptions = {
                parent: this,
            };

            this.args.network = new AWSNetwork(`${name}-net`, networkArgs, networkOpts);
        }
    }
}

export { AWSAppRunner, AWSAppRunnerArgs };