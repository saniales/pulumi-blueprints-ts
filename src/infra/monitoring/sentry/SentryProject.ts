import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";
import * as Sentry from "@pulumiverse/sentry";

interface SentryProjectArgs {
    organization: string
    team: string
    platform?: string
    enableEmailNotification?: boolean
    slack?: {
        workspaceId: string
        channels: string[]
    } | null
}

/**
 * Creates and sets up a Sentry Project with default notifications.
 * 
 * Integrates automatically with Slack Integration.
 * 
 * @see https://www.pulumi.com/registry/packages/sentry
 * @see https://www.pulumi.com/registry/packages/sentry/SentryProject
 * @see https://www.pulumi.com/registry/packages/sentry/SentryRule
 */
class SentryProject extends ComponentResource {
    private static readonly defaultArgs: SentryProjectArgs = {
        organization: "",
        team: "",
        platform: "javascript",
        enableEmailNotification: false,
        slack: null
    };

    public readonly name: string;
    public readonly project: Sentry.SentryProject;
    public readonly notificationRule: Sentry.SentryRule;

    /**
     * Creates and sets up a Sentry Project with default notifications.
     * @param name The name of the resource
     * @param args The args used to initialize both the sentry project and the notification rules
     * @param opts The options for the Pulumi component resource
     */
    constructor(name: string, args: Partial<SentryProjectArgs>, opts: ComponentResourceOptions = {}) {
        super("monitoring:sentry:project", name, {}, opts);

        this.name = name;

        const actualArgs: SentryProjectArgs = {
            ...SentryProject.defaultArgs,
            ...args
        };

        this.project = new Sentry.SentryProject(this.name, {
            ...actualArgs,
        }, {
            parent: this,
        });

        const actions = [];
        if (actualArgs.enableEmailNotification) {
            actions.push({
                id: "sentry.mail.actions.NotifyEmailAction",
                name: "Send an email to IssueOwners",
                targetType: "IssueOwners",
                fallthroughType: "AllMembers",
            });
        }

        if (actualArgs.slack) {
            for (let channel of actualArgs.slack.channels) {
                channel = channel.trim();
                actions.push({
                    id: "sentry.integrations.slack.notify_action.SlackNotifyServiceAction",
                    workspace: actualArgs.slack.workspaceId,
                    channel: channel.startsWith("#") ? channel : `#${channel}`,
                    tags: "environment,level",
                });
            }
        }

        this.notificationRule = new Sentry.SentryRule(this.name, {
            actions: actions,
            actionMatch: "all",
            conditions: [{
                id: "sentry.rules.conditions.first_seen_event.FirstSeenEventCondition",
                name: "A new issue is created",
            }],
            name: "Notifications Default Rule",
            organization: actualArgs.organization,
            project: this.project.slug.apply(slug => slug),
        }, {
            parent: this,
            dependsOn: [this.project],
        });
    }
}

export { SentryProject };