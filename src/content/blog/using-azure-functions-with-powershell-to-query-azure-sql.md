---
title: "Using Azure Functions with PowerShell to query Azure SQL"
description: "<p>(This blog has been in my drafts since 2022, but I thought it was worth posting!) - Yes, Azure Functions running PowerShell can query an Azure SQL database. This blog is not a production-ready implementation, but it covers the core areas of how you would do this. </p><p>Initially, an overview</p>"
date: 2024-11-25
tags:
  - azure-apps
  - azure-functions
  - azure-sql
canonicalUrl: "https://www.georgeollis.com/using-azure-functions-with-powershell-to-query-azure-sql/"
---

![Using Azure Functions with PowerShell to query Azure SQL](/images/blog/using-azure-functions-with-powershell-to-query-azure-sql/ppt4149.pptm-----AutoRecovered.png)

(This blog has been in my drafts since 2022, but I thought it was worth posting!) - Yes, Azure Functions running PowerShell can query an Azure SQL database. This blog is not a production-ready implementation, but it covers the core areas of how you would do this.

Initially, an overview of what we will be doing can be seen in the below design.

![Using Azure Functions with PowerShell to query Azure SQL](/images/blog/using-azure-functions-with-powershell-to-query-azure-sql/ddddd.png)

What you will need to start is the following.

*   Azure SQL database.
*   Data within the database - AdventureWorks can be used as a sample data set.
*   Azure Function with the PowerShell core runtime configured.

Once this is in place, you must enable a managed identity on the Azure Function App. We will use this to authenticate and retrieve our data in the database.

Once this is in place, you must log on to the Azure SQL database as an administrator. **Note** that it needs to be a user account in Microsoft Entra; it cannot be an SQL user.

Once logged in, run the following command on your selected database. This will create the user account in SQL for the managed identity and provide the db\_datareader role.

```T-SQL
CREATE USER [*NAME OF MANAGED IDENTITY*] FROM EXTERNAL PROVIDER;

EXEC sp_addrolemember 'db_datareader', '*NAME OF MANAGED IDENTITY*';
```

```
using namespace System.Net

# Input bindings are passed in via param block.
param($Request, $TriggerMetadata)

# Get MSI AUTH

$endpoint = $env:MSI_ENDPOINT
$secret = $env:MSI_SECRET
$sqlTokenURI = "https://database.windows.net/&api-version=2017-09-01"
$header = @{'Secret' = $secret}
$authenticationResult = Invoke-RestMethod -Method Get -Headers $header -Uri ($endpoint +'?resource=' +$sqlTokenURI)
$access_token = $authenticationResult.access_token

$sqlCommand = Invoke-Sqlcmd -ServerInstance sqlsvrgollis.database.windows.net -Database adventureworks -AccessToken $access_token -query 'SELECT TOP (1) [Name],[SalesTaxRateID], [StateProvinceID] FROM [Sales].[SalesTaxRate]'
$searchQuery = $sqlCommand | select name, stateprovinceid

# Associate values to output bindings by calling 'Push-OutputBinding'.
Push-OutputBinding -Name Response -Value ([HttpResponseContext]@{
    StatusCode = [HttpStatusCode]::OK
    Body = $searchQuery
})
```

requirements.ps1 file

```
# This file enables modules to be automatically managed by the Functions service.
# See https://aka.ms/functionsmanageddependency for additional information.
#
@{
    # For latest supported version, go to 'https://www.powershellgallery.com/packages/Az'. 
    # To use the Az module in your function app, please uncomment the line below.
    'Az.Accounts' = '2.10.2'
    'SQLSERVER' = '21.1.18245'
}
```

Managed identity provides read access to the database

```
CREATE USER [Azure_AD_principal_name] FROM EXTERNAL PROVIDER;

EXEC sp_addrolemember 'db_datareader', 'Azure_AD_principal_name';
```

Once complete, you can send HTTP requests to the Azure Function, which will query the needed data.

Thanks for reading this quick blog. I'll have some new ones soon.

Thanks! George.

