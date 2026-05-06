---
title: "Looking at Azure Policy resource selectors"
description: "<p>So I recently did some work with Azure Policy, and we had a requirement to use the same policy but target different resources. I could have created a custom policy and used the field type (Example: field equals &quot;Microsoft.Storage/storageAccounts&quot;). However, I wanted to avoid the overhead</p>"
date: 2023-06-16
tags:
  - azure-governance
  - azure-policy
canonicalUrl: "https://www.georgeollis.com/azure-policy-resource-selectors/"
---

![Looking at Azure Policy resource selectors](/images/blog/azure-policy-resource-selectors/Presentation1.png)

So I recently did some work with Azure Policy, and we had a requirement to use the same policy but target different resources. I could have created a custom policy and used the field type (Example: field equals "Microsoft.Storage/storageAccounts"). However, I wanted to avoid the overhead of managing that custom policy in the future.

So why don't I use resource selectors instead? I could target different resource types but still use the same existing built-in policy.

In our example, we had a reasonably straightforward requirement; I needed to ensure that certain tags were mandatory on virtual machine resources but then needed another policy for all other resource types. As I mentioned, this is possible with custom policies, but resource selectors bring additional functionality and simplicity to the table.

```JSON
{
  "properties": {
    "displayName": "Require a tag on resources",
    "policyType": "BuiltIn",
    "mode": "Indexed",
    "description": "Enforces existence of a tag. Does not apply to resource groups.",
    "metadata": {
      "version": "1.0.1",
      "category": "Tags"
    },
    "parameters": {
      "tagName": {
        "type": "String",
        "metadata": {
          "displayName": "Tag Name",
          "description": "Name of the tag, such as 'environment'"
        }
      }
    },
    "policyRule": {
      "if": {
        "field": "[concat('tags[', parameters('tagName'), ']')]",
        "exists": "false"
      },
      "then": {
        "effect": "deny"
      }
    }
  },
  "id": "/providers/Microsoft.Authorization/policyDefinitions/871b6d14-10aa-478d-b590-94f262ecfa99",
  "type": "Microsoft.Authorization/policyDefinitions",
  "name": "871b6d14-10aa-478d-b590-94f262ecfa99"
}
```

The built-in policy is being used in our example.

In our scenario, we use the built-in policy that Requires a tag on resources. This policy targets all resources and looks for a tag on that resource. The policy is helpful if we expect the tag to be on all resources. An excellent example is a department or environment; I expect to be on all resources.

However, what if you need a tag on only one resource type? You only need to target virtual machines, and you want to enforce a patching tag. To provide users with information about the virtual machines patching cycle, you would only want to enforce that on resources with that requirement.

Let's see how this works. Let's deploy our policy that will target virtual machine resources. Head over to policy definitions and find the policy we will be using. It's called **require a tag on resources.**

![Looking at Azure Policy resource selectors](/images/blog/azure-policy-resource-selectors/image.png)

Once located, click assign and run through the GUI for setup. On the basics tab, select the scope you want this policy assigned. I've scoped this to the tenant root management group for this example.

![Looking at Azure Policy resource selectors](/images/blog/azure-policy-resource-selectors/image-1.png)

On the advanced tab, that's where things get interesting. We can see resource selectors. Click add resource selector.

![Looking at Azure Policy resource selectors](/images/blog/azure-policy-resource-selectors/image-2.png)

We can add three resource properties for resource selectors: resourceType, resourceLocation and resourceWithoutLocation. If our example, we will use **resourceType**. Since we are targeting virtual machines with this policy, we will select Microsoft.Compute/virtualMachines.

![Looking at Azure Policy resource selectors](/images/blog/azure-policy-resource-selectors/image-3.png)

Once complete. Go to the next tab, and let's add our PatchWindow tag. This should only target virtual machine resources.

![Looking at Azure Policy resource selectors](/images/blog/azure-policy-resource-selectors/image-4.png)

Click review and create. The policy will now be assigned to the tenant root management group. Once the policy has been applied, you can confirm this by going into assignments and seeing the policy.

![Looking at Azure Policy resource selectors](/images/blog/azure-policy-resource-selectors/image-5.png)

Hint: if you want to speed up the retrieval of the compliance state for Azure Policy, you can run a command to run an Azure Policy compliance scan for your contexts' subscription.

```PowerShell
Start-AzPolicyComplianceScan -AsJob
```

The -AsJob flag will run the command as a background job in the terminal. This allows you to reuse the terminal right away. After some time, we can see the policy now shows non-compliant resources, and would you look at that? It's only targeting virtual machines!

![Looking at Azure Policy resource selectors](/images/blog/azure-policy-resource-selectors/image-6.png)

Let's see what happens if I attempt to deploy another machine without the PatchWindow tag.

![Looking at Azure Policy resource selectors](/images/blog/azure-policy-resource-selectors/image-7.png)

As expected, the policy has denied the deployment because the policy targets virtual machines, and we didn't provide the mandatory tag. Now let's do the same but with an utterly different resource; for ease, let's attempt to deploy an application security group and review the outcome.

I've attempted to deploy an application security group with no tags, and the validation passed! The policy targets virtual machines using the resource selector and doesn't care about any other resource type.  

![Looking at Azure Policy resource selectors](/images/blog/azure-policy-resource-selectors/image-8.png)

What if I wanted to deploy this through an ARM template or Bicep? Well, I've provided an example of how to do this. Resource selectors are part of the policy assignment resource.  

```
targetScope = 'subscription'

resource policyAssignment 'Microsoft.Authorization/policyAssignments@2022-06-01' = {
  name: 'Deployment-1'
  properties:{
    displayName: 'Require a tag on resources'
    policyDefinitionId: '/providers/Microsoft.Authorization/policyDefinitions/871b6d14-10aa-478d-b590-94f262ecfa99'
    parameters:{
      tagName : {
        value: 'PatchWindow'
      }
    }
    resourceSelectors: [
      {
        name: 'virtualMachineType'
        selectors:[
          {
            kind: 'resourceType'
            in: [
              'Microsoft.Compute/virtualMachines'
            ]
          }
        ]
      }
    ]
  }
}
```

Azure Bicep Example

```
{
  "$schema": "https://schema.management.azure.com/schemas/2018-05-01/subscriptionDeploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "metadata": {
    "_generator": {
      "name": "bicep",
      "version": "0.18.4.5664",
      "templateHash": "4458355172096257956"
    }
  },
  "resources": [
    {
      "type": "Microsoft.Authorization/policyAssignments",
      "apiVersion": "2022-06-01",
      "name": "Deployment-1",
      "properties": {
        "displayName": "Require a tag on resources",
        "policyDefinitionId": "/providers/Microsoft.Authorization/policyDefinitions/871b6d14-10aa-478d-b590-94f262ecfa99",
        "parameters": {
          "tagName": {
            "value": "PatchWindow"
          }
        },
        "resourceSelectors": [
          {
            "name": "virtualMachineType",
            "selectors": [
              {
                "kind": "resourceType",
                "in": [
                  "Microsoft.Compute/virtualMachines"
                ]
              }
            ]
          }
        ]
      }
    }
  ]
}
```

Azure Resource Manager Example

### Summary

Thanks for reading this blog. Let me know if this content is valuable; I'm sure someone will find this helpful if they have a similar scenario.

[https://bio.link/georgeollis](https://bio.link/georgeollis?ref=georgeollis.com)

