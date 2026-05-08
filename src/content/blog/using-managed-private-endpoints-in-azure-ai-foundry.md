---
title: "Using managed private endpoints in Microsoft Foundry"
description: "In this blog, I will cover using private endpoints in Azure AI Foundry. At the time of this blog, you can only use a managed virtual network managed and provided by Microsoft. BYOVN (Bring your own virtual network) is not supported."
date: 2024-12-01
tags:
  - azure-ai
  - microsoft-foundry
  - azure-networking
  - private-endpoints
canonicalUrl: "https://www.georgeollis.com/using-managed-private-endpoints-in-azure-ai-foundry/"
---

![Using managed private endpoints in Microsoft Foundry](/images/blog/using-managed-private-endpoints-in-azure-ai-foundry/azure-ai-network-outbound.png)

In this blog, I will cover using **private endpoints** in **Azure AI Foundry**. At the time of this blog, you can only use a **managed virtual network** managed and provided by Microsoft.

This means that **BYOVN (Bring your own virtual network)** is not supported. However, what can you do to connect to private resources within Azure? You can use **managed private endpoints** within the **managed virtual network**.

The experience is not great, but I hope Microsoft will change that. Some of the documentation provided either misses key information or doesn't offer it.

Firstly, when creating an **Azure AI Hub** resource, you will be asked which **network configuration** you want. While keeping the defaults is easy, it's probably not recommended for enterprise scenarios where **private endpoints** are being used.

![Using managed private endpoints in Microsoft Foundry](/images/blog/using-managed-private-endpoints-in-azure-ai-foundry/image.png)

I would always configure **private with internet outbound**—which is precisely what it says. The hub has a **private endpoint**, and computing resources can access **private resources** (More on that in a minute). However, data movement is unrestricted. For example, you can download any **Python package** on a compute instance used in the hub.

Perhaps a better one for enterprises but with additional overhead is using **private with approved outbound access**, which means going outbound to the Internet via an **Azure Firewall** (managed for you). However, you must add a rule allowing this access outbound in this case.

Turning this on to **private with approved outbound** will provide you with this configuration, which allows you to configure inbound access to the hub (for colleagues in the organisation to connect to the hub) and **workspace outbound access**, which controls what compute, serverless, and managed online endpoints can connect to.

![Using managed private endpoints in Microsoft Foundry](/images/blog/using-managed-private-endpoints-in-azure-ai-foundry/image-1.png)

Selecting add user-defined outbound rules will allow you to configure a private endpoint and use this within the Azure AI Hub resource. However, I'll proceed with the deployment for now, and we can continue.

Once deployed, go to the Azure AI Foundry hub storage account. Two private endpoints (blob and file services) are connected. The hub resource can access the content within the storage via the managed private endpoint.

![Using managed private endpoints in Microsoft Foundry](/images/blog/using-managed-private-endpoints-in-azure-ai-foundry/image-2.png)

What if you wanted to connect another resource via the managed virtual network? For example, you are using PromptFlow and wish to connect to another private service within Azure. An example of this may be another storage account that holds data, or you want to access Azure AI services via a managed private endpoint.

Firstly, you must add a private endpoint to the outbound list. At the time of this blog, you can't currently do this in the portal (apart from when setting up the Azure AI hub resource). You can, however, do this via the Azure CLI with this command.

```Azure
az ml workspace outbound-rule set --resource-group $RESOURCE_GROUP_NAME \
                                  --rule $RULE_NAME \
                                  --type private_endpoint \
                                  --workspace-name $AZURE_AI_HUB_NAME \
                                  --service-resource-id $RESOURCE_ID \
                                  --subresource-target account \
                                  --spark-enabled true
```

I have added this for an Azure AI Service account in my example. When you run this command, the private endpoint will automatically be approved.

![Using managed private endpoints in Microsoft Foundry](/images/blog/using-managed-private-endpoints-in-azure-ai-foundry/image-3.png)

How do you test this? That's where I initially thought: if we were to create a compute cluster within the Azure AI Hub and enable SSH and a public IP, it would allow me to connect. However, that doesn't appear to work at the time of this blog... I'm unsure why, but port 22 doesn't respond.

So, how did I test this? Surprisingly, I used PromptFlow on my provisioned compute instance, which allows you to run custom Python code. I could do a DNS query and see the private IP address of the Azure AI Service resource.

```Python
from promptflow import tool
import urllib.parse
import dns.resolver


# The inputs section will change based on the arguments of the tool function, after you save the code
# Adding type to arguments and return value will help the system show the types properly
# Please update the function name/signature per need

# In Python tool you can do things like calling external services or
# pre/post processing of data, pretty much anything you want


@tool
def echo(url: str) -> list:
    url = "https://mytesthub019450222422.cognitiveservices.azure.com/"
    mylist = []

    try:
        parsed_url = urllib.parse.urlparse(url)
        hostname = parsed_url.hostname
        answers = dns.resolver.query(hostname, 'A')
        for rdata in answers:
            print(rdata.address)
            mylist.append(rdata.address)
    except dns.resolver.NXDOMAIN:
        print('ip not found.') 


    return mylist

```

Running the PromptFlow via the compute cluster in Azure AI Hub provided me with the IP address.

![Using managed private endpoints in Microsoft Foundry](/images/blog/using-managed-private-endpoints-in-azure-ai-foundry/image-1-1.png)

For fun, I added the output of this Python code to the call to Azure OpenAI.

![Using managed private endpoints in Microsoft Foundry](/images/blog/using-managed-private-endpoints-in-azure-ai-foundry/image-2-1.png)

As you can see, the setup experience isn't great, but I believe Microsoft will continue to improve it. Thanks for reading this blog. I hope it helps!

