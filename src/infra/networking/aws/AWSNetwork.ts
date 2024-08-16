import { 
    ComponentResource,
    ComponentResourceOptions
} from "@pulumi/pulumi";

import { 
    Vpc,
    VpcArgs,
    Subnet,
    RouteTableAssociation,
    InternetGateway,
    Route,
    RouteTable,
} from "@pulumi/aws/ec2";

interface AWSNetworkArgs {
    region: string
    vpc: VpcArgs
    numberOfSubnets: number
    tags: Record<string, string>
}

class AWSNetwork extends ComponentResource {
    private static readonly alphabet = "abcdefghijklmnopqrstuvwxyz";
    private static readonly defaultArgs: AWSNetworkArgs = {
        region: process.env.AWS_REGION || "eu-central-1",
        vpc: {
            cidrBlock: "10.0.0.0/16",
            enableDnsHostnames: true,
            enableDnsSupport: true,
        },
        numberOfSubnets: 3,
        tags: { },
    };

    public readonly name: string;
    public readonly vpc: Vpc;
    public readonly routeTable: RouteTable;
    public readonly subnets: Subnet[];
    public readonly routeTableAssociations: RouteTableAssociation[];
    public readonly internetGateway: InternetGateway;

    constructor(name: string, args: Partial<AWSNetworkArgs>, opts: ComponentResourceOptions = {}) {
        super("infra:networking:aws-network", name, {}, opts);

        this.name = name;
        const actualArgs = {
            ...AWSNetwork.defaultArgs,
            ...args,
            vpc: {
                ...AWSNetwork.defaultArgs.vpc,
                ...args.vpc,
            },
            tags: {
                ...AWSNetwork.defaultArgs.tags,
                ...args.tags,
            },
        };

        const vpcName = `${name}-vpc`;
        this.vpc = new Vpc(vpcName, {
            ...actualArgs.vpc,
            tags: {
                "Name": vpcName,
            },
        }, {
            parent: this,
        });

        const routeTableName = `${name}-rt`;
        this.routeTable = new RouteTable(routeTableName, {
            vpcId: this.vpc.id,
            tags: {
                ...actualArgs.tags,
                "Name": routeTableName,
            },
        }, {
            parent: this,
            dependsOn: [this.vpc],
        });

        this.registerOutputs({
            vpcId: this.vpc.id,
            routeTableId: this.routeTable.id,
        });

        this.subnets = [];
        this.routeTableAssociations = [];
        
        for (let i = 0; i < actualArgs.numberOfSubnets; i++) {
            const subnetName = `${name}-subnet-${i}`;
            const subnet = new Subnet(subnetName, {
                vpcId: this.vpc.id,
                cidrBlock: `10.0.${i}.0/24`,
                availabilityZone: `${actualArgs.region}${AWSNetwork.alphabet[i]}`,
                tags: {
                    ...actualArgs.tags,
                    "Name": subnetName,
                },
            }, {
                parent: this.vpc,
                dependsOn: [this.vpc],
            });

            this.subnets.push(subnet);

            const routeTableAssociationName = `${name}-rta-${i}`;
            const routeTableAssociation = new RouteTableAssociation(routeTableAssociationName, {
                routeTableId: this.routeTable.id,
                subnetId: subnet.id,
            }, {
                parent: this.routeTable,
                dependsOn: [subnet, this.routeTable],
            });

            this.routeTableAssociations.push(routeTableAssociation);
        }

        this.registerOutputs({
            subnetIds: this.subnets.map(subnet => subnet.id),
            routeTableAssociationIds: this.routeTableAssociations.map(rta => rta.id),
        });
        
        const internetGatewayName = `${name}-igw`;
        this.internetGateway = new InternetGateway(internetGatewayName, {
            vpcId: this.vpc.id,
            tags: {
                ...actualArgs.tags,
                "Name": internetGatewayName,
            },
        }, {
            parent: this,
            dependsOn: [this.vpc],
        });

        const internetGatewayRouteName = `${name}-igw-route`;
        const internetGatewayRoute = new Route(internetGatewayRouteName, {
            routeTableId: this.routeTable.id,
            destinationCidrBlock: "0.0.0.0/0",
            gatewayId: this.internetGateway.id,
        }, {
            parent: this.internetGateway,
            dependsOn: [this.routeTable, this.internetGateway],
        });

        this.registerOutputs({
            internetGatewayId: this.internetGateway.id,
            internetGatewayRouteId: internetGatewayRoute.id,
        });
    }
}

export { AWSNetwork, AWSNetworkArgs };