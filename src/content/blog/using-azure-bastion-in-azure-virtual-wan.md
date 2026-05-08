---
title: "Using Azure Bastion in Azure Virtual WAN"
description: "So you've deployed Azure Virtual WAN and want to start using Azure Bastion for remote management to virtual machines that are in connected virtual networks to the Azure VWAN."
date: 2023-06-21
tags:
  - azure-networking
  - azure-virtual-wan
  - azure-bastion
canonicalUrl: "https://www.georgeollis.com/using-azure-bastion-in-azure-virtual-wan/"
---

![Using Azure Bastion in Azure Virtual WAN](/images/blog/using-azure-bastion-in-azure-virtual-wan/Screenshot-2023-06-21-131019.png)

So you've deployed Azure Virtual WAN and want to start using Azure Bastion for remote management to virtual machines that are in connected virtual networks to the Azure VWAN.

You've got a virtual network appliance sitting in a separate virtual network; this peers directly with the Azure VWAN hub in the region. A route table associated with the virtual networks running virtual machines has a route 0.0.0.0/0 pointing traffic to the network virtual appliance. Virtual machines traverse the network virtual appliance to get outbound to the internet. I've provided a diagram of the existing setup.

![Using Azure Bastion in Azure Virtual WAN](/images/blog/using-azure-bastion-in-azure-virtual-wan/image-9.png)

All virtual networks propagate their routes to the default route table in the existing setup. They are also associated with that default route table, allowing them to learn the other routes propagated to it. We've got a 0.0.0.0/0 catch-all route statically added to the default route table. Virtual networks associated with this route table will also have this route.  

Going into the Azure Virtual WAN hub resource, I've provided an overview of what is happening. This is the default route table advertising the virtual network connections and the static route. The route table is associated with all virtual network connections.

![Using Azure Bastion in Azure Virtual WAN](/images/blog/using-azure-bastion-in-azure-virtual-wan/image-10.png)

If we look from the virtual machine side by going to a virtual machine in the spoke-1 virtual network and viewing the effective routes on the network interface card.

![Using Azure Bastion in Azure Virtual WAN](/images/blog/using-azure-bastion-in-azure-virtual-wan/image-11.png)

We can see that the network interface card has routes to the firewall (Spoke-03) and Spoke-02, and the default route (0.0.0.0/0) is being advertised. All these routes are being advertised because they are being propagated to the default route table; the virtual network connections are associated with that default route table so that they will learn the routes dynamically.

To test connectivity to the other virtual networks connected to the Azure VWAN hub. I can run a ping to the IP addresses of the virtual machines running in those virtual networks.

![Using Azure Bastion in Azure Virtual WAN](/images/blog/using-azure-bastion-in-azure-virtual-wan/image-12.png)

I am confirming that connectivity is working.

Ok, this is great. Now we require to spin up an Azure Bastion resource. But where should we be placing it precisely? This is where things get interesting. We have the firewall in spoke-03, and we are advertising the default route 0.0.0.0/0 to go to that firewall, which will not be supported by Azure Bastion, which requires that the next-hop for internet 0.0.0.0/0 connectivity is the internet. ([Azure Bastion FAQ | Microsoft Learn](https://learn.microsoft.com/en-us/azure/bastion/bastion-faq?ref=georgeollis.com#vwan))

What is recommended by Microsoft is that we place the Azure Bastion in a separate, dedicated virtual network. So our diagram theoretically looks like this now.

![Using Azure Bastion in Azure Virtual WAN](/images/blog/using-azure-bastion-in-azure-virtual-wan/image-13.png)

For this to work successfully, we need to do a few things. Firstly, we need to enable the IP-based connection on the Azure Bastion when we deploy it; the IP-based connection is part of the **standard** SKU for Azure Bastion and allows you to connect to virtual machines using an IP address as long as you have a route to them, for example, you could connect to virtual machines running on-premises via Express Route or an S2S connection. More information can be found here: [https://learn.microsoft.com/en-us/azure/bastion/connect-ip-address](https://learn.microsoft.com/en-us/azure/bastion/connect-ip-address?ref=georgeollis.com).

The second item required is that the 0.0.0.0/0 **can't** be advertised as a next hop for the virtual network connection where Azure Bastion will be running. So we need to turn off the advertisement of the default route. The 0.0.0.0/0 route for Azure Bastion needs to be the internet.

I know what you are thinking. Could we deploy the Azure Bastion into an existing virtual network and place a UDR on the subnet for the next-hop 0.0.0.0/0 to go the internet? Nope. We can't because assigning a UDR to the AzureBastionSubnet is unsupported. [Azure Bastion FAQ | Microsoft Learn](https://learn.microsoft.com/en-us/azure/bastion/bastion-faq?ref=georgeollis.com#udr)

So we've got our Azure Bastion virtual network deployed, our AzureBastionSubnet, and we've connected this to our Azure Virtual WAN Hub. We've associated this and propagated the route to the default route table. However, we won't be able to utilise Bastion in this setup because the static default route 0.0.0.0/0 is being advertised to the virtual network where Azure Bastion is configured.

I deployed an additional subnet running a virtual machine in our Azure Bastion virtual network, again looking at the effective routes.

![Using Azure Bastion in Azure Virtual WAN](/images/blog/using-azure-bastion-in-azure-virtual-wan/image-14.png)

The default 0.0.0.0/0 route will break the Azure Bastion service from running correctly. How do we stop the propagation of this route? Returning to the virtual network connection on the Azure Virtual WAN for the bastion virtual network.

![Using Azure Bastion in Azure Virtual WAN](/images/blog/using-azure-bastion-in-azure-virtual-wan/image-15.png)

Select the virtual network connection for the bastion virtual network and disable the default route from being propagated. Setting this disabled will block a default route 0.0.0.0/0 from being propagated to that virtual network connection.

![Using Azure Bastion in Azure Virtual WAN](/images/blog/using-azure-bastion-in-azure-virtual-wan/image-16.png)

Update and save the connection. We can confirm if this has worked if we look at the effective routes of the virtual machine in the Azure Bastion virtual network.

![Using Azure Bastion in Azure Virtual WAN](/images/blog/using-azure-bastion-in-azure-virtual-wan/image-17.png)

Let's test and confirm. We will use the Azure Bastion service to connect to a virtual machine running in spoke01 (192.168.1.4). Go to the Azure Bastion service and select Connect.

![Using Azure Bastion in Azure Virtual WAN](/images/blog/using-azure-bastion-in-azure-virtual-wan/image-18.png)

Once authenticated. You should see the terminal for the virtual machine.

![Using Azure Bastion in Azure Virtual WAN](/images/blog/using-azure-bastion-in-azure-virtual-wan/image-19.png)

I've provided a high-level diagram of what we've just achieved.

![Using Azure Bastion in Azure Virtual WAN](/images/blog/using-azure-bastion-in-azure-virtual-wan/image-20.png)

Thanks for reading this blog about Azure Bastion and Azure Virtual WAN. Please check out any other blogs on the website. Hopefully, they can help someone. :)

I've provided links to social media accounts. Follow me to stay connected when I post next! Thanks so much for reading.

[https://bio.link/georgeollis](https://bio.link/georgeollis?ref=georgeollis.com)

