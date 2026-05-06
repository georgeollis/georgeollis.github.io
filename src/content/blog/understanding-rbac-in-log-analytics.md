---
title: "Understanding access in Log Analytics Workspaces"
description: "Sometimes customers will ask how we control log access in their Log Analytics Workspaces and ensure that only the correct users can access the logs for their resources.

This is especially important when considering having a shared workspace, where lots of logs are being ingested from many different departments and application teams."
date: 2023-02-27
tags:
  - azure-monitor
  - azure-identity
canonicalUrl: "https://www.georgeollis.com/understanding-rbac-in-log-analytics/"
---

27 Feb 2023 6 min read

# Understanding access in Log Analytics Workspaces

![Understanding access in Log Analytics Workspaces](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/size/w960/2023/02/VWAN-Routing-12.png)

Sometimes customers will ask how we control log access in their Log Analytics Workspaces and ensure that only the correct users can access the logs for their resources.

This is especially important when considering having a shared workspace, where lots of logs are being ingested from many different departments\\application teams in the organization; you may need to control what users can see.

You could have a workspace for each application, and whilst sometimes this may benefit you, you also may lose additional benefits around simplicity, commitment tiers, etc.

Firstly, there are two access modes when accessing logs in a workspace.

*   **Workspace-context**: You can view all logs in the workspace for which you **have** permission. Queries in this mode are scoped to all data in all tables in the workspace. This access mode is used when logs are accessed with the workspace as the scope. An example can be seen below.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-48.png)

An example of a workspace being used as the scope.

*   **Resource-context**: When you access the workspace for a particular resource, resource group, or subscription, such as when you select logs from a resource menu in the Azure portal, you can view logs for only resources in all tables you have access to. Queries in this mode are scoped to only data associated with that resource. This mode also enables granular Azure RBAC. Workspaces use a resource-context log model where every log record emitted by an Azure resource is automatically associated with this resource.

It's important to understand that logs are only available in resource-context queries if they're associated with the relevant resource. To check this association, run a query and verify that the [\_ResourceId](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/log-standard-columns?ref=georgeollis.com#_resourceid) column is populated.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-49.png)

An example of a resource being used as the scope.

Our first demo in this blog will show this in place. We've got two administrators. One of our administrators should have full access to our workspace and see all the logs, whereas our other administrator only looks after a specific workload. A few diagrams can be seen below.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/WorkspaceExample.png)

An example diagram of workspace-context. Our CompanyAdmin account will be able to scope the context to the workspace and see all the results for all resources.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/ResourceContentExample.png)

An example diagram of resource context. Our WorkloadAdmin account has read access to a single Azure SQL database. They won't be able to access the log analytics workspace and will be using resource context when viewing logs in the workspace. They will only see logs for the resources they have access.

Let's go through each scenario. The user CompanyAdmin has reader permissions assigned to the log analytics workspace. We can view all the logs for all SQL servers\\databases reporting into this workspace. A basic query that demonstrates this is below. In this example, the scope is the workspace and workspace permissions are being used.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-50.png)

```
AzureDiagnostics
| where TimeGenerated > ago(5d)
| distinct ResourceId, LogicalServerName_s
| project LogicalServerName_s, ResourceId
```

The following scenario is from the WorkloadAdmin perspective. This user only has read access on sqlserverworkload1, and although its logs are reporting to the same workspace, this user doesn't have RBAC permission on the workspace. This user has been assigned read access on the Azure SQL resource only. This is an example of resource context and resource permissions.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-51.png)

### Understanding access control modes

Log Analytics Workspaces comes with two different access control modes. This setting determines how permissions are configured. Log Analytics Workspaces created before March 2019 would have been configured with **Require workspace permissions** as the default access mode. This access mode doesn't provide the granularity that many customers want. The user must be granted permission to access the workspace or specific tables to access the workspace.

The new default access mode is called **Use resource or workspace permissions.** This access provides the granularity many customers want and supports RBAC on resources. Users can be granted access to only data associated with resources they can view by assigning Azure read permission.

When a user accesses the workspace in workspace-context mode, workspace permissions apply. When a user accesses the workspace in resource-context mode, only resource permissions are verified, and workspace permissions are ignored.

It's recommended to enable Azure RBAC for a user by removing them from workspace permissions and allowing their resource permissions to be recognized fully. Additional information can be found here: [Manage access to Log Analytics workspaces - Azure Monitor | Microsoft Learn](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/manage-access?tabs=portal&ref=georgeollis.com#access-control-mode)

You can confirm which access control mode is used by going to the Log Analytics Workspace. On the overview page, you will see the access control mode configuration.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-52.png)

If you want to change the access control mode, click on the properties tab, and you'll be able to change the configuration, as highlighted below.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-53.png)

Perhaps you want further granularity with RBAC, especially for tables that don't support resource-context mode, which is only for logs generated by resources and that send the \_ResourceId column to the workspace. We can create custom RBAC roles precisely for this.

In our example, we want to ensure that only our SecurityAdmin user can access Azure Activity logs, but we want to ensure they cannot access resource logs. Let's see how we can do this. You can see the image below.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-54.png)

Firstly, go to your subscription, select access controls, and create a new custom role. Our custom role will be called **Azure Activity Reader**.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-55.png)

Go to the JSON tab, select edit and paste in the following content. **Note**: ensure you replace the subscription id with yours, and that the assignableScope includes the location of your workspaces.

```
{
    "id": "/subscriptions/baba41cf-c01d-4a55-b6c5-ca494b802be5/providers/Microsoft.Authorization/roleDefinitions/dc4adb26-de00-417e-a53f-2ffc319c37a6",
    "properties": {
        "roleName": "Azure Activity Reader",
        "description": "",
        "assignableScopes": [
            "/subscriptions/baba41cf-c01d-4a55-b6c5-ca494b802be5/resourceGroups/LA-DEMO/providers/Microsoft.OperationalInsights/workspaces/la-workspace-demo",
            "/subscriptions/baba41cf-c01d-4a55-b6c5-ca494b802be5"
        ],
        "permissions": [
            {
                "actions": [
                    "Microsoft.OperationalInsights/workspaces/read",
                    "Microsoft.OperationalInsights/workspaces/query/read",
                    "Microsoft.OperationalInsights/workspaces/query/AzureActivity/read"
                ],
                "notActions": [],
                "dataActions": [],
                "notDataActions": []
            }
        ]
    }
}
```

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-63.png)

What do the actions actually do? Let's have a look.

*   **Microsoft.OperationalInsights/workspaces/read** - View workspace basic properties and enter the workspace pane in the portal.
*   **Microsoft.OperationalInsights/workspaces/query/read** - Query logs by using any interface.
*   **Microsoft.OperationalInsights/workspaces/query/AzureActivity/read** - Allows you to query data in the AzureActivity Table

This role will only limit what the user can query. If you wanted to provide full access to query all tables, the action would be this.

*   **Microsoft.OperationalInsights/workspaces/query/\*/read** - Access all log types by using queries.

Click review and create. This custom role will now be created. Now go to the Log Analytics Workspace and click on access control, and select add a role.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-57.png)

Find the role we created called Azure Activity Reader and select it, click next.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-58.png)

Find our SecurityAdmin user and assign the role to the user. Click next and deploy the role.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-59.png)

Log into the Azure Portal with the SecurtyAdmin user and select the Log Analytics Workspace. Let's see if we can view the data in the AzureActivity table.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-61.png)

This appears to be working. We also know that data is being ingested in the AzureDiagnostics table - can we view it?

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-62.png)

Looks like we can't view it! Exactly what we wanted.

### Summary

Thanks for reading this blog. Log Analytics Workspace permissions often get's confusing. Hopefully this blog explained it! Remember if you need additional help - please just let me know. :)

You can connect with me below.

[https://bio.link/georgeollis](https://bio.link/georgeollis?ref=georgeollis.com)

