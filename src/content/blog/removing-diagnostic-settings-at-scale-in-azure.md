---
title: "Removing diagnostic settings at scale in Azure for Log Analytics Workspaces."
description: "Sometimes you may need to view all the diagnostic settings for your resources and where they are sending them. You may also have a requirement to remove these at scale. This blog will go over exactly this.

Firstly you will need to open PowerShell; this can be done through the"
date: 2022-10-19
tags:
  - azure-monitor
  - azure-governance
canonicalUrl: "https://www.georgeollis.com/removing-diagnostic-settings-at-scale-in-azure/"
---

# Removing diagnostic settings at scale in Azure for Log Analytics Workspaces.

![Removing diagnostic settings at scale in Azure for Log Analytics Workspaces.](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/size/w960/2022/10/12.png)

Sometimes you may need to view all the diagnostic settings for your resources and where they are sending them. You may also have a requirement to remove these at scale. This blog will go over exactly this.

Firstly you will need to open PowerShell; this can be done through the Cloud Shell, which already has the required modules installed.

The first set of commands to run will create two variables called $list and $subscriptions.

*   $list will create an empty list we will use in the script.
*   $subscriptions will return all the subscriptions we will be looping over.

```PowerShell
$list = New-Object System.Collections.Generic.List[System.Object]
$subscriptions = Get-AzSubscription
```

Once complete, run the main script. The script will loop over all resources, and if they can find a diagnostic setting reporting to a workspace, it will create a hashtable and add that to the empty list.

Once complete, it will return all the resources that have diagnostic settings reporting to a workspace.

```PowerShell
Foreach ($sub in $subscriptions) {
    Write-Host "Searching $($sub.name)" -ForegroundColor Green
    Select-AzSubscription -Subscription $sub.Name | Out-Null
    $resources = Get-AzResource
    foreach ($res in $Resources) {

        $resId = $res.ResourceId
        $diagnosticSetting = Get-AzDiagnosticSetting -ResourceId $resId -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
        
        If ($diagnosticSetting.WorkspaceId -ne $null) {
            Write-Host "diagnostic settings found for $($res.name)"
            $resourceDiagnostic = [PSCustomObject]@{ 
                "workspaceId"      = $diagnosticSetting.WorkspaceId
                "workspaceName"    = ($diagnosticSetting.WorkspaceId).Split("/")[8]
                "diagnosticName"   = $diagnosticSetting.Name
                "resourceName"     = $res.Name
                "resourceType"     = $res.ResourceType
                "resourceId"       = $res.ResourceId
                "subscriptionName" = $sub.Name
            }
            
            $list.Add($resourceDiagnostic)
        }
    }
}
```

As the script can take a long time as you could have thousands of resources, the script will continue to update you by writing output to the screen.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/10/image.png)

Once complete, you will have a table that can be returned through the $list variable. The properties that are returned can be found below:

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/10/image-1.png)

You can now view all the diagnostic settings for resources reporting to a workspace; sometimes, you may need to delete diagnostic settings if they are reporting to an incorrect workspace, or you may want to view all the diagnostic settings.

We will continue removing these diagnostic settings in our example as they report to an incorrect workspace. I will use the $list variable and a where-object pipe to search for diagnostic settings reporting to the workspace "log-one". In this example, the "log-one" workspace is incorrect; I would like to remove these.

I will create a new variable called filter, which will store all the diagnostic settings I want to remove.

```PowerShell
$filter = $list | where { $_.workspaceName -eq "incorrect-workspace" }
```

Finally, we can remove the diagnostic settings for these resources by running the following command. This command will use the $filter variable and group all resources by the subscription; it will then loop over them and remove the diagnostic settings.

```PowerShell
$filter | Group-Object -p subscriptionName | 
foreach { 
    Select-AzSubscription $_.Name ; ForEach-Object { $azDiagNosticSetting = ($_.group) ; $azDiagNosticSetting | 
        foreach { Remove-AzDiagnosticSetting -ResourceId $_.resourceId -Name $_.diagnosticName ; 
            write-host "Removing diagnostic settings for $($_.resourceName) in $($_.subscriptionName), old workspace: $($_.workspaceName)" -f green } } }
```

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/10/image-5.png)

Thanks for reading! If this article is useful, please just let me know. :)

