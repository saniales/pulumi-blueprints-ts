import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";
import { PagesProject } from "@pulumi/cloudflare";

interface CloudFlarePagesProjectArgs {
    cloudflare: {
        accountID: string
    },
    build: {
        cache?: boolean
        buildCommand?: string
        destinationDir?: string
    }
}

class CloudFlarePagesProject extends ComponentResource {
    private static readonly defaultArgs: CloudFlarePagesProjectArgs = {
        cloudflare: {
            accountID: "",
        },
        build: {
            cache: false,
            buildCommand: "npm run build",
            destinationDir: "dist",
        }
    };

    public readonly name: string;
    public readonly cloudflarePagesProject: PagesProject;

    constructor(name: string, args: CloudFlarePagesProjectArgs, opts: ComponentResourceOptions = {}) {
        super("web:cloudflare-pages:project", name, {}, opts);

        this.name = name;

        const actualArgs : CloudFlarePagesProjectArgs = {
            ...CloudFlarePagesProject.defaultArgs,
            ...args,

            build: {
                ...CloudFlarePagesProject.defaultArgs.build,
                ...args.build
            }
        };

        if (actualArgs.cloudflare.accountID === "") {
            throw new Error("cloudflare.accountID must not be empty");
        } else if (actualArgs.build.buildCommand === "") {
            throw new Error("build.buildCommand must not be empty");
        } else if (actualArgs.build.destinationDir === "") {
            throw new Error("build.destinationDir must not be empty");
        }

        this.cloudflarePagesProject = new PagesProject(this.name, {
            name: this.name,
            accountId: args.cloudflare.accountID,
            productionBranch: "main",
            buildConfig: {
                buildCaching: actualArgs.build.cache,
                buildCommand: actualArgs.build.buildCommand,
                destinationDir: actualArgs.build.destinationDir,
            }
        }, {
            parent: this,
        });
    }
} 

export { CloudFlarePagesProject, CloudFlarePagesProjectArgs };