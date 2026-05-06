---
title: "Deploying applications on  Azure Functions using Flex Consumption Plans"
description: "<p>In this blog, I will walk you through deploying code to Azure Functions using the Azure CLI and the Flex Consumption plan. Previous plans for Azure Functions offered several different deployment options. However, deployments in the Flex Consumption plan follow a single path. After your project code is built and</p>"
date: 2024-12-20
tags:
  - azure-apps
  - azure-functions
canonicalUrl: "https://www.georgeollis.com/deploying-code-to-azure-functions-flex-consumption/"
---

![Deploying applications on  Azure Functions using Flex Consumption Plans](/images/blog/deploying-code-to-azure-functions-flex-consumption/Presentation1-1.png)

In this blog, I will walk you through deploying code to Azure Functions using the Azure CLI and the Flex Consumption plan. Previous plans for Azure Functions offered several different deployment options. However, deployments in the Flex Consumption plan follow a single path. After your project code is built and zipped into an application package, it is deployed to a blob storage container.

I will use an HTTP function in our example, but the principles are the same for any application. The code can be generated using the Azure Function CLI (Core tools).

![Deploying applications on  Azure Functions using Flex Consumption Plans](/images/blog/deploying-code-to-azure-functions-flex-consumption/image-4.png)

The contents of the "my-azure-function" folder contains the code.

Once you are happy with your code. Just ZIP the contents of the directory. You can use PowerShell to do this:

```PowerShell
Compress-Archive -Path * -DestinationPath .\my-azure-function.zip
```

What is in the ZIP folder? You can find that below.

![Deploying applications on  Azure Functions using Flex Consumption Plans](/images/blog/deploying-code-to-azure-functions-flex-consumption/image-6.png)

![Deploying applications on  Azure Functions using Flex Consumption Plans](/images/blog/deploying-code-to-azure-functions-flex-consumption/image-5.png)

Once we've got the application code for a ZIP deployment, We can deploy to an Azure Function by using the following command:

```
az functionapp deployment source config-zip -g "RESOURCE_GROUP
_NAME" -n "FUNCTION_APP_NAME" --src my-azure-function.zip
```

![Deploying applications on  Azure Functions using Flex Consumption Plans](/images/blog/deploying-code-to-azure-functions-flex-consumption/image-7.png)

Once the deployment is successful, you can see the functions app deployed onto the Azure Function.

![Deploying applications on  Azure Functions using Flex Consumption Plans](/images/blog/deploying-code-to-azure-functions-flex-consumption/image-8.png)

When you go into the deployment centre, you'll see deployment logs. This is interesting because you'll notice that we didn't include the Python packages that made up our application in our original ZIP deployment. We had the requirements.txt file, but the deployment installed our dependencies. This differs from using other plans and the WEBSITE\_RUN\_FROM\_PACKAGE environment variable, as you had to ensure the dependencies were added in the ZIP deployment.

![Deploying applications on  Azure Functions using Flex Consumption Plans](/images/blog/deploying-code-to-azure-functions-flex-consumption/image-9.png)

This deployment is similar to using the SCM\_DO\_BUILD\_DURING\_DEPLOYMENT on other plans but provides the benefits of using a packaged deployment. However, with flex consumption, app settings no longer need to influence deployment behaviour.

### Blob Storage

The deployment package containing your app's code is maintained in an Azure Blob Storage container. When you go to deployment settings, you'll see the configuration of this deployment package in Azure Storage.

![Deploying applications on  Azure Functions using Flex Consumption Plans](/images/blog/deploying-code-to-azure-functions-flex-consumption/image-10.png)

Going to the storage account, you'll see the container and the content within:

![Deploying applications on  Azure Functions using Flex Consumption Plans](/images/blog/deploying-code-to-azure-functions-flex-consumption/image-11.png)

Downloading this ZIP file and opening it will show you the code that was deployed and also contains all the dependencies for your code, which in our example is Python packages:

![Deploying applications on  Azure Functions using Flex Consumption Plans](/images/blog/deploying-code-to-azure-functions-flex-consumption/image-12.png)

### Testing the Function App

Now, to test the function app code worked, I can send a simple HTTP request to the endpoint:

![Deploying applications on  Azure Functions using Flex Consumption Plans](/images/blog/deploying-code-to-azure-functions-flex-consumption/image-13.png)

### Conclusion

Azure Functions Flex Consumption makes deployment of Azure Functions even more straightforward. The previous SKU offerings felt cumbersome, complex, and sometimes confusing, with different application settings that could change deployment characteristics.

