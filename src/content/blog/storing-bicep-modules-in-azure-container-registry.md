---
title: "Storing Bicep Modules in Azure Container Registry"
description: "You can use Azure Container Registry (ACR) to create a private module repo to share modules within your organisation.

You publish modules to that registry and give read access to users who need to deploy the modules. After the modules are shared in the registry, you can reference them from"
date: 2022-11-10
tags:
  - bicep
  - devops
  - azure-container-registry
canonicalUrl: "https://www.georgeollis.com/storing-bicep-modules-in-azure-container-registry/"
---

10 Nov 2022 3 min read [Azure Bicep](/tag/azure-bicep/ "Azure Bicep")

# Storing Bicep Modules in Azure Container Registry

![Storing Bicep Modules in Azure Container Registry](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/size/w960/2022/11/Bicep_ACR.png)

You can use Azure Container Registry (ACR) to create a private module repo to share modules within your organisation.

You publish modules to that registry and give read access to users who need to deploy the modules. After the modules are shared in the registry, you can reference them from your Bicep files.

This is a great way to ensure that users use the correct Bicep files for deployments and helps to ensure resources are consistent when deployed within your organisation.  

In this blog post, we will create an Azure Container Registry, upload our Bicep files and then create resources based on those files.

Start by going into the Azure portal and creating an ACR resource. This needs to be globally unique. Below is my demo ACR resource.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-23.png)

For our example, we have a Bicep file that will deploy a storage account, but we want to upload this to the ACR resource so that other team members can utilise our Bicep file; this reduces duplication and allows us to work as a team.

This is also helpful from a security perspective. Having a central Bicep module repository stored in ACR reduces inconsistencies in deployments where parameters and configuration settings may expose security issues.

Let's say we have a module dedicated to deploying virtual machines; this module doesn't allow the creation of a public IP address for that virtual machine but another Bicep file that isn't part of the central ACR resource does.

This can cause headaches for all members of the team. (Although additional governance around the environment should be configured using Azure Policy, etc.)

Below is our Bicep file for deploying a Storage Account within Azure.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-24.png)

This file is currently stored locally, but we want to share it with the team so they can use this Bicep file within their deployments. To upload this to our ACR resource, run the following command in the Azure CLI.

```Azure
az bicep publish --file storage.bicep --target br:lmbdgllisacr.azurecr.io/bicep/modules/storage:v1
```

**Note: You will need to replace the "lmbdgllisacr.azurecr.io" with the name of your ACR resource.**

Once uploaded, you can go back to the ACR resource and confirm it was uploaded successfully.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-25.png)

But how do we use this within our Bicep files? You can see that below:

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-26.png)

Let's break down exactly what this means.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/Bicep.png)

Completing a what-if through the Azure CLI shows us what would be deployed.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-28.png)

Once we are happy, this will deploy our workload. We can replace the what-if subcommand with the create command.

```Azure
az deployment group create --resource-group lambda-dev --template-file .\example.bicep
```

We can confirm our resource is now also appearing in the Azure portal.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-29.png)

If this content was helpful, please feel free to connect with me on social media at

*   [George Ollis (@georgeollis\_) / Twitter](https://twitter.com/georgeollis_?ref=georgeollis.com)
*   [George Ollis ☁️ | LinkedIn](https://www.linkedin.com/in/georgeollis/?ref=georgeollis.com)

