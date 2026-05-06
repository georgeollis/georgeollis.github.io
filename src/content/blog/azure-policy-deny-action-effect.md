---
title: "Azure Policy - Looking at the DenyAction Effect"
description: "This blog will discuss the new Azure Policy effect currently in public preview called denyAction. I've only found out about this new effect from this YouTube video here that Microsoft posted.

We don't have much information, and I can't find anything on Microsoft's official documents yet. Update: Microsoft has now"
date: 2022-12-04
tags:
  - azure-governance
  - azure-policy
canonicalUrl: "https://www.georgeollis.com/azure-policy-deny-action-effect/"
---

# Azure Policy - Looking at the DenyAction Effect

![Azure Policy - Looking at the DenyAction Effect](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/size/w960/2022/12/Screenshot-2022-12-04-190009-1.png)

This blog will discuss the new Azure Policy effect currently in **public preview** called denyAction. I've only found out about this new effect from this YouTube video here that Microsoft posted.

We don't have much information, and I can't find anything on Microsoft's official documents yet. **Update:** Microsoft has now provided documentation for this policy effect: [](https://learn.microsoft.com/en-us/azure/governance/policy/concepts/effects?ref=georgeollis.com#denyaction-preview)[Understand how effects work - Azure Policy | Microsoft Learn](https://learn.microsoft.com/en-us/azure/governance/policy/concepts/effects?ref=georgeollis.com)

We can still explore the policy effect and see how it works! Here's an example below.

```Azure
"policyRule": {
          "if": {
            "allOf": [
              {
                "field": "type",
                "equals": "Microsoft.Storage/storageAccounts"
              }
            ]
          },
          "then": {
            "effect": "denyAction",
            "details": {
              "actionNames": [
                "delete"
              ],
              "cascadeBehaviors": {
                "resourceGroup": "deny"
              }
            }
          }
        }
```

We have an **if** block which determines what resources are in scope to be evaluated and be part of this policy. In our example, we are looking for Microsoft.Storage/storageAccounts resources.

We then have our **then** block, which in this case, shows us that our effect for this policy is the new denyAction effect and that we determine how this policy will work with the details object and caseBehaviors object.

### Details

```
"details": {
              "actionNames": [
                "delete"
              ]
```

The details object has an actionNames property that expects a list of strings. From the example in the video above, we can use the **delete** word to prevent users from deleting storage accounts.  

### cascadeBehaviors

```
"cascadeBehaviors": {
                "resourceGroup": "deny"
              }
```

We also have the cascadeBehaviors object, which in our example, ensures that if someone tried deleting the resource group instead of the storage account resource, they would still be blocked from doing so.

Let's go ahead and try this out. You'll need to deploy a policy to test this; luckily, you can find one below.

```
{
  "$schema": "https://schema.management.azure.com/schemas/2018-05-01/subscriptionDeploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "metadata": {
    "_generator": {
      "name": "bicep",
      "version": "0.12.40.16777",
      "templateHash": "17727284302921911509"
    }
  },
  "resources": [
    {
      "type": "Microsoft.Authorization/policyDefinitions",
      "apiVersion": "2020-09-01",
      "name": "Storage Accounts - Automatic Protection",
      "properties": {
        "displayName": "Protect all Storage Accounts",
        "policyType": "Custom",
        "mode": "Indexed",
        "description": "This policy will block deletion of Storage Accounts.",
        "metadata": {
          "version": "0.1.0",
          "category": "category",
          "source": "source"
        },
        "policyRule": {
          "if": {
            "allOf": [
              {
                "field": "type",
                "equals": "Microsoft.Storage/storageAccounts"
              }
            ]
          },
          "then": {
            "effect": "denyAction",
            "details": {
              "actionNames": [
                "delete"
              ],
              "cascadeBehaviors": {
                "resourceGroup": "deny"
              }
            }
          }
        }
      }
    }
  ]
}
```

Once deployed, we should see the policy available to us.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-5.png)

Click assign and go through the wizard; we will assign this policy to our subscription, which could also be assigned to a resource group, management group, etc.    

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-6.png)

When reviewing the policy compliance status, the policy will be marked as compliant when the policy has been assigned. Still, eventually, it will show the status **protected** once the policy effect is generally available.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-7.png)

Now let's go ahead and delete a storage account within this subscription.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-8.png)

We can see that the storage account can't be deleted! This was attempted at the storage account resource; however, if we tried deleting the resource group instead, the behaviour would be the same.

You might be asking, why would we do this if we have locks instead? There are probably a few reasons, but Azure Policy would allow you to do this at scale instead of applying locks to each resource, resource group, etc.

I'm hoping we get more information on this policy effect shortly to see what else is possible; I'm excited to see how we can use this in the future for other scenarios.

