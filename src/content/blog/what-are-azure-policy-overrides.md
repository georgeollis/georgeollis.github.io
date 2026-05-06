---
title: "What are Azure Policy Overrides?"
description: "<p>Before we start, I&apos;d like to say that this functionaility is currently in public preview but is so powerful and helpful, especially when enforcing new policies across an environment. Azure Policy Overrides is pretty simple.</p><p>For example, I have a policy definition with a policy effect of <em>deny.</em></p>"
date: 2023-06-29
tags:
  - azure-governance
  - azure-policy
canonicalUrl: "https://www.georgeollis.com/what-are-azure-policy-overrides/"
---

![What are Azure Policy Overrides?](/images/blog/what-are-azure-policy-overrides/Screenshot-2023-06-29-200543.png)

Before we start, I'd like to say that this functionaility is currently in public preview but is so powerful and helpful, especially when enforcing new policies across an environment. Azure Policy Overrides is pretty simple.

For example, I have a policy definition with a policy effect of _deny. I want_ to override that to another effect, such as audit; it provides the functionality of not creating a separate policy or adding a parameter into the policy definition to switch the effect. Awesome!  

Let's say we have a few policies related to cost management in an Azure initiative definition. Our initiative is called **_Azure Cost Management Policies_**, and because it is a grouping of policies related to Cost Management, most of the policies within the initiative will deny deploying resources that don't meet specific requirements, such as virtual machine and storage account SKUs.

The two policies within the initiative have a deny effect, but let's say we want to change the effect to **audit** before we deny resources that don't meet the requirements. Let's assign our initiative to the environment.

![What are Azure Policy Overrides?](/images/blog/what-are-azure-policy-overrides/image-23.png)

I'm applying the Azure Cost Management Policies initiative to my environment's tenant root management group. Clicking on the advanced tab shows us the override options.

Select **add override.** We can then start configuring our override.

![What are Azure Policy Overrides?](/images/blog/what-are-azure-policy-overrides/image-24.png)

In the override configuration, we can select the policyDefinitionId's to which the override should apply. In our example, I've selected the two policies we have in there. We also select the effect type when overriding the effect in the policy definition. I'm changing ours to audit. This ensures that users wouldn't be blocked from deployments of new resources or changes of existing resources but will still mark these resources as non-compliant with Azure Policy. Having them flagged as non-compliant is excellent to see the resources needed before changing the effect to deny access to an organisation.

![What are Azure Policy Overrides?](/images/blog/what-are-azure-policy-overrides/image-25.png)

Click Review + Create, assigning the policy to the tenant root group. We can see the policies in the initiative below.

![What are Azure Policy Overrides?](/images/blog/what-are-azure-policy-overrides/image-26.png)

The parameters passed into these policies were the following.

*   Storage accounts should be limited by allowed SKUs
*   Parameter name: Allowed SKUs: values \["**Standard\_LRS"\]**
*   Allowed virtual machine size SKU
*   Parameter name: Allowed Size SKUs values: \["**Standard\_DS3**", "**Standard\_DS3\_V2**"\]

I already have two virtual machines that have been deployed, which are not "Standard\_DS3" or "Standard\_DS3V3", so they've been marked as non-compliant. However, it's important to note that you can see the policy effect for that policy within the initiative, and would you look at that? It's been overwritten! Remember, the policy definition had the effect of deny.

![What are Azure Policy Overrides?](/images/blog/what-are-azure-policy-overrides/image-27.png)

Let's test this by deploying a new virtual machine with the size Standard\_B2Ms, which isn't on our approved list and should be able to successfully deploy this virtual machine without being denied. **Note:** I am showing the policy effect being overwritten and not caring that I have virtual machines that are non-compliant right now; using the overwrite functionality is excellent for applying policies in a brown-field environment or when you are doing lots of policies that could potentially impact existing infrastructure or perhaps you need to get confirmation before setting the policy effect to be more restrictive.

Deploying a virtual machine with Standard\_B2MS confirms the behaviour; we are not blocked from creating the virtual machine, and validation has passed.

![What are Azure Policy Overrides?](/images/blog/what-are-azure-policy-overrides/image-28.png)

Let's say; at this point, we've got approval to change the two virtual machines already deployed to an SKU in the approved list. I'll go ahead and change them now.

![What are Azure Policy Overrides?](/images/blog/what-are-azure-policy-overrides/image-29.png)

Let's force an Azure Policy compliance scan by running the following command. (You need to be connected to the correct subscription where your resources are running).

```PowerShell
Start-AzPolicyComplianceScan -AsJob
```

We are going back into the compliance dashboard in Azure Policy. We can now see that our virtual machines are compliant.

![What are Azure Policy Overrides?](/images/blog/what-are-azure-policy-overrides/image-30.png)

Now every resource is compliant. We now want to change the effect from the override to the default for the policy definition, which is deny. Go back to the Azure Cost Management policy assignment and go back to the advanced tab.

Once on the tab, select remove override. You can see the image below.

![What are Azure Policy Overrides?](/images/blog/what-are-azure-policy-overrides/image-31.png)

Click Review + Save and apply the changes. Now the override is no longer in place, and the default deny effect from the definition will start to work. The deny effect will now block new virtual machines from being deployed if it doesn't match the virtual machines in the approved SKU list.

Let's try again and create a virtual machine with the size Standard\_B2MS. You can see that we are now completely blocked from doing so. Even the portal doesn't allow you to select a size that would block the deployment.

![What are Azure Policy Overrides?](/images/blog/what-are-azure-policy-overrides/image-32.png)

Azure Policy Overrides are simple but very effective. Thanks for reading this short blog. If you have any questions about this post, please don't hesitate to ask. You can connect with me on social by clicking the link below.

[https://bio.link/georgeollis](https://bio.link/georgeollis?ref=georgeollis.com)

