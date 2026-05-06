---
title: "Testing private endpoint network policies"
description: "We now have the ability to use NSGs and UDRs with Private Endpoints within an Azure Virtual Network.

This feature has been requested over the last couple of years, and it's finally here! This blog is to demonstrate how this works with NSGs. The diagram below shows the currently running"
date: 2022-10-20
tags:
  - azure-networking
  - private-endpoints
canonicalUrl: "https://www.georgeollis.com/testing-private-endpoint-network-policies/"
---

# Testing private endpoint network policies

![Testing private endpoint network policies](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/size/w960/2022/10/Private-Endpoint-DNS-1.png)

We now have the ability to use NSGs and UDRs with Private Endpoints within an Azure Virtual Network.

This feature has been requested over the last couple of years, and it's finally here! This blog is to demonstrate how this works with NSGs. The diagram below shows the currently running environment; this environment has one virtual network and two subnets; one subnet is running a VM, and the other has a private endpoint to a Storage Account. A basic overview of the current setup is below:

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/10/Private-Endpoint-DNS.png)

We currently do not have the private endpoint network policy configured on the subnet with the storage account; this means that traffic to the storage account cannot be controlled through an NSG.

We've uploaded some test data to the storage account; in our case, we are using the Azure File service within the storage account, which allows us to use the SMB protocol to connect to the storage account over port 445. We can test that our connection is working by running the following command's on the Windows 11 machine in the environment.

First, run the nslookup command to confirm that DNS is working correctly.

```cmd
nslookup stgollistest.file.core.windows.net 
```

The response from the DNS query should return the private IP address of the storage account. This looks to be working.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/10/image-6.png)

We can now run the PowerShell script, which will loop over the same command and perform a Test-NetConnection to the storage account to check that port 445 is accessible to the virtual machine.

```
1..1000000 | foreach { $connectTestResult = Test-NetConnection -ComputerName stgollistest.file.core.windows.net -Port 445 ; if ($connectTestResult.TcpTestSucceeded -eq "True") { Write-Host "Connection Successful" -f Green } else { Write-Host "Connection Failed" -f red }}
```

If the output on the terminal returns "Connection Successful", can we confirm that the virtual machine can communicate with the storage account?

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/10/image-7.png)

This is great... we can confirm that we can now connect to the storage account. However, you need to authenticate to connect to the storage account through one of the many different authentication methods available to you (Access keys, AD, Azure AD).

What if we had a requirement to completely block a range of IP addresses from connecting to the storage account? This is where we can use private endpoints network policies. First, you must enable the feature at the subnet level where your private endpoints reside.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/10/image-8.png)

As you can see from the screenshot, this is currently disabled in my environment. I will enable this feature which only takes a few seconds to set. Now, this has been established; the private endpoint network policy is being enforced; for our example, we shall assign a network security group to the subnet and create an inbound rule to block all incoming traffic on port 445; this should mean that the virtual machine should be blocked from connecting to the storage account.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/10/image-9.png)

This rule has now been configured on the network security group and is assigned to the same subnet where the storage account private endpoint network card is. If we go back to the virtual machine and rerun the same test...  

```
1..1000000 | foreach { $connectTestResult = Test-NetConnection -ComputerName stgollistest.file.core.windows.net -Port 445 ; if ($connectTestResult.TcpTestSucceeded -eq "True") { Write-Host "Connection Successful" -f Green } else { Write-Host "Connection Failed" -f red }}
```

We are getting "Connection Failed" - this is precisely what we wanted!

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/10/image-10.png)

This quick blog introduces you to the private endpoint network policy feature! How great is this? More information on the service can be found here: [Manage network policies for private endpoints - Azure Private Link | Microsoft Learn](https://learn.microsoft.com/en-us/azure/private-link/disable-private-endpoint-network-policy?tabs=network-policy-portal&ref=georgeollis.com)

If this content was helpful, please feel free to connect with me on social media at

*   [George Ollis (@georgeollis\_) / Twitter](https://twitter.com/georgeollis_?ref=georgeollis.com)
*   [George Ollis ☁️ | LinkedIn](https://www.linkedin.com/in/georgeollis/?ref=georgeollis.com)

