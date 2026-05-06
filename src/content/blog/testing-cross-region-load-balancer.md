---
title: "Testing out Cross-Region Azure Load Balancer"
description: "My first blog about a load balancer. (It's been on my list for a while), Many blogs already cover basic and standard internal and external load balancers, so I don't want to cover those just yet, although I will blog about them at some point.

Still, we will cover a"
date: 2023-02-09
tags:
  - azure-networking
  - load-balancer
canonicalUrl: "https://www.georgeollis.com/testing-cross-region-load-balancer/"
---

# Testing out Cross-Region Azure Load Balancer

![Testing out Cross-Region Azure Load Balancer](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/size/w960/2023/02/VWAN-Routing-9.png)

My first blog about a load balancer. (It's been on my list for a while), Many blogs already cover basic and standard internal and external load balancers, so I don't want to cover those just yet, although I will blog about them at some point.

Still, we will cover a similar one which is the cross-region load balancer. So what is the Cross-Region Load Balancer? Well, it is a Layer-4 pass-through network load balancer. It's part of the standard Azure Load Balancer offering. The cross-region load balancer provides high availability across regions when using external load balancers, a regional service.  

The cross-region load balancer attempts to address several issues: regional redundancy constraints with a standard regional Azure Load Balancer. It also looks to reduce failover time to another region.

An example of a service this could replace is Azure Traffic Manager. Traffic Manager is based on DNS "load balancing", in which failover duration can take several minutes with DNS being updated and clients caching endpoints. Traffic Manager is recommended for non-HTTP traffic, which is the case for the cross-region load balancer.

The cross-region load balancer gathers information about the availability of each regional load balancer every 20 seconds. If one regional load balancer drops its availability, the cross-region load balancer will detect the failure. The regional load balancer is then taken out of rotation.

Before we look at our environment, the cross-region load balancer has something called home regions and participating regions. Lets's cover those first.

### Home Regions

The cross-region load balancer and its public IP address are deployed in a "home region". This region doesn't affect how the traffic would be routed; if the region goes down, traffic flow is unaffected. It's important to note that the following regions can currently be used for home regions.

*   East US 2
*   West US
*   Southeast Asia
*   Central US
*   North Europe
*   East Asia
*   US Gov Virginia
*   UK South
*   West Europe

### Participating Regions

A participating region is where the public IP of the cross-region load balancer is being advertised. Traffic started by the user will travel to the closest participating region through the Microsoft core network.

*   East US
*   West Europe
*   Central US
*   East US 2
*   West US
*   North Europe
*   South Central US
*   West US 2
*   UK South
*   Southeast Asia
*   North Central US
*   Japan East
*   East Asia
*   West Central US
*   Australia Southeast
*   Australia East
*   Central India
*   US DoD Central
*   US DoD East
*   US Gov Arizona
*   US Gov Texas
*   US Gov Virginia

### Environment

Our environment can be found below.

*   Two virtual networks.
*   Two virtual machines - one in UK South, one in East US with IIS running and exposing port 80.
*   Two external public-facing load balancers
*   One cross-region load balancer deployed in UK South (Home region)
*   Two Network Security Groups.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/VWAN-Routing-5.png)

Let's make this a little easier to understand by showing a single region without the cross-region load balancer. It isn't easy to scale this architecture to other regions. However, this would be suitable for an application that is single region.

High availability would come through placing the virtual machines in separate availability zones. However, this design isn't great when trying to provide regional redundancy.    

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/VWAN-Routing-6.png)

In our single region architecture - we can confirm its working by going to the external front-end IP of the load balancer. The load balancer has a rule for listening to traffic on port 80. I've added some text to the default image, showing that the VM is in UK South.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-15.png)

An identical setup has been provisioned in East US. However, it has a different public IP address for the external load balancer. Again, you can see a diagram below.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/VWAN-Routing-8.png)

If we try to access that IP address from my client machine, I can see that I can access the VM in East US through the load balancer.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-16.png)

Now that we have the same workload running in both UK South and East US, it's time to use the Cross-Region Azure Load Balancer, which will provide us with regional redundancy and scale for our application.

Deploying the Cross-Region Azure Load Balancer is simple and can be done through the portal. Once it is up and running, we can start to configure it. You'll notice that the tier for the load balancer is now set up to **global.**

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-17.png)

The first setting is to create a frontend IP configuration, this needs to be done on the initial deployment, and you can view the public IP below.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-18.png)

Now it's time to add backend pools - adding a backend pool is easy; however, it's important to note that external-facing load balancers are currently **only** supported. I believe there are plans to allow you to use internal load balancers. You can see the screenshot below, which shows me adding both our external facing load balancers as backend targets.  

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-19.png)

Clicking save will start to deploy the backend pool configuration.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-20.png)

The final part is to add load balancing rules; again, this is simple if you have done previous deployments of Azure Load Balancers, the backend pool we are selecting has our external load balancers, and we have configured the cross-region load balancer to listen on port 80.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-21.png)

Once the following steps have been done, our cross-region load balancer has been configured. We don't have to worry about health probes currently, as Azure sends health probes to external regional load balancers every 20 seconds by default.

If I now go to the public IP address of the cross-region load balancer, we can access our application. In this example, I am based in the UK, so I would go to the UK South load external load balancer.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-22.png)

I will turn off the VM running in UK South and confirm if I can still access our application, but now from East US. This took probably 10 seconds, and I switched to East US.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-23.png)

We can see that the health probe status has dropped on the cross-region load balancer after I turned off the VM in UK South.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-24.png)

After turning back on the VM, I can access the application in UK South, and the health probe status continues to increase in Azure Metrics.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-25.png)

### Summary

Thanks for reading this blog about cross-region load balancers. It's important to note that the service is currently in public preview, but I'm sure it will hit GA in the next few months.

Thanks for reading this blog, and if you want help or have any questions, please feel free to reach out. Remember, you can connect with me below.

[https://bio.link/georgeollis](https://bio.link/georgeollis?ref=georgeollis.com)

