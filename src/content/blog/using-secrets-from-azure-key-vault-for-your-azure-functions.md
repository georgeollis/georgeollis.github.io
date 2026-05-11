---
title: "Storing secrets for Azure Functions"
description: "Do you want to store connection strings, secrets or sensitive information in a Function App and ensure it's only accessible to the application?

This is where we can use Azure Key Vault and Key Vault references within the Functions Apps application settings.

We see many customers who don't set this"
date: 2022-11-01
tags:
  - azure-apps
  - azure-functions
  - azure-security
  - azure-key-vault
canonicalUrl: "https://www.georgeollis.com/using-secrets-from-azure-key-vault-for-your-azure-functions/"
---

# Storing secrets for Azure Functions

![Storing secrets for Azure Functions](/images/blog/using-secrets-from-azure-key-vault-for-your-azure-functions/VWAN-Routing-6.png)

Do you want to store connection strings, secrets or sensitive information in a Function App and ensure it's only accessible to the application?

This is where we can use Azure Key Vault and Key Vault references within the Functions Apps application settings.

We see many customers who don't set this up correctly or struggle to set this, especially new customers coming onto Azure. This blog post will cover everything you need to do to set this up and sleep easy at night, knowing that your secrets are safe.

To set the stage, we have developed a basic HTTP function in C# that will look for a particular environment variable and return it to the user when called from an HTTP client (Postman, Browser, etc.). The code can be found below but will also be available on GitHub.

```
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Test.Values
{
    public static class TestSecretValue
    {

        private static string superSecret = System.Environment.GetEnvironmentVariable("SuperSecret");
        
        [FunctionName("TestSecretValue")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = null)]
            HttpRequest req, ILogger log)
        {
            log.LogInformation("C# HTTP trigger function processed a request.");

            return new OkObjectResult(superSecret);
        }
    }
}
```

As you can see from the code, it is a simple Function App that is triggered on an HTTP GET request. The code will look for an environment variable called "superSecret" and return the response to the user.

To confirm this works in our development environment, we can store the environment variable within our **local.settings.json** file, which has the environment variable key and value.

![](/images/blog/using-secrets-from-azure-key-vault-for-your-azure-functions/image.png)

If we start the Function App from our development environment using the Azure Functions Core Tool - this can be downloaded here: [https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local?ref=georgeollis.com).    

We can confirm our Function App is working on our local environment once the following is displayed:

![](/images/blog/using-secrets-from-azure-key-vault-for-your-azure-functions/image-1.png)

We should now be able to confirm this works by sending a GET request to http://localhost:7071/api/TestSecretValue.

For my example, we will use the ThunderClient extension in VSCode, a built-in HTTP client. from the below screenshot; we can confirm we are seeing the secret **Hello World** from our environment variable.

![](/images/blog/using-secrets-from-azure-key-vault-for-your-azure-functions/image-2.png)

This works fine for our development environment, but when we run this in production, should we store this secret in something such as Azure Key Vault?

This is best practice and ensures that the secret is stored away from the application, and only the application can access it.

To set this up, we first need to look at deploying our Azure Function into Azure instead of running locally; I will do this through VSCode.

![](/images/blog/using-secrets-from-azure-key-vault-for-your-azure-functions/image-3.png)

Now we have our Function App deployed, we need to confirm and set up the Function App to have a managed identity and provide the identity access to read secrets from a key vault.

To learn more about managed identities, look at the following link: [Managed identities for Azure resources - Microsoft Entra | Microsoft Learn](https://learn.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview?ref=georgeollis.com).

To set up a managed identity for our Function, go to the Identity tab on the Function App, select **Yes**, and save.

![](/images/blog/using-secrets-from-azure-key-vault-for-your-azure-functions/image-4.png)

Now we will look to set up an Azure Key Vault to store our sensitive secrets. But first, what is Azure Key Vault?

_Azure Key Vault is a cloud service for securely storing and accessing secrets. A secret is anything that you want to tightly control access to, such as API keys, passwords, certificates, or cryptographic keys._

*   More information can be found here: [What is Azure Key Vault? | Microsoft Learn](https://learn.microsoft.com/en-gb/azure/key-vault/general/basic-concepts?ref=georgeollis.com)

Once the Azure Key Vault has been created, click on secrets to create our first secret.

![](/images/blog/using-secrets-from-azure-key-vault-for-your-azure-functions/image-5.png)

We will create a secret called superSecret with a value of "myConnectionStringShouldBeHere!"

![](/images/blog/using-secrets-from-azure-key-vault-for-your-azure-functions/image-6.png)

Now we need to give our Function App access to this secret. There are two ways we can provide access.

*   Vault access policies
*   Azure role-based access control

Knowing this is important because some environments will use different settings. For our example, we will use Azure RBAC (role-based access control) because this is Microsoft's recommended approach. It will replace the traditional access policies feature (eventually).

For our example, we will provide our managed identity with the RBAC role "Key Vault Secrets User" This role only provides read access to the secrets within the Key Vault. It doesn't provide the application with management capabilities of the Azure Key Vault resource.

The specific actions this role can do can be found below.

![](/images/blog/using-secrets-from-azure-key-vault-for-your-azure-functions/image-7.png)

Providing access to the Function App can be found below.

![](/images/blog/using-secrets-from-azure-key-vault-for-your-azure-functions/image-8.png)

Once we have provided access to the Function App, we are almost done, but how do we get the application to retrieve the secret from Key Vault? This is where application settings and Key Vault references come in.

Go back to the Function App and go to **Configuration** within the settings blade**.**

![](/images/blog/using-secrets-from-azure-key-vault-for-your-azure-functions/image-9.png)

Let's add a new environment variable here called superSecret and use the built-in Key Vault reference functionality to point to our secret. The syntax for referencing a Key Vault resource is the following:

```
@Microsoft.KeyVault(SecretUri=https://KEYVAULTNAME.vault.azure.net/secrets/SECRET_VALUE/) 
```

**Below is the correct configuration.**

![](/images/blog/using-secrets-from-azure-key-vault-for-your-azure-functions/image-18.png)

**Do not just create an environment variable and paste in the connection string value like this!**

![](/images/blog/using-secrets-from-azure-key-vault-for-your-azure-functions/image-19.png)

To confirm this is working and the secret can be retrieved from the vault, Microsoft provides a green tick to confirm the reference is working, and the Function App has access to retrieve the secret.

![](/images/blog/using-secrets-from-azure-key-vault-for-your-azure-functions/image-20.png)

Now, we need to send an HTTP GET request to the Function App and confirm if it can return the environment variable value stored in Azure Key Vault.

We should have a response which says "myConnectionStringShouldBeHere!

![](/images/blog/using-secrets-from-azure-key-vault-for-your-azure-functions/image-21.png)

It's working!

## Monitoring secrets

It would be best practice to export diagnostic settings for Key Vault resources to an external source, such as a Storage Account, Event Hubs or Log Analytics Workspace. Most customers will export to a Log Analytics Workspace; this is useful to audit activity to the Key Vault resource and to see what service principal is accessing the secrets within the vault.

From the below query and screenshot, we can render a bar chart to see when the secret was retrieved and if it was successful or failed.  

```
AzureDiagnostics
| where OperationName == "SecretGet"
| summarize count() by ResultSignature, bin(TimeGenerate, 10m), identity_claim_iod_g
| render barchart
```

![](/images/blog/using-secrets-from-azure-key-vault-for-your-azure-functions/image-22.png)

If this content was helpful, please feel free to connect with me on social media at

[](https://uk.linkedin.com/in/georgeollis?trk=profile-badge&ref=georgeollis.com)

