---
title: "Creating a user licensing Azure Workbook using Azure Logic Apps and Log Analytics."
description: "Have you ever had a requirement to find out who has a particular license across an organisation? What about a quick view of user accounts that have been assigned licenses but are disabled?

I've always found the built-in experience in the portal or running PowerShell scripts to extract licensing information"
date: 2023-04-12
tags:
  - azure-monitor
  - azure-apps
canonicalUrl: "https://www.georgeollis.com/license-insights-workbook/"
---

# Creating a user licensing Azure Workbook using Azure Logic Apps and Log Analytics.

![Creating a user licensing Azure Workbook using Azure Logic Apps and Log Analytics.](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/size/w960/2023/04/Screenshot-2023-04-12-084358-1.png)

Have you ever had a requirement to find out who has a particular license across an organisation? What about a quick view of user accounts that have been assigned licenses but are disabled?

I've always found the built-in experience in the portal or running PowerShell scripts to extract licensing information tedious. What if we could use something else and get the same information?

That's when I thought we could query Microsoft Graph using a Logic App to ingest licensing information into a Log Analytics Workspace using custom tables and present that data visually using Azure Workbooks!

The workbook is called License Insights and uses several custom tables in log analytics. These are the following:

*   **UserLicenseInsights** \- Stores license information for users.
*   **UserGroupLicenseInsights** \- Stores license information for groups.
*   **UserLicenseTenantInsights** \- Stores license information at the tenant level.
*   **UserLicenseSkuInsights** \- Stores product names and SKUs.

The solution composes of a standard Logic App with four workflows. Each workflow reflects the different custom tables being used for Log Analytics Workspaces.

### Managed Identity

The logic app is assigned a system-assigned managed identity, which requires access to read user and group information in Azure Active Directory.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/04/image.png)

Providing access can be completed by running this script in PowerShell.

```
function Add-GraphApiRoleToMSI {
    [cmdletbinding()]
    param (
        [parameter(Mandatory = $true)]
        [string]$ApplicationName,

        [parameter(Mandatory = $true)]
        [string[]]$GraphApiRole,

        [parameter(mandatory = $true)]
        [string]$Token
    )

    $baseUri = 'https://graph.microsoft.com/v1.0/servicePrincipals'
    $graphAppId = '00000003-0000-0000-c000-000000000000'
    $spSearchFiler = '"displayName:{0}" OR "appId:{1}"' -f $ApplicationName, $graphAppId

    try {
        $msiParams = @{
            Method  = 'Get'
            Uri     = '{0}?$search={1}' -f $baseUri, $spSearchFiler
            Headers = @{Authorization = "Bearer $Token"; ConsistencyLevel = "eventual" }
        }
        $spList = (Invoke-RestMethod @msiParams).Value
        $msiId = ($spList | Where-Object { $_.displayName -eq $applicationName }).Id
        $graphId = ($spList | Where-Object { $_.appId -eq $graphAppId }).Id
        $msiItem = Invoke-RestMethod @msiParams -Uri "$($baseUri)/$($msiId)?`$expand=appRoleAssignments"

        $graphRoles = (Invoke-RestMethod @msiParams -Uri "$baseUri/$($graphId)/appRoles").Value | 
        Where-Object {$_.value -in $GraphApiRole -and $_.allowedMemberTypes -Contains "Application"} |
        Select-Object allowedMemberTypes, id, value
        foreach ($roleItem in $graphRoles) {
            if ($roleItem.id -notIn $msiItem.appRoleAssignments.appRoleId) {
                Write-Host "Adding role ($($roleItem.value)) to identity: $($applicationName).." -ForegroundColor Green
                $postBody = @{
                    "principalId" = $msiId
                    "resourceId"  = $graphId
                    "appRoleId"   = $roleItem.id
                }
                $postParams = @{
                    Method      = 'Post'
                    Uri         = "$baseUri/$graphId/appRoleAssignedTo"
                    Body        = $postBody | ConvertTo-Json
                    Headers     = $msiParams.Headers
                    ContentType = 'Application/Json'
                }
                $result = Invoke-RestMethod @postParams
                if ( $PSBoundParameters['Verbose'] -or $VerbosePreference -eq 'Continue' ) {
                    $result
                 }
            }
            else {
                Write-Host "role ($($roleItem.value)) already found in $($applicationName).." -ForegroundColor Yellow
            }
        }
        
    }
    catch {
        Write-Warning $_.Exception.Message
    }
}


$token = Get-AzAccessToken -ResourceUrl "https://graph.microsoft.com/"

Add-GraphApiRoleToMSI -ApplicationName "logic-license-insights" -GraphApiRole "Directory.Read.All" -Token $token.token 
```

You can view the managed identity's permissions in Azure Active Directory by going to the enterprise application, which represents your managed identity.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/04/image-1.png)

### Ingest-User-License-Insights Workflow

The first workflow will run every 30 minutes and does a direct HTTP GET call to the endpoint [https://graph.microsoft.com/v1.0/users](https://graph.microsoft.com/v1.0/users?ref=georgeollis.com). Authentication is done through the system-assigned managed identity.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/04/image-2.png)

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/04/image-3.png)

Once the call to retrieve all users is completed, we parse the HTTP output using the parse JSON action. This allows us to use the properties in additional steps. In our case, we perform a filter on the returned array and filter for assigned licenses greater than 0. This means we are only returned users with licenses.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/04/image-4.png)

The final step takes the body and content from the filter array action and sends that to the Log Analytics Workspace.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/04/image-5.png)

Running KQL on the UserLicenseInsights table provides valuable information about users' licenses. An example query can be found below. (We will make this data more user-friendly with workbooks later!)

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/04/image-6.png)

What about users assigned licenses but have been disabled? We have that as well.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/04/image-7.png)

That's our first workflow. Let's explore another.

### Ingest-Group-License-Insights Workflow

This workflow is similar to the user one but looks at licenses assigned to groups. Many organisations will prefer to give licenses to groups instead of users directly, so it makes sense to have those groups ingested into the workspace.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/04/image-8.png)

This time we are using Microsoft Graph HTTP GET request is going to the endpoint: **https://graph.microsoft.com/v1.0/groups**

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/04/image-9.png)

This data is being sent again to the same Log Analytics Workspace but to a separate table. The table is called UserGroupLicenseInsights. We can run another KQL query to view the same helpful information about groups that have licenses assigned.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/04/image-10.png)

## Ingest-User-Tenant-Insights Workflow

A similar flow to the other two; however, this time, we are retrieving data from [https://graph.microsoft.com/v1.0/subscribedSkus](https://graph.microsoft.com/v1.0/subscribedSkus?ref=georgeollis.com). This endpoint allows us to get the list of commercial subscriptions that an organisation has acquired.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/04/image-11.png)

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/04/image-12.png)

This data is then sent to the UserLicenseTenantInsights table.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/04/image-13.png)

As you can see, this provides valuable information about allocated and consumed licenses and the specific SKU Id and SkuPartNumber. This data is beneficial if you are worried about running out of licenses.

One property that neither the subscribedSku's, Users and Groups API calls provide is a friendly way of understanding what the SkuId is. This is probably one of the more valuable properties, and it's not here. How do we get this, then?

## Ingest-License-Skus Workflow

The last workflow links Sku IDs provided by Microsoft to their friendly names. Microsoft provides a helpful document which provides this information: [Product names and service plan identifiers for licensing - Microsoft Entra | Microsoft Learn](https://learn.microsoft.com/en-us/azure/active-directory/enterprise-users/licensing-service-plan-reference?ref=georgeollis.com)

How do we query this, though? I've created a public storage account with this information in JSON format. This can be called from the Logic App or any other HTTP client. The URL is: [https://msproductlicense.blob.core.windows.net/public/licenses.json](https://msproductlicense.blob.core.windows.net/public/licenses.json?ref=georgeollis.com)

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/04/image-14.png)

This workflow is set on a schedule that runs every 24 hours and will ingest the same data. The workflow is below.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/04/image-15.png)

Querying this data in KQL can be done through the UserLicenseSkuInsights table.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/04/image-16.png)

You might be asking why we need this information. When we join the data with the other tables, we can use familiar names (Such as Azure AD P2) as part of the query to provide more helpful information to the end user. This is heavily used in the supporting Azure Workbook that is part of this solution.

## User License Insights Workbook

Now getting to the workbook - the workbook has four tabs. The first tab is for User Insights and provides a way to view who has what license assigned. The filters provided allow you to filter what licenses you have available in the tenant.

### User Insights Tab

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/04/image-17.png)

From the example below, I only have two licenses to filter on. This is automatically generated based on the available licenses from the UserLicenseTenantInsights table.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/04/image-18.png)

### Group Insights Tab

The next tab briefly overviews what groups are assigning licenses and the number of licenses being allocated. This is especially useful when you have many groups assigning licenses and want to see them all.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/04/image-19.png)

### Company Insights Tab

This provides an overview of licenses company-wide. You can see licenses by department, usage location and country, but also a section specifically for monitoring license allocation and ensuring you have sufficient licenses across the company.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/04/Picture1.png)

### Cost saving insights

The last tab is dedicated to cost management; you'll be able to see user accounts marked as disabled with licenses still assigned.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/04/image-22.png)

### Summary

Thanks for reading this blog. Please let me know if this workbook is useful and the solution for seeing an overview of licenses. I will provide an ARM\\Bicep\\Terraform solution to automatically deploy this solution in your environments.

You can connect with me below.

[https://bio.link/georgeollis](https://bio.link/georgeollis?ref=georgeollis.com)

