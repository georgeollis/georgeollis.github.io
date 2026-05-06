---
title: "Using Microsoft Defender for DNS"
description: "I never understood Defender for DNS's usefulness before writing this blog. Microsoft Defender for DNS provides another layer of protection for resources that utilise Azure DNS's Azure-provided name resolution capability.

The Defender for DNS service can monitor the queries from resources, detecting suspicious activities without requiring additional agents. It's beneficial"
date: 2023-01-18
tags:
  - azure-security
  - azure-networking
canonicalUrl: "https://www.georgeollis.com/using-microsoft-defender-for-dns/"
---

18 Jan 2023 5 min read

# Using Microsoft Defender for DNS

![Using Microsoft Defender for DNS](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/size/w960/2023/01/VWAN-Routing-10.png)

I never understood Defender for DNS's usefulness before writing this blog. Microsoft Defender for DNS provides another layer of protection for resources that utilise Azure DNS's Azure-provided name resolution capability.

The Defender for DNS service can monitor the queries from resources, detecting suspicious activities without requiring additional agents. It's beneficial in the following areas.

*   **Data exfiltration** from your Azure resources using DNS tunnelling
*   **Malware** communicating with command and control servers
*   **DNS attacks** - communication with malicious DNS resolvers
*   **Contact with domains used for malicious activities** such as phishing and crypto mining

Let's set up Defender for DNS. First, you need to ensure it's enabled on the subscription. This can be done by going to Microsoft Defender for Cloud in the Azure portal.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/image-109.png)

The Microsoft Defender for Cloud overview will provide your security posture and compliance information. Select the **environment settings** option.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/image-110.png)

Select the Azure subscription you would want to enable for Defender for DNS.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/image-111.png)

Enable the Defender for the DNS plan and save the settings. This will enable the plan for the subscription.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/image-113.png)

To confirm that our Defender for DNS plan is working correctly, we want to get emails when a security alert has been created. We will also want to store this information in a Log Analytics Workspace.

Select the email notifications tab on the same settings page.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/image-114.png)

Our configuration can be seen below. We've set that the subscription owner will be notified of Microsoft Defender for Cloud alerts. I've included my email address, which will also get the notifications.

I've configured the notification type to be low; this means I will get emails for low, medium and high alerts.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/image-115.png)

To export these notifications to a Log Analytics Workspace, select the continuous export settings on the same tab.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/image-114.png)

Select your Log Analytics Workspace, and ensure you capture all security alerts.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/image-116.png)

Now we've set up Defender for DNS, let's provide an overview of our existing environment. You can see a high-level diagram below. We have a basic setup for our demo, a virtual network, one subnet and a virtual machine.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/image-117.png)

First, to confirm, our DNS settings are Azure using the defaults. This is important and needs to be configured.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/image-118.png)

Logging into the virtual machine in that virtual network in our diagram and running the **ipconfig /all** command, we again can confirm that Azure-provided DNS is being used.

Whenever you see the IP address 168.63.129.16 - always think of Azure DNS. This IP address is important to understand in Azure. Microsoft has provided an excellent overview: [What is IP address 168.63.129.16? | Microsoft Learn](https://learn.microsoft.com/en-us/azure/virtual-network/what-is-ip-address-168-63-129-16?ref=georgeollis.com)

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/image-119.png)

We need to perform some DNS queries to sites participating in malicious behaviour, such as malware, data exfiltration, etc. Microsoft has provided another blog which allows us to test and validate that Defender for DNS is working: [Validating Microsoft Defender for DNS Alerts - Microsoft Community Hub](https://techcommunity.microsoft.com/t5/microsoft-defender-for-cloud/validating-microsoft-defender-for-dns-alerts/ba-p/2227845?ref=georgeollis.com).

We will use the sites mentioned in this article within our environment and confirm we get alerts. Go back to the virtual machine and perform name resolution to sites flagged as malicious.

```
Resolve-DnsName bbcnewsv2vjtpsuy.onion.to
Resolve-DnsName all.mainnet.ethdisco.net
Resolve-DnsName micros0ft.com 
Resolve-DnsName 164e9408d12a701d91d206c6ab192994.info  -ErrorAction Ignore
```

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/image-120.png)

You can also run this PowerShell script which will generate random names and attempt to resolve them using DNS to IP addresses.

```
For($i=0; $i -le 1000; $i++) {
$rand = -join ((97..122) | Get-Random -Count 63 | % {[char]$_})
Resolve-DnsName "$rand.contoso.com" -ErrorAction Ignore
}
```

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/image-121.png)

If you try to run these commands multiple times on the same VM, you will not receive numerous alerts unless you flush your local DNS using ipconfig /flushdns.

The first alerts do seem to take a while to come through. However, I could view them in Microsoft Defender for Cloud when they did.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/image-122.png)

Expanding into one alert - I can view additional information about the alert.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/image-123.png)

We can also now use this data in a Log Analytics Workspace. The data is available in the SecurityAlert table. We set the data to be exported through Microsoft Defender for Cloud at the blog's beginning.

I've created a basic query below that provides a quick overview of the alert, the comprised entity and the domain.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/image-124.png)

```
SecurityAlert 
| where CompromisedEntity == "CLIENTMACHINE"
| extend domainName = parse_json(ExtendedProperties).DomainName
| project TimeGenerated, AlertName, CompromisedEntity, domainName
```

If you configure email alerts, you will also receive an email from Microsoft Defender for Cloud. I've included an example below.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/image-125.png)

I feel like this service is often missed but is useful. Thanks for reading this shorter blog, and if you want help or have any questions, please feel free to reach out. Remember, you can connect with me below.

[https://bio.link/georgeollis](https://bio.link/georgeollis?ref=georgeollis.com)

