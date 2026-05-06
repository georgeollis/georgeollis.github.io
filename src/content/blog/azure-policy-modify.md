---
title: "Testing out Azure Policies Modify Effect"
description: "This will be the first blog around Azure Policy. I'm hoping, but I don't promise to have a blog about all the policy effects Azure Policy can do and the best ways to run, deploy and configure the policies. In our first blog, we will examine the modify effect policy."
date: 2023-03-05
tags:
  - azure-governance
  - azure-policy
canonicalUrl: "https://www.georgeollis.com/azure-policy-modify/"
---

# Testing out Azure Policies Modify Effect

![Testing out Azure Policies Modify Effect](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/size/w960/2023/03/VWAN-Routing-1.png)

This will be the first blog around Azure Policy. I'm hoping, but I don't promise to have a blog about all the policy effects Azure Policy can do and the best ways to run, deploy and configure the policies. In our first blog, we will examine the modify effect policy.

### Modify v Append? What do I choose?

Firstly, the question that gets asked the most is the difference between the modify and append effects. They are pretty similar but do differ in a few ways.

### Modify v Append - Managed Identity.

Firstly append doesn't require a managed identity, but a modify policy effect does. With the addition of the managed identity for modify policies, It can also be used for remediation tasks. The append effect cannot remediate resources after the evaluation cycle and doesn't change existing resources; it simply marks them as non-compliant.

### Modify v Append - Changing resources.

The documentation recommends using append for non-tag properties over the modify effect. The modify effect should be used and is recommended for tagging purposes. While I agree with this, I would always try to use the modify effect instead of append because of the additional features.

It's important to note that we must ensure that the alias we are trying to change is supported and can be modified when using the modify effect. The following PowerShell command can be used to confirm if a property can be used in a modify effect.

```
Get-AzPolicyAlias | Select-Object -ExpandProperty 'Aliases' | Where-Object { $_.DefaultMetadata.Attributes -eq 'Modifiable' }
```

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/03/image.png)

Example of running the PowerShell command, looking specifically for modifiable attributes for Azure Storage Accounts.

If the alias cannot be used with a modify effect, it's recommended to use the append effect instead. If you don't have access to create managed identities within your organisation, you may also want to use the append effect, as this does not require a managed identity.

### Testing out Modify Policy

Let's explore our modify policy. We as an organisation want to ensure that our storage accounts are deployed with the property **supportsHttpsTrafficOnly** always set to true. We've created a custom Azure Policy for this. Let's have a look at it below.

```
{
    "mode": "Indexed",
    "parameters": {},
    "policyRule": {
        "if": {
            "allOf": [
                {
                    "field": "type",
                    "equals": "Microsoft.Storage/storageAccounts"
                },
                {
                    "field": "Microsoft.Storage/storageAccounts/supportsHttpsTrafficOnly",
                    "equals": false
                }
            ]
        },
        "then": {
            "effect": "modify",
            "details": {
                "roleDefinitionIds": [
                    "/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c"
                ],
                "operations": [
                    {
                        "operation": "addOrReplace",
                        "field": "Microsoft.Storage/storageAccounts/supportsHttpsTrafficOnly",
                        "value": true
                    }
                ]
            }
        }
    }
}
```

Let us dissect the policy to get a good understanding of what is happening here.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/03/image-1.png)

We have the policy rule. Underneath that sits the if and then statements. We have the operator **allOf** being used in our scenario, and for this policy to work, both conditions need to return true. When true has been returned, the policy rule has been met and will continue to the then statement. So in this example, the policy is looking for storage accounts, and the supportsHttpsTrafficOnly has been set to false.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/03/image-2.png)

We can view the effect and additional details by looking at the then statement. First, what does roleDefinitionId mean? Luckily we mentioned managed identities earlier. This roleDefinitionId is what the managed identity of the policy will get through RBAC (Role-based access control). The Id specified provides the policy assignment resource contributor access.

We then have the operations list block. In our scenario, we are using the addOrReplace operation on Microsoft.Storage/storageAccounts/supportsHttpsTrafficOnly field and the value to which it will be changed is true.  

The modify effect allows you to have several operations as part of the "operations" block, allowing you to modify multiple fields.

```
"details": {
    ...
    "operations": [
        {
            "operation": "addOrReplace",
            "field": "tags['environment']",
            "value": "Test"
        },
        {
            "operation": "Remove",
            "field": "tags['TempResource']",
        },
        {
            "operation": "addOrReplace",
            "field": "tags['Dept']",
            "value": "[parameters('DeptName')]"
        }
    ]
}
```

Modify effects also support different operations. In our example, we are using **addOrReplace.** However, we do have two others than can be utilised.

*   Remove - Removes the defined property or tag from the resource.
*   Adds - Adds the defined property or tag and value to the resource

Let's now test our policy and confirm it's working as intended. I've already assigned the policy in my environment, which can be seen below. I've currently got no storage accounts deployed in my environment.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/03/image-3.png)

We will use Bicep to deploy a brand-new storage account, allowing us to change the field **supportsHttpsTrafficOnly** to false and proceed with our deployment. We can then see the behaviour. The bicep code can be found below.

```
param storageAccountName string
param location string = 'uksouth'

resource str 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: false
  }
}
output httpStatus bool = str.properties.supportsHttpsTrafficOnly
```

The code will also output the httpStatus allowing us to view the property value when returned - this makes it easier to view the key property information we need to view. The httpStatus is getting its value from the storage account resource, specifically the property supportsHttpsTrafficOnly. In the code, we've set the supportsHttpsTrafficOnly field to false. Let's go ahead and deploy our storage account resource.

```
New-AzResourceGroupDeployment -ResourceGroupName "CRALB-Demo" -TemplateFile .\storageaccount.bicep -TemplateParameterObject @{ storageAccountName = "stmodifyeffect01" }
```

After the deployment, we are provided with an overview and values for the defined outputs. You can see that the httpStatus output has returned true - this means that the field supportsHttpsTrafficOnly must have been modified! Our code specifically asked for the field to be false, but Azure Policy ensured it wasn't.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/03/image-5.png)

### Getting confirmation

This is great, but how do we know the policy changed our field and ensured it was compliant? This is where we can view Azure Activity Logs. Going to our newly created storage account - we can start to investigate.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/03/image-6.png)

The storage account was stated as non-compliant. Hence the modify policy modified our request, ensuring that the field supportsHttpsTrafficOnly is always set to true.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/03/image-9.png)

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/03/image-7.png)

You can also view the policy again and see that our storage account is compliant.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/03/image-10.png)

What if we had existing resources? What would happen? I will unassign the policy, deploy ten storage accounts and reassign the policy. The below script will do this.

```
1..10 | foreach { New-AzResourceGroupDeployment -ResourceGroupName "CRALB-Demo" -TemplateFile .\storageaccount.bicep -TemplateParameterObject @{ storageAccountName = "stvollis$_" }}
```

Let's check the policy again and check our compliance scores.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/03/image-11.png)

As expected - the modify policy won't automatically remediate existing resources that have already been deployed (Remember, I had unassigned the policy); however, with a modify policy you can run something called a remediation task. Running a remediation task will bring the resources into compliance.

Click create remediation task on the existing policy assignment.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/03/image-12.png)

The remediation task will highlight all the resources that will be remediated in this task. You can change some configuration settings around the resource count and how many parallel deployments you want. However, we shall stick with the defaults. Once happy, select **remediate.**  

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/03/image-13.png)

Returning to Azure Policy, there is a dedicated section for remediation tasks, and we can see that our new task has started and been completed already. There were no additional issues or errors, which is excellent.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/03/image-14.png)

Running this PowerShell command can force Azure Policy to start a compliance scan.

```
Start-AzPolicyComplianceScan -AsJob
```

Our storage accounts are now reporting compliant!

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/03/image-15.png)

### Summary

Thanks for reading this blog. You can see from this short overview of Azure policies' modify effect it can be helpful when you want to enforce your organisation rules for Azure resources. If you have any questions, please feel free to reach out.

You can connect with me below.

[https://bio.link/georgeollis](https://bio.link/georgeollis?ref=georgeollis.com)

