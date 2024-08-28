import { Branch, BranchDefault, Repository, RepositoryEnvironment, RepositoryEnvironmentDeploymentPolicy, TeamRepository } from "@pulumi/github";
import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";

interface GithubRepositoryArgs {
    git: {
        defaultBranch: string

        branches: string[]
    }

    repository: Partial<{
        description: string | null
        visibility: "public" | "private"
        homePageURL: string | null
        topics: string[]

        basedOnTemplate: {
            owner: string
            repository: string
        } | null

        isTemplate: boolean
    }>

    organization: {
        name: string
        teams?: string[]
    } | null

    enabledFeatures: Partial<{
        issues: boolean
        discussions: boolean
        projects: boolean
        wiki: boolean
        securityAlerts: boolean
    }>
}

/**
 * Represents a Github repository managed via Pulumi with a pre-set configuration.
 * 
 * It represents a default set repository, with optional extra features manageable through args.
 * 
 * For example, it is possible to have a repository with multiple branches, and default branch. 
 * For every specified branch, a github environment will be created with branch rules.
 * 
 * It is also possible to import from a template and assign the repository to one or more teams in an organization.
 * 
 * @see https://www.pulumi.com/registry/packages/github
 * @see https://www.pulumi.com/registry/packages/github/repository
 * @see https://www.pulumi.com/registry/packages/github/installation-configuration
 */
class GithubRepository extends ComponentResource {
    private static readonly defaultArgs: GithubRepositoryArgs = {
        git: {
            defaultBranch: "main",
            branches: ["develop", "staging", "main"],
        },

        repository: {
            description: null,
            visibility: "private",
            homePageURL: null,
            topics: [],

            basedOnTemplate: null,
            isTemplate: false,
        },

        organization: null,

        enabledFeatures: {
            issues: false,
            discussions: false,
            projects: false,
            wiki: false,
            securityAlerts: true,
        }
    };

    public readonly name: string;
    public readonly repository: Repository;
    
    protected branchDefault: BranchDefault;
    protected branches: Branch[];
    protected environments: RepositoryEnvironment[];
    protected environmentPolicies: RepositoryEnvironmentDeploymentPolicy[];
    protected organizationTeams: TeamRepository[];

    /**
     * Creates a new Github repository and associated resources.
     * @param name The name of the repository (and pulumi resource)
     * @param args The arguments for the repository configuration
     * @param opts The options for the Pulumi component resource
     */
    constructor(name: string, args: Partial<GithubRepositoryArgs>, opts: ComponentResourceOptions = {}) {
        super("project:repository:github", name, {}, opts);

        process.env.GITHUB_OWNER = process.env.GITHUB_OWNER ?? args.organization?.name ?? undefined;

        this.name = name;

        const actualArgs = {
            ...GithubRepository.defaultArgs,
            ...args,
            git: {
                ...GithubRepository.defaultArgs.git,
                ...args.git,
            },
            repository: {
                ...GithubRepository.defaultArgs.repository,
                ...args.repository,
            },
            organization: {
                ...GithubRepository.defaultArgs.organization,
                ...args.organization,
            },
            enabledFeatures: {
                ...GithubRepository.defaultArgs.enabledFeatures,
                ...args.enabledFeatures,
            },
        };

        if (name === null) {
            throw new Error("Github repository: repository name is required");
        }

        if (!actualArgs.git.branches.includes(actualArgs.git.defaultBranch)) {
            throw new Error(`Github repository: default branch ${actualArgs.git.defaultBranch} is not in the list of branches ${actualArgs.git.branches}`);
        }

        this.repository = new Repository(name, {
            name,
            description: actualArgs.repository.description ?? undefined,
            visibility: actualArgs.repository.visibility,
            homepageUrl: actualArgs.repository.homePageURL ?? undefined,
            topics: actualArgs.repository.topics,
            autoInit: true,
            deleteBranchOnMerge: true,

            isTemplate: actualArgs.repository.isTemplate,
            template: actualArgs.repository.basedOnTemplate ?? undefined,

            hasIssues: actualArgs.enabledFeatures.issues,
            hasWiki: actualArgs.enabledFeatures.wiki,
            hasDownloads: false,
            hasDiscussions: actualArgs.enabledFeatures.discussions,
            hasProjects: actualArgs.enabledFeatures.projects,

            allowMergeCommit: true,
            mergeCommitTitle: "MERGE_MESSAGE",
            mergeCommitMessage: "PR_TITLE",

            allowRebaseMerge: true,
            allowSquashMerge: false,
        }, {
            parent: this,
        });

        this.branches = [];
        for (const gitBranch of actualArgs.git.branches) {
            const branchName = `${name}-${gitBranch}-branch`;
            
            const branch = new Branch(branchName, {
                repository: this.repository.name,
                branch: gitBranch,
                sourceBranch: actualArgs.git.defaultBranch,
            }, {
                parent: this.repository,
                dependsOn: [this.repository],
            });

            this.branches.push(branch);
        }

        const branchDefaultName = `${name}-default-branch`;
        this.branchDefault = new BranchDefault(branchDefaultName, {
            repository: this.repository.name,
            branch: actualArgs.git.defaultBranch,
        }, {
            parent: this.repository,
            dependsOn: [this.repository],
        });

        this.environments = [];
        this.environmentPolicies = [];
        for (const branch of actualArgs.git.branches) {
            const environmentName = `${name}-${branch}-environment`;
            const environmentSlug = branch === "develop" ? "development" : branch === "main" || branch === "master" ? "production" : branch;
            const environment = new RepositoryEnvironment(environmentName, {
                repository: this.repository.name,
                environment: environmentSlug,
                deploymentBranchPolicy: {
                    customBranchPolicies: true,
                    protectedBranches: false,
                },
            }, {
                parent: this.repository,
                dependsOn: [this.repository, ...this.branches, this.branchDefault],
            });

            const environmentPolicyName = `${name}-${branch}-environment-policy`;
            const environmentPolicy = new RepositoryEnvironmentDeploymentPolicy(environmentPolicyName, {
                repository: this.repository.name,
                environment: branch === "develop" ? "development" : branch,
                branchPattern: branch,
            }, {
                parent: environment,
                dependsOn: [environment],
            });
            
            this.environments.push(environment);
            this.environmentPolicies.push(environmentPolicy);
        }

        this.organizationTeams = []; 
        if (actualArgs.organization) {
            for (const team of actualArgs.organization.teams ?? []) {
                const teamName = `${name}-${team}-team`;
                
                const teamRepository = new TeamRepository(teamName, {
                    repository: this.repository.name,
                    teamId: team,
                }, {
                    parent: this.repository,
                    dependsOn: [this.repository],
                });

                this.organizationTeams.push(teamRepository);
            }
        }
    }
}

export { GithubRepository, GithubRepositoryArgs };