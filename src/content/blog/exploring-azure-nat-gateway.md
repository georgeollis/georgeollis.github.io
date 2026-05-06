---
title: "Exploring Azure NAT Gateway"
description: "This blog will explore Azure NAT Gateway. At a high level, Azure NAT gateway is a fully managed Network Address Translation (NAT) service. NAT gateway simplifies outbound Internet connectivity for virtual networks.

Azure NAT Gateway has several benefits and is recommended by Microsoft for outbound connectivity. First, let's explore deploying"
date: 2022-12-24
tags:
  - azure-networking
canonicalUrl: "https://www.georgeollis.com/exploring-azure-nat-gateway/"
---

24 Dec 2022 5 min read

# Exploring Azure NAT Gateway

![Exploring Azure NAT Gateway](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/size/w960/2022/12/VWAN-Routing-3.png)

This blog will explore Azure NAT Gateway. At a high level, Azure NAT gateway is a fully managed Network Address Translation (NAT) service. NAT gateway simplifies outbound Internet connectivity for virtual networks.

Azure NAT Gateway has several benefits and is recommended by Microsoft for outbound connectivity. First, let's explore deploying a NAT Gateway, a deployment is reasonably straightforward, but you need to be aware of a few things. Our demo environment is essential, and an overview can be found below.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/VWAN-Routing-4.png)

Our demo environment already has the virtual network deployed and subnets. We need to deploy the NAT Gateway; let's do that together.

#### NAT Gateway Deployment

In the first section, we are asked to provide default information, such as name, resource group and location. We also need to decide our availability zone and TCP idle timeout configuration.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-79.png)

##### TCP Idle Timeout

TCP connections can go idle when no data is transmitted between either endpoint for a prolonged period. A timer can be configured from 4 minutes, which is the default, to 120 minutes to time out a connection that has gone idle. **Traffic on the flow will reset the idle timeout timer.**

#### Availability Zones

It's important to note that the NAT gateway is currently a zonal service, which means it can be deployed and operated out of individual availability zones. **This is different to a zone redundant service.** Zone redundant services are replicated or distributed automatically across zones. This is not the case for Azure NAT Gateway.

Azure NAT Gateway can be designated to an availability zone within a region or to what Microsoft calls a **no zone**. (Which only means that Azure will select the availability zone automatically).

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/VWAN-Routing.jpg)

On the next page, we can select our outbound IP information; we can choose either to create or select multiple public IP addresses or public IP prefixes.

Each outbound IP address provides 64,000 SNAT ports for the NAT gateway resource to use. You can add up to 16 outbound IP addresses.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-80.png)

On the final page, we can select which virtual network and subnets we can associate with the NAT gateway. **It's important to note that A NAT gateway can't span multiple virtual networks.**

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-81.png)

Click review and create this will start creating the NAT Gateway resource. For our demo environment, we've created a NAT Gateway in zone 2 in UK South and a virtual machine in zone 2. Our diagram can be found below.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-82.png)

Our NAT gateway has two public IP addresses attached, 20.77.71.79 and 20.77.71.105. If I log in to my Linux VM and run the command:

```
curl ifconfig.me
```

This will return the outbound public IP address used by the VM when going outbound to the internet.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-83.png)

As you can see, we are using both public IP addresses outbound. What if we deploy a VM in zone 1 to the subnet used by the NAT Gateway in zone 2? So our diagram now looks like this.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-84.png)

We've deployed a VM in zone 1 in UK South and confirmed it's using the NAT Gateway in zone 2. This works great.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-85.png)

However, it's important to note that the VM is going outbound to the internet through the NAT Gateway in zone 2, which may make this a point of failure if zone 2 goes offline.

Microsoft provides some excellent guidance here on outbound connectivity with NAT gateway: [Ensure zone resilient outbound connectivity with NAT gateway | Azure Blog and Updates | Microsoft Azure](https://azure.microsoft.com/en-gb/blog/ensure-zone-resilient-outbound-connectivity-with-nat-gateway/?ref=georgeollis.com)

## Monitoring NAT Gateway

Microsoft provides out-of-the-box metrics that can be used to monitor the NAT Gateway. These include the following.

#### Bytes

A total number of bytes transmitted within the period specified.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-86.png)

### Dropped packets

The count of dropped packets over a period specified.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-87.png)

### Packets

A total number of packets transmitted within the period specified.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-88.png)

### SNAT Connection Count

Total concurrent active connections.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-89.png)

### Total SNAT Connection Count

A total number of active SNAT connections.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-91.png)

#### SNAT flows for NAT Gateway

NAT gateway provides a many-to-one configuration in which multiple virtual machine instances within a NAT gateway-configured subnet can use the same public IP address to connect outbound.

In the following table, two virtual machines (10.0.0.1 and 10.2.0.1) connect to [https://www.georgeollis.com](https://www.georgeollis.com/) destination IP 151.101.63.7.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-78.png)

When the NAT gateway is configured with public IP address 65.52.1.1, each virtual machine's source IPs are translated into the NAT gateway's public IP address and a SNAT port.

## Benefits of NAT Gateway

#### Security

Compute resources don't need individual public IP addresses, allowing them to remain private. Compute resources without a public IP address will still be able to reach external sources outside of the virtual network but will use the public IP of the NAT Gateway, which is either statically assigned or provided from a prefix of IPs. This becomes useful when you need to whitelist IP addresses to allow specific traffic from an organisation.  

#### Managed

Azure NAT Gateway is a managed service provided by Microsoft; this means that Azure manages the operation of the NAT gateway for you. This removes operational overhead for the organisation, allowing you to focus on business-specific workloads.

#### Performance

NAT Gateway can provide up to 50Gbps of throughput. NAT gateway can support up to 50,000 concurrent connections **per** public IP address to the same destination endpoint over the internet for TCP and UDP connections. The total number of connections that NAT gateway can support at any given time is up to 2 million.

### Azure Policy for NAT Gateway

Do you want to audit subnets without a NAT Gateway associated with them? I created an Azure Policy that will do precisely that.

```Azure
{
  "$schema": "https://schema.management.azure.com/schemas/2018-05-01/subscriptionDeploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "resources": [
    {
      "type": "Microsoft.Authorization/policyDefinitions",
      "apiVersion": "2020-09-01",
      "name": "Azure NAT Gateway should be assigned to subnets",
      "properties": {
        "displayName": "Azure NAT Gateway should be assigned to subnets.",
        "policyType": "Custom",
        "mode": "All",
        "description": "Azure NAT Gateway should be assigned to subnets.",
        "metadata": {
          "version": "0.1.0",
          "category": "Network",
          "source": "source"
        },
        "policyRule": {
          "if": {
            "allOf": [
              {
                "field": "type",
                "equals": "Microsoft.Network/virtualNetworks/subnets"
              },
              {
                "not":{
                  "field": "name",
                  "equals": "GatewaySubnet"
                }
              },
              {
                "field": "Microsoft.Network/virtualNetworks/subnets/natGateway.id",
                "exists": false
              }

            ]
          },
          "then": {
            "effect": "audit"
          }
        }
      }
    }
  ]
}
```

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-92.png)

Thanks for reading this short blog about NAT Gateway. You can connect with me below.

[](https://uk.linkedin.com/in/georgeollis?trk=profile-badge&ref=georgeollis.com)

