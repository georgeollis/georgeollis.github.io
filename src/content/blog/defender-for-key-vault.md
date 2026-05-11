---
title: "Exploring Defender for Key Vault"
description: "Another blog about a Defender product in Microsoft Defender for Cloud - Have you ever looked at Defender for Key Vault and thought, what is it? Luckily, you've come across this blog (Or not so lucky).

Let's first answer the questions about what it is - Defender for Key Vault"
date: 2023-02-03
tags:
  - azure-security
  - azure-key-vault
canonicalUrl: "https://www.georgeollis.com/defender-for-key-vault/"
---

# Exploring Defender for Key Vault

![Exploring Defender for Key Vault](/images/blog/defender-for-key-vault/VWAN-Routing.png)

Another blog about a Defender product in Microsoft Defender for Cloud - Have you ever looked at Defender for Key Vault and thought, what is it? Luckily, you've come across this blog (Or not so lucky).

Let's first answer the questions about what it is - Defender for Key Vault will detect unusual and harmful attempts to access or exploit a Key Vault resource. When a potentially dangerous threat occurs, Defender for Key Vault will send an alert to an email address. These alerts can also be exported to a log analytics workspace for historical data storage, dashboards, or further analysis.

Microsoft Defender for Key Vault has several built-in alerts, which can be found below.

*   The user accessed a high volume of key vaults.
*   Unusual user-application pair accessed a key vault
*   An unusual user accessed a key vault
*   Unusual operation pattern in a key vault
*   Unusual application accessed a key vault
*   Unusual access denied - Unusual user accessing key vault denied
*   Unusual access denied - User accessing high volume of key vaults denied
*   Suspicious secret listing and query in a key vault
*   Suspicious policy change and secret query in a key vault
*   An unexpectedly high volume of operations in a key vault.
*   Access from a TOR exit node to a key vault

Let's enable Defender for Key Vault now and go through the process of testing some alerts. First, you need to go to Microsoft Defender for Cloud, select environment settings and select the subscription you want it enabled on.

![](/images/blog/defender-for-key-vault/image-5.png)

Enable Defender for Key Vault and select save. This will now enable the feature.

![](/images/blog/defender-for-key-vault/image-6.png)

Going to our Azure Key Vault resource and selecting security, we can see that Defender for Key Vault is enabled and will be working behind the scenes to detect anything suspicious.

![](/images/blog/defender-for-key-vault/image-7.png)

Let's go and create a secret for our Key Vault resource. Select **secrets** on the key vault and click **generate/import.** Add a new secret called **Testing** with the value MySecretValue. Click the save button to create the secret.

![](/images/blog/defender-for-key-vault/image-8.png)

Now let's test to see if Defender for Key Vault works. We will do this by simulating an alert. We've deployed a virtual machine in Azure and installed the TOR browser. We will attempt to trigger the alert "**Access from a TOR exit node to a key vault".**

This is my experience, and perhaps yours will be different, but It's important to note that once Defender for Key Vault is enabled. I struggled to get it to notify me of a security incident for over 24 hours. This is a long time. I'm hoping this will change. However, we did eventually get the alert!

From the below screenshot, we can see the alert has been triggered by viewing Microsoft Defender for Cloud on the specific resource.

![](/images/blog/defender-for-key-vault/image-9.png)

However, you can view all the alerts by going into Microsoft Defender for Cloud. Which will show you all the signs Microsoft Defender for Cloud has created.

![](/images/blog/defender-for-key-vault/image-10.png)

If you want additional details about the alert - you can click on it, and it will display helpful information about who accessed it, where they accessed it from and what operations they did. You can see that below.

![](/images/blog/defender-for-key-vault/image-11.png)

You should export audit logs from Azure Key Vault to a log analytics workspace or send the records to an event hub if you use a third-party SIEM product. In our example, we will ensure that audit logs go to our log analytics workspace.

![](/images/blog/defender-for-key-vault/image-12.png)

Once we send logs to our workspace, we can use the KQL language to investigate the data. This will provide us with a deeper understanding of what is happening within our environment. Pairing this with Defender for Key Vault is excellent.

If we wanted to see who was calling the key vault resource, we could run a simple query like the one below.

```
AzureDiagnostics
| where ResourceProvider =="MICROSOFT.KEYVAULT"
| summarize count() by CallerIPAddress, Resource
```

![](/images/blog/defender-for-key-vault/image-13.png)

The data that it returns is powerful. We can use this to see trends in our resources and to detect any new or surprising IP addresses that shouldn't be accessing the key vault.

How about users\\service principals that are trying to access the key vault but are forbidden from doing so? We can use a similar query to the one below.

```
// Are there any failures? 
// Count of failed KeyVault requests by status code. 
// To create an alert for this query, click '+ New alert rule'
AzureDiagnostics
| where ResourceProvider =="MICROSOFT.KEYVAULT" 
| where httpStatusCode_d >= 300 and not(OperationName == "Authentication" and httpStatusCode_d == 401)
| summarize count() by requestUri_s, ResultSignature, _ResourceId
// ResultSignature contains HTTP status, e.g. "OK" or "Forbidden"
// httpStatusCode_d contains HTTP status code returned by the request (e.g.  200, 300 or 401)
// requestUri_s contains the URI of the request
```

![](/images/blog/defender-for-key-vault/image-14.png)

### Summary

Defender for Key Vault is a powerful security tool that you can use to detect malicious behaviour or suspicious activity within your Key Vault.

An Azure Key Vault will always be one of those resources that attacks will target because of the sensitive values, certificates and keys it can store.

Enabling Defender for Key Vault is done at the subscription level; it cannot be done on a per-vault basis which would be nice. Pricing for Defender for Key Vault is $0.02 for every 10k transactions.

Thanks for reading this shorter blog, and if you want help or have any questions, please feel free to reach out. Remember, you can connect with me below.

[https://bio.link/georgeollis](https://bio.link/georgeollis?ref=georgeollis.com)

