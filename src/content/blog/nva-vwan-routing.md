---
title: "Routing traffic via an NVA in Azure Virtual WAN."
description: "<p>Before we start this blog post, it&apos;s important to note that some customers may not require this since routing intent is now generally available (Link here: <a href=\"https://learn.microsoft.com/en-us/azure/virtual-wan/how-to-routing-policies?ref=georgeollis.com\">How to configure Virtual WAN Hub routing policies - Azure Virtual WAN | Microsoft Learn</a>), but this could be a suggested solution if</p>"
date: 2023-08-09
tags:
  - azure-networking
  - azure-virtual-wan
  - routing
canonicalUrl: "https://www.georgeollis.com/nva-vwan-routing/"
---

![Routing traffic via an NVA in Azure Virtual WAN.](/images/blog/nva-vwan-routing/image-1-1.png)

Before we start this blog post, it's important to note that some customers may not require this since routing intent is now generally available (Link here: [How to configure Virtual WAN Hub routing policies - Azure Virtual WAN | Microsoft Learn](https://learn.microsoft.com/en-us/azure/virtual-wan/how-to-routing-policies?ref=georgeollis.com)), but this could be a suggested solution if you were either migrating to Azure VWAN, you had acquired another company in your organisation, or you need to add additional security for specific virtual networks.

In this blog, we will go over the configuration of VWAN, static routes, virtual networks, etc. In our example, we will use Azure Firewall for our NVA virtual network (Although Azure Firewall can be integrated into VWAN, we are not discussing that today). I've provided a diagram below of the solution; it's important to note we are not using secure hubs in Azure VWAN since our spoke virtual networks will have Azure Firewall deployed since we are discussing stacked virtual networks.

![Routing traffic via an NVA in Azure Virtual WAN.](/images/blog/nva-vwan-routing/image-1.png)

You can see that **workload-vnet-01** and **workload-vnet-02** directly peer with our virtual network with the Azure Firewall. They have no awareness of VWAN or any connections associated with the VWAN resource, in our example, workload-vent-03. However, they do have a route table with a UDR for 0.0.0.0/0 to be routed through the Azure Firewall, so this means that internet-bound traffic, our private traffic, will always be directed to the Azure Firewall. Our Azure Firewall resource is connected to our Azure VWAN resource, so its learning routes to other connected resources of Azure VWAN; again, the example we have here is workload-vnet-03.

If we check the effective routes of a virtual machine in workload-vnet-01, you will see that the routing is relatively basic, forcing everything to the Firewall. 192.168.50.4 is the private IP of the Azure Firewall.

![Routing traffic via an NVA in Azure Virtual WAN.](/images/blog/nva-vwan-routing/image-2.png)

First, ensure that vnet-workload-01 and vnet-workload-02 can communicate via the Firewall. Below is our test.

![Routing traffic via an NVA in Azure Virtual WAN.](/images/blog/nva-vwan-routing/image-3.png)

I've got a firewall rule which allows all traffic for the demonstration; however, in production, you may have a requirement to restrict what traffic is allowed or denied. If I log into a machine in workload-vnet-01 and ping another virtual machine in workload-vnet-02 on the address 192.168.2.4, I should expect the traffic to work. You can see below using the serial console.

![Routing traffic via an NVA in Azure Virtual WAN.](/images/blog/nva-vwan-routing/image-4.png)

To ensure it took the Firewall as the next hop, I can confirm this using Azure Network Watcher.

![Routing traffic via an NVA in Azure Virtual WAN.](/images/blog/nva-vwan-routing/image-5.png)

Great, we've got connectivity from Vnet-to-Vnet. How about internet traffic? That is also going through the Firewall, which we can confirm by seeing the public IP the virtual machine is using to get to the internet; the best way to find out is to use _curl ifconfig.me_ on the VM to see what public IP the virtual machine has used to go outbound to the internet. Running this on the workload1 virtual machine, I can confirm traffic is routed again via the Firewall and is using the Firewalls' public IP.

![Routing traffic via an NVA in Azure Virtual WAN.](/images/blog/nva-vwan-routing/image-6.png)

Now that we've confirmed that. How do we ensure that routing works from vnet-workload-03? This is not directly connected to the Firewall and is connected with the Azure VWAN hub in the region.

What we are attempting to test is connectivity from vnet-workload-03 to vnet-workload-01. By default, it doesn't know how to get to this virtual network because we don't have any direct peering. However, the Azure Firewall is peered to the VWAN and is aware of how to get to vnet-workload-01 and vnet-workload-02; we need to make VWAN aware that if it wants resources to connect to these virtual networks, it needs to go via the Firewall because again, it's not directly peered with VWAN. I've provided a simple diagram below.

![Routing traffic via an NVA in Azure Virtual WAN.](/images/blog/nva-vwan-routing/image-11.png)

Because workload-vnet-03 doesn't know how to route traffic to workload-vnet-01 because they do not peer, we need to configure static routes in Azure VWAN and on the virtual network connection to explicitly state that if traffic is destined to 192.168.1.0/24 (workload-vnet-01), it needs to go via the Firewall. We **must** do this in two places (Although this often gets confusing). We need to set up static routes on the route table you use in Azure VWAN. This will usually be the **default** route table; we also then need to do this on the virtual network connection; in our example, we will need to add static routes on the firewall virtual network connection for the next hop to be the Azure Firewall (192,168.50.1). We are essentially saying that if you are connected to VWAN and want to access the two indirect spokes, workload-vnet-01 and workload-vnet-02, you must take the firewall virtual network connection and next hop to the Azure Firewall.

If we go to the default route table in Azure VWAN and add these routes, which are 192.168.1.0/24 and 192.168.2.0/24, to the default route table.

![Routing traffic via an NVA in Azure Virtual WAN.](/images/blog/nva-vwan-routing/image-8.png)

Selecting configure on the next hop IP will allow you to configure the next hop address, which will be our Azure Firewall. These routes are statically added to the virtual network connection for the Firewall.

![Routing traffic via an NVA in Azure Virtual WAN.](/images/blog/nva-vwan-routing/image-9.png)

Once saved and configured, we can test if workload3 in vnet-workload-03 can access the virtual machines in vnet-workload-01 and vnet-workload-02. Just something to note, the vnet-workload-03 is connected to VWAN and is propagating and is associated with the default route table because it is associated with the default route table where the static routes have been added; it will learn these routes now. We can confirm this by viewing the effective routes on workload3 in vnet-workload-03.

![Routing traffic via an NVA in Azure Virtual WAN.](/images/blog/nva-vwan-routing/image-14.png)

So going back to the below test, can we now access a virtual machine in workload-vnet-01 via workload-vnet-03?

![Routing traffic via an NVA in Azure Virtual WAN.](/images/blog/nva-vwan-routing/image-12.png)

The answer to this question is yes! We can successfully ping 192.168.1.4 from the 192.168.3.0/24 network.

![Routing traffic via an NVA in Azure Virtual WAN.](/images/blog/nva-vwan-routing/image-13.png)

We can see the traffic traversing the Azure Firewall using diagnostic settings and Log Analytics.

![Routing traffic via an NVA in Azure Virtual WAN.](/images/blog/nva-vwan-routing/image-15.png)

```
AzureDiagnostics 
| where TimeGenerated > ago(10h)
| where SourceIP == "192.168.3.4"
| where DestinationIp_s == "192.168.1.4"
| project SourceIP, DestinationIp_s, Action_s
```

Thanks for reading this blog about NVAs in Azure Virtual WAN. As I stated at the beginning of this blog, if your appliance supports routing intent and is available as a SaaS offering, network virtual appliance or Azure Firewall (Deploying as a managed offering with VWAN), you can use routing intent which is a better solution. However, if you don't have this option, this does work and works well.

Thanks for reading.

