---
title: "Exploring Workspace Data Transformations in Azure Monitor"
description: "In a previous blog, we looked at using Data Transformation Rules with the Azure Monitor Agent; this blog can be viewed here: Exploring AMA Data Collection Transformations in Azure Monitor (georgeollis.com)

However, how do we set up transformations for data that isn't ingested through an agent? That's where workspace"
date: 2022-11-30
tags:
  - azure-monitor
canonicalUrl: "https://www.georgeollis.com/exploring-workspace-data-transformations-in-azure-monitor/"
---

30 Nov 2022 4 min read

# Exploring Workspace Data Transformations in Azure Monitor

![Exploring Workspace Data Transformations in Azure Monitor](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/size/w960/2022/11/DCR-Workspace.png)

In a previous blog, we looked at using Data Transformation Rules with the Azure Monitor Agent; this blog can be viewed here: [Exploring AMA Data Collection Transformations in Azure Monitor (georgeollis.com)](https://www.georgeollis.com/exploring-data-collection-transformations-in-azure-monitor/)

However, how do we set up transformations for data that isn't ingested through an agent? That's where workspace data transformations come in. Firstly, Microsoft provides a helpful guide here on how they work. [Data collection transformations - Azure Monitor | Microsoft Learn](https://learn.microsoft.com/en-us/azure/azure-monitor/essentials/data-collection-transformations?ref=georgeollis.com#workspace-transformation-dcr)

To view a list of supported tables, visit the link here: [Tables that support ingestion-time transformations in Azure Monitor Logs (preview) - Azure Monitor | Microsoft Learn](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/tables-feature-support?ref=georgeollis.com)

However, let's explore further and set them up together. Firstly, below you should see a high-level diagram of how this works.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-64.png)

The workspace transformation DCR is a special DCR applied directly to a Log Analytics workspace. Using data transformations in the workspace can have several benefits for the data.

*   Reduce costs by filtering unwanted data being ingested into the workspace.
*   Remove sensitive values being ingested through logs.
*   Enrich data that may benefit the organisation.

So how do we set this up? Firstly, you must check that the table you want to use is supported. After that, you should have an existing Log Analytics Workspace deployed.

The table we have selected is the SignInLogs table that is coming from Azure Active Directory.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-65.png)

Let's confirm that our diagnostic settings from Azure Active Directory are going to the correct Log Analytics Workspace. This can be done by going to Azure Active Directory and clicking **diagnostic settings.**

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-66.png)

Once confirmed, let's go to the Log Analytics Workspace and ensure that the data is being ingested. This small query below will return all sign-in activity from the last hour.

```
SignInLogs
| where TimeGenerated > ago(1h)
```

We can confirm we see data.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-68.png)

Let's say our use case is simple, we want to ingest the data into the workspace, but we want to transform it, so it only shows the following columns.

*   TimeGenerated
*   Identity
*   Operating System

An example of the table can be found below.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-69.png)

This can be done with the data being ingested already. But what if we only want this data to be ingested, and we never want to see the other columns?

With the raw data currently being ingested, we can get all the necessary information by running this query.

```
SigninLogs
| where TimeGenerated > ago(1h)
| extend operatingSystem_CF = DeviceDetail.operatingSystem
| project Identity, operatingSystem_CF, TimeGenerated
```

However, for example, the operatingSystem property is nested within the DeviceDetail object. What if we never wanted to run the query without the extend operator? We want the operatingSystem always to have its column. This is where the power of DCR transformations comes in!

Let's go ahead and set one up. Go over to the Log Analytics Workspace and click on tables.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-70.png)

Search for the SignInLogs table, right-click on the table and then click **create transformation.**

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-71.png)

Open the transformation editor and submit your transformation and preview the data. Ensure you are happy with how the data looks. As previously mentioned, we are simply creating a new column called operatingSystem\_CF and removing columns which should leave us with **identity, operatingSystem\_CF** and **TimeGenerated.**

**New columns being generated need to end with CF at the end. This is why you see operatingSystem\_CF.**

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-73.png)

Note: the keyword **source** is used in the transformation instead of the table name. Don't get confused with this; whatever table you selected to be transformed from the previous step is the table that will be transformed. The data collection rule needs to identify the table this way.

Once you are happy, click apply and save the changes. This will create a data collection rule for you and be linked to the workspace. You can view the data collection rule in the portal.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-74.png)

If you click on the data collection rule and the export template button, you can view the transformation being applied by the DCR.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-75.png)

How awesome is this? Let's go ahead and now confirm this is working for new data being ingested in the SignInLogs table.

We can now see the data being ingested!

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-76.png)

It's important to note that some columns, such as the tenantId and type, will still be visible when we query. However, the columns that would usually be visible are no longer being ingested.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2022/11/image-78.png)

This was a quick overview of how workspace data collection rules and transformations work! Hopefully, this is useful. I see this becoming very powerful in helping parse raw custom logs that are ingested, usually from third-party appliances such as Cisco Meraki, which are generally used with Microsoft Sentinel.

If you have any questions - please feel free to reach out. Thanks for reading.

