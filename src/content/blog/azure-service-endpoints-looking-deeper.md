---
title: "Investigating Service Endpoints"
description: "This blog will explore service endpoints, how they work, and why you may want to use them to protect your cloud resources.

Another blog will be created to explore other ways of doing a similar functionality through private endpoints, but let's look at service endpoints.  

Service endpoints allow you to"
date: 2023-01-01
tags:
  - azure-networking
canonicalUrl: "https://www.georgeollis.com/azure-service-endpoints-looking-deeper/"
---

# Investigating Service Endpoints

![Investigating Service Endpoints](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/size/w960/2022/12/VWAN-Routing-7.png)

This blog will explore service endpoints, how they work, and why you may want to use them to protect your cloud resources.

Another blog will be created to explore other ways of doing a similar functionality through private endpoints, but let's look at service endpoints.  

Service endpoints allow you to secure critical Azure service resources to only virtual networks. Service Endpoints enable private IP addresses in the virtual network to reach the endpoint of an Azure service.

What are the core benefits of using Service Endpoints? Let's have a look.

*   **Increased security for Azure resources**
*   **Optimal routing for Azure service traffic from your virtual network**
*   **Simple to set up with less management overhead**

### Demo environment

To set the scene, our demo environment will consist of a virtual network, a virtual machine, Azure Bastion and an Azure SQL server and database.

We will use service endpoints to connect our virtual machine to our Azure SQL instance through a service endpoint. A diagram of the environment can be found below.  

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/VWAN-Routing-8.png)

We've already deployed our virtual network, virtual machine, bastion and Azure SQL instance. Let's now go ahead and configure our service endpoint to connect to our Azure SQL instance via a service endpoint.

First, go to the subnet you want to use to connect via the service endpoint to Azure SQL and enable the Microsoft.Sql service on the subnet. We will enable the service endpoint on the default subnet in our example.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-93.png)

Once configured, go to the Azure SQL logical server and click on networking.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-94.png)

Add a virtual network rule, allowing you to use the service endpoint configured on the default subnet to connect to this Azure SQL instance over the Microsoft backbone network.

We **don't** have any private endpoints configured or firewall rules added, and we've **not** enabled the box to **allow Azure services and resources to access this server.** We are simply using the service endpoint.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-95.png)

### Testing service endpoint connectivity

Let's connect to our Azure VM running in the default subnet and run some tests. First, let's run nslookup and see what IP information is returned to us.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-96.png)

We are returned a public IP address. This is normal when using the service endpoints. DNS entries for Azure services remain as-is and continue to resolve to public IP addresses assigned to the Azure service.

Let's confirm we can connect to our Azure SQL instance and log on successfully. We shall do this through SQL management studio.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-97.png)

We've successfully logged on from the VM running in the default subnet. How do we check if we came from the service endpoint? We can do that by running a T-SQL command.

```T-SQL
SELECT CONNECTIONPROPERTY('client_net_address') AS client_net_address 
```

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-98.png)

This shows us that our client's IP address is 10.1.0.4. If we check what IP address this is within Azure, we can confirm it's our VM running in the default subnet.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-99.png)

After enabling a service endpoint, the source IP addresses switch from public IPv4 addresses to using their private IPv4 address when communicating with the service from that subnet.

The IP address switch only impacts service traffic from your virtual network. There's no impact on other traffic addressed to or from the public IPv4 addresses assigned to your virtual machines.

### Disable service endpoint

Let's disable the service endpoint and try connecting to the Azure SQL instance again, and this can be done by removing the virtual network rule on our Azure SQL instance and from our subnet.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-102.png)

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-110.png)

Let's test connecting again from our default subnet.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-103.png)

As you can see, we now get the below error. This confirms to us that our previous connection was using the service endpoint.  

### Allow Azure services and resources to access this server

How could we go about providing connectivity without a service endpoint? We could enable the **allow Azure services and resources to access this server.** Let's try this out and confirm if we can connect again.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-104.png)

After enabling and attempting to connect again, it started to work again.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-109.png)

Let's rerun our query and confirm our client's IP address.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/image.png)

We are now returning a public IPv4 address, and our outbound address is dynamically allocated from Azure when going outbound to the internet. This mean's we are now traversing the internet to get to our Azure SQL instance and not the service endpoint.

Let's enable the service endpoint again but only from the default subnet.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/image-1.png)

If we connect to our Azure SQL instance now and rerun the same query.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-98.png)

We returned the private IP address of the virtual machine; in this current setup, we have the following configured.

*   Service Endpoint for Microsoft.Sql enabled on the default subnet.
*   Allow Azure services and resources to access this server enabled.

What if we now disable **allowing Azure services and resources to access this server** whilst keeping the service endpoint on the default subnet enabled?

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/image-2.png)

We are presented with an error, which shows us that we don't need a specific virtual network rule on the Azure SQL instance for the service endpoint to work. Still, it's recommended to increase security and ensure that the setting Allow Azure services and resources to access this server is disabled, as this technically would allow connections from across Azure, including other customer environments, which would be very bad.

### Routing

Let's go back and reconfigure the service endpoint on the subnet and create the virtual network rule on the Azure SQL instance, the same configuration as the original environment.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-93.png)

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/12/image-95.png)

When the service endpoint has been configured on a subnet, the network interface cards within Azure get populated with different routes when going to Azure SQL resources; you can see this below.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/Untitled.jpg)

If this route weren't added, the default 0.0.0.0/0 would take priority, and SQL traffic would be routed outbound to the internet instead of coming directly from the virtual network.

If we look at nslookup again and get the public IP address of our Azure SQL instance, we can confirm the route it will take from the subnet.

```
nslookup sqlsvrtest1.database.windows.net
```

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/image-3.png)

The IP address is 51.140.144.36. Going to network watcher in Azure and looking at the next hop from the VM running in Azure shows us the following.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/Untitled1.jpg)

We can use this to confirm that traffic coming from the default subnet with the service endpoint will use the new route **VirtualNetworkServiceEndpoint** for traffic going to public IP addresses under Microsoft.Sql.

### Cost

There is no additional cost for virtual network service endpoints.

### Availability

Service endpoints are not available for every Azure service, currently they are generally available for the following services. Additonal information can be found here: [Azure virtual network service endpoints | Microsoft Learn](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-service-endpoints-overview?ref=georgeollis.com)

*   **[Azure Storage](https://learn.microsoft.com/en-us/azure/storage/common/storage-network-security?toc=/azure/virtual-network/toc.json&ref=georgeollis.com#grant-access-from-a-virtual-network)**
*   **[Azure SQL Database](https://learn.microsoft.com/en-us/azure/azure-sql/database/vnet-service-endpoint-rule-overview?toc=%2fazure%2fvirtual-network%2ftoc.json&ref=georgeollis.com)**
*   **[Azure Synapse Analytics](https://learn.microsoft.com/en-us/azure/azure-sql/database/vnet-service-endpoint-rule-overview?toc=%2fazure%2fvirtual-network%2ftoc.json&ref=georgeollis.com)**
*   **[Azure Database for PostgreSQL server](https://learn.microsoft.com/en-us/azure/postgresql/howto-manage-vnet-using-portal?toc=/azure/virtual-network/toc.json&ref=georgeollis.com)**
*   **[Azure Database for MySQL server](https://learn.microsoft.com/en-us/azure/mysql/howto-manage-vnet-using-portal?toc=/azure/virtual-network/toc.json&ref=georgeollis.com)**
*   **[Azure Database for MariaDB](https://learn.microsoft.com/en-us/azure/mariadb/concepts-data-access-security-vnet?ref=georgeollis.com)**
*   **[Azure Cosmos DB](https://learn.microsoft.com/en-us/azure/cosmos-db/how-to-configure-vnet-service-endpoint?toc=/azure/virtual-network/toc.json&ref=georgeollis.com)**
*   **[Azure Key Vault](https://learn.microsoft.com/en-us/azure/key-vault/general/overview-vnet-service-endpoints?ref=georgeollis.com)**
*   **[Azure Service Bus](https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-service-endpoints?toc=/azure/virtual-network/toc.json&ref=georgeollis.com)**
*   **[Azure Event Hubs](https://learn.microsoft.com/en-us/azure/event-hubs/event-hubs-service-endpoints?toc=/azure/virtual-network/toc.json&ref=georgeollis.com)**
*   **[Azure Data Lake Store Gen 1](https://learn.microsoft.com/en-us/azure/data-lake-store/data-lake-store-network-security?toc=/azure/virtual-network/toc.json&ref=georgeollis.com)**
*   **[Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/app-service-ip-restrictions?ref=georgeollis.com)**
*   **[Azure Cognitive Services](https://learn.microsoft.com/en-us/azure/cognitive-services/cognitive-services-virtual-networks?tabs=portal&ref=georgeollis.com)**

### Logging and troubleshooting

We can confirm if traffic is coming through a service endpoint by enabling security audit diagnostic settings on the Azure SQL instance.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/image-4.png)

All new requests with service endpoints show the source IP address for the request as the virtual network private IP address, assigned to the client making the request from your virtual network. Without the endpoint, the address is an Azure public IP address.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/01/image-7.png)

The following query was used to return this result.

```
AzureDiagnostics
| where action_name_s == "DATABASE AUTHENTICATION SUCCEEDED"
| project LogicalServerName_s, client_ip_s, action_name_s, server_principal_name_s
```

Thanks for reading this blog. If you have any questions, please feel free to reach out.

Please feel free to connect with me.

[](https://uk.linkedin.com/in/georgeollis?trk=profile-badge&ref=georgeollis.com)

