---
title: "Azure VWAN routes, propagations and labels."
description: "This blog will go over Azure VWAN routing, propagations and labels.

Our use case is simple, we have deployed Azure VWAN and one virtual hub. We have four spokes connecting to our hub. An overview can be found below.  

We want to ensure virtual machines in the blue virtual networks"
date: 2022-11-29
tags:
  - azure-networking
  - azure-virtual-wan
  - routing
canonicalUrl: "https://www.georgeollis.com/exploring-azure-vwan-routes-propagations-and-labels/"
---

# Azure VWAN routes, propagations and labels.

![Azure VWAN routes, propagations and labels.](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/size/w960/2023/01/VWAN-Routing-3.png)

This blog will go over Azure VWAN routing, propagations and labels.

Our use case is simple, we have deployed Azure VWAN and one virtual hub. We have four spokes connecting to our hub. An overview can be found below.  

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-51.png)

We want to ensure virtual machines in the blue virtual networks can't communicate with red virtual networks and vice-versa. So how do we do this?

### Associations

Each connection is associated with **one** route table. A connection in our example is our virtual networks.

Associating a connection with a route table allows the connection to reach all the routes in that route table. All VPN, ExpressRoute, and User VPN connections are associated with the same (default) route table.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-44.png)

### Propagations

Routes can be propagated to one or multiple route tables. Connections will dynamically propagate routes to a route table that you have selected.

A none route table is also available for each virtual hub. Propagating to the None route table implies that no routes must be propagated from the connection.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-45.png)

### Labels

Labels provide a way to group route tables together. This becomes especially helpful for route propagation from multiple route tables. A default label is built-in for the default route table. Every virtual hub within Azure VWAN gets a default route table and label.  

## Creating route tables

Before we create our connections to the virtual hub, let's go and make two route tables. They will be called the following.

*   **blue-route-table**
*   **red-route-table**

Click on the virtual hub you want to create a route table for. Click on route tables and select start.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-46.png)

Give the route table a name; in our example, we shall create a new route table called **blue-route-table**.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-47.png)

Next, on the labels tab, let's label the route table **blue**.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-48.png)

Once this is done, click the review and create button. Don't configure associations or propagations through this interface; we will do that with our connections. **Repeat these steps and create a red route table.**

Let us add our connections now. Go to the virtual WAN resource and, click on virtual network connections, select **add connection.**

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-49.png)

Let's call our first connection **blue-spoke01.** This connection will propagate its routes to the **blue** label and be associated with the blue-route-table we created earlier.  

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-50.png)

Repeat this step for the second blue spoke. Once completed, we should have two associated connections propagating routes to the blue-route-table.  

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-52.png)

Our blue virtual networks' IP ranges are the following.

*   vnet-blue-spoke-01 192.168.1.0/24
*   vnet-blue-spoke-02 192.168.3.0/24

We have virtual machines connected to both spokes. Let's confirm if they can communicate with each other. This can be done by viewing effective routes or sending a ping to the virtual machine.

If we look at the effective routes of linux-blue-1, which is the VM in the vnet-blue-spoke-01 network, we can see that it has a route to 192.168.3.0/24 through the virtual WAN.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-53.png)

We can also test by going to the serial console of Linux-blue-1 and attempting to ping linux-blue-2, which is in vnet-blue-spoke-02 and has the IP 192.168.3.4.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-54.png)

Now let's add the red virtual networks by repeating the same steps, an overview of what we should have now can be found below for connections.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-55.png)

It's important to note that no connections propagate routes to the default-route table.  We have disabled that functionality. If we look at effective routes now for the blue virtual machine, we should be able to confirm that we cannot see the routes for the red virtual networks. If we could see them, we should see the following prefixes.

*   vnet-red-spoke-01 192.168.2.0/24
*   vnet-red-spoke-02 192.168.4.0/24

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-58.png)

If we attempt to ping linux-blue-1 (192.168.1.4) from linux-red-1 in our vnet-red-spoke-01 virtual network, we shouldn't be able to access it. The ping request hangs as it cannot connect.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-59.png)

Our diagram can be found below.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-60.png)

We can also confirm this if we view the routes being propagated to the route tables, this can be done by going back to **Route Tables** and selecting the effective routes.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-61.png)

If we view the effective routes for the blue-route-table.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-62.png)

Viewing the red-route-table.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-63.png)

If you would like to demo and test, please find the Git repo below.   [georgeollis/Azure\_VWAN\_Routing (github.com)](https://github.com/georgeollis/Azure_VWAN_Routing?ref=georgeollis.com) This has an Azure CLI script that will implement this for you. It can also be found below.

```Azure
## for blog : https://www.georgeollis.com/exploring-azure-vwan-routes-propagations-and-labels/ 

export LOCATION=uksouth
export VWANNAME=vwan
export virtual_hub_1=hub01
export RESOURCEGROUPNAME=rg-vwan-demo-1
export virtual_hub_1_address_prefix=192.168.0.0/24

export blue_virtual_network_name_1=vnet-blue-spoke-01
export blue_virtual_network_1_address_prefix=192.168.1.0/24
export blue_virtual_network_name_2=vnet-blue-spoke-02
export blue_virtual_network_2_address_prefix=192.168.3.0/24

export red_virtual_network_name_1=vnet-red-spoke-01
export red_virtual_network_1_address_prefix=192.168.2.0/24
export red_virtual_network_name_2=vnet-red-spoke-02
export red_virtual_network_2_address_prefix=192.168.4.0/24

az group create --name $RESOURCEGROUPNAME --location $LOCATION

az network vwan create --name $VWANNAME --resource-group $RESOURCEGROUPNAME --location $LOCATION --type Standard
export vwan_resource_id=$(az network vwan list --resource-group $RESOURCEGROUPNAME --query "[?name=='$VWANNAME'].id" -o tsv)

az network vhub create --name $virtual_hub_1 --resource-group $RESOURCEGROUPNAME --address-prefix $virtual_hub_1_address_prefix --location $LOCATION --vwan $vwan_resource_id
az network vhub wait --name $virtual_hub_1 --resource-group $RESOURCEGROUPNAME --updated

az network vnet create --name $blue_virtual_network_name_1 --resource-group $RESOURCEGROUPNAME --address-prefixes $blue_virtual_network_1_address_prefix --location $LOCATION
az network vnet create --name $blue_virtual_network_name_2 --resource-group $RESOURCEGROUPNAME --address-prefixes $blue_virtual_network_2_address_prefix --location $LOCATION

az network vnet subnet create --address-prefixes $blue_virtual_network_1_address_prefix --name blue-workload-1 --resource-group $RESOURCEGROUPNAME --vnet-name $blue_virtual_network_name_1
az network vnet subnet create --address-prefixes $blue_virtual_network_2_address_prefix --name blue-workload-2 --resource-group $RESOURCEGROUPNAME --vnet-name $blue_virtual_network_name_2

az network vnet create --name $red_virtual_network_name_1 --resource-group $RESOURCEGROUPNAME --address-prefixes $red_virtual_network_1_address_prefix --location $LOCATION
az network vnet create --name $red_virtual_network_name_2 --resource-group $RESOURCEGROUPNAME --address-prefixes $red_virtual_network_2_address_prefix --location $LOCATION

az network vnet subnet create --address-prefixes $red_virtual_network_1_address_prefix --name red-workload-1 --resource-group $RESOURCEGROUPNAME --vnet-name $red_virtual_network_name_1
az network vnet subnet create --address-prefixes $red_virtual_network_2_address_prefix --name red-workload-2 --resource-group $RESOURCEGROUPNAME --vnet-name $red_virtual_network_name_2

az vm create --resource-group $RESOURCEGROUPNAME --name linux-blue-1 --location $LOCATION --image Canonical:UbuntuServer:19_10-daily-gen2:19.10.202007100 --vnet-name $blue_virtual_network_name_1 --subnet blue-workload-1 --admin-username azureuser  --admin-password Th1sIsOurDemo12345! --size standard_b2ms --public-ip-address ""
az vm create --resource-group $RESOURCEGROUPNAME --name linux-blue-2 --location $LOCATION --image Canonical:UbuntuServer:19_10-daily-gen2:19.10.202007100 --vnet-name $blue_virtual_network_name_2 --subnet blue-workload-2 --admin-username azureuser  --admin-password Th1sIsOurDemo12345! --size standard_b2ms --public-ip-address ""
az vm create --resource-group $RESOURCEGROUPNAME --name linux-red-1 --location $LOCATION --image Canonical:UbuntuServer:19_10-daily-gen2:19.10.202007100 --vnet-name $red_virtual_network_name_1 --subnet red-workload-1 --admin-username azureuser  --admin-password Th1sIsOurDemo12345! --size standard_b2ms --public-ip-address ""
az vm create --resource-group $RESOURCEGROUPNAME --name linux-red-2 --location $LOCATION --image Canonical:UbuntuServer:19_10-daily-gen2:19.10.202007100 --vnet-name $red_virtual_network_name_2 --subnet red-workload-2 --admin-username azureuser  --admin-password Th1sIsOurDemo12345! --size standard_b2ms --public-ip-address ""

az network vhub route-table create --name blue-route-table --resource-group $RESOURCEGROUPNAME --vhub-name $virtual_hub_1 --labels blue
az network vhub route-table create --name red-route-table --resource-group $RESOURCEGROUPNAME --vhub-name $virtual_hub_1 --labels red

export blue_route_table_id=$(az network vhub route-table show --name blue-route-table --resource-group $RESOURCEGROUPNAME --vhub-name $virtual_hub_1 --query "id" -o tsv)
export red_route_table_id=$(az network vhub route-table show --name red-route-table --resource-group $RESOURCEGROUPNAME --vhub-name $virtual_hub_1 --query "id" -o tsv)
export virtual_network_id_blue_01=$(az network vnet show --name $blue_virtual_network_name_1 --resource $RESOURCEGROUPNAME --query "id" -o tsv)
export virtual_network_id_blue_02=$(az network vnet show --name $blue_virtual_network_name_2 --resource $RESOURCEGROUPNAME --query "id" -o tsv)
export virtual_network_id_red_01=$(az network vnet show --name $red_virtual_network_name_1 --resource $RESOURCEGROUPNAME --query "id" -o tsv)
export virtual_network_id_red_02=$(az network vnet show --name $red_virtual_network_name_2 --resource $RESOURCEGROUPNAME --query "id" -o tsv)

az network vhub connection create --name blue-spoke01 --remote-vnet $virtual_network_id_blue_01 --resource-group $RESOURCEGROUPNAME --vhub-name $virtual_hub_1 --associated $blue_route_table_id --labels blue --internet-security false
az network vhub connection create --name blue-spoke02 --remote-vnet $virtual_network_id_blue_02 --resource-group $RESOURCEGROUPNAME --vhub-name $virtual_hub_1 --associated $blue_route_table_id --labels blue --internet-security false
az network vhub connection create --name red-spoke01 --remote-vnet $virtual_network_id_red_01 --resource-group $RESOURCEGROUPNAME --vhub-name $virtual_hub_1 --associated $red_route_table_id --labels red --internet-security false
az network vhub connection create --name red-spoke02 --remote-vnet $virtual_network_id_red_02 --resource-group $RESOURCEGROUPNAME --vhub-name $virtual_hub_1 --associated $red_route_table_id --labels red --internet-security false

        
                                  
```

If this content was helpful, please feel free to connect with me on social media at

[](https://uk.linkedin.com/in/georgeollis?trk=profile-badge&ref=georgeollis.com)

