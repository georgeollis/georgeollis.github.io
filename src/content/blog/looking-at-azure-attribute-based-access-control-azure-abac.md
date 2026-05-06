---
title: "What is Azure attribute-based access control?"
description: "ABAC is an authorisation system that allows granular access based on attributes associated with security principles, resources, etc. Allowing access through attributes provides fine-grained access controls. ABAC is built on top of traditional RBAC within Azure.

ABAC only works with storage accounts when writing this blog, which we will look"
date: 2023-02-14
tags:
  - azure-identity
  - azure-security
canonicalUrl: "https://www.georgeollis.com/looking-at-azure-attribute-based-access-control-azure-abac/"
---

# What is Azure attribute-based access control?

![What is Azure attribute-based access control?](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/size/w960/2023/02/VWAN-Routing-10.png)

ABAC is an authorisation system that allows granular access based on attributes associated with security principles, resources, etc. Allowing access through attributes provides fine-grained access controls. ABAC is built on top of traditional RBAC within Azure.

ABAC only works with storage accounts when writing this blog, which we will look at shortly. However, it would be interesting to see if this is expanded in the future.

ABAC allows you to add business logic to the access you provide. What if you have an existing project or a group of users that only need to see specific blobs within a storage account? That's now possible with ABAC.

In our example, we will set up ABAC and show how based on attributes of the storage account resource, users are limited to only seeing specific queues they have been allowed to see. We will have one storage account with three message queues.

*   CustomerA user will be able to see only the _customer-a_ queue.
*   CustomerC user will be able to see only the _customer-c_ queue.
*   Admin user will be to see all queues, including _customer-b, customer-a_ and _customer-c_ queues.  

You can see a diagram of each user scenario below. Firstly let's look at CustomerA. CustomerA has been assigned the Storage Queue Data Reader role, which has a condition only allowing them to view the customer-a queue.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/customerA.png)

Now let's look at CustomerC - this user has been assigned the Storage Queue Data Reader role but has conditions assigned only allowing them to view messages in the customer-c queue. They cannot view or access another queue.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/customerC.png)

Finally, our admin has full access. This user has only been assigned the RBAC role Storage Queue Data Reader without any conditions.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/adminCustomer.png)

With my account that has full access, I will add messages to each queue and start assigning roles for each user, and we will then test with Azure Storage Explorer. Below is an image of our test storage account.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-26.png)

Going into queues on the storage account - you will see that three queues have been created.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-27.png)

Going into a queue, you will see some test messages that are sitting in the queue.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-28.png)

Messages in the customer-a queue

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-29.png)

Messages in the customer-b queue

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-30.png)

Messages in the customer-c queue

Let's now create our role assignments and test what users can access. Firstly, I will be providing **CustomerA** with two roles; one will be the reader role on the storage account (For control-plane access), and the other one will specifically be Storage Queue Data Reader with conditions.

Head to the storage account, select access control, and click add.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-31.png)

Find the Storage Queue Data Reader role and select it. Click next.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-32.png)

On the member's tab, add the CustomerA user account to the role.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-33.png)

For roles that support ABAC - you'll notice that you get an extra tab called conditions. This is where we can provide granular access utilising specific attributes of the resource.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-34.png)

In this example, we've selected the data action to read the messages in the queue, but the attribute is the queue name, which has to equal the "customer-a" queue. If this doesn't equal that queue name, CustomerA will be blocked from viewing the messages in that queue. Select next when you are ready and deploy the role assignment.

When deployed, you can see the role assignments for the user.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-35.png)

Let's test that access works correctly by using Storage Explorer to view the messages in the queue and to review the behaviour.  

Sign into Azure through Storage Explorer using the CustomerA account.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-36.png)

Once logged in, you should be able to see Azure subscriptions and storage resources you have access to. We only have one storage account in our subscription.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-37.png)

If we expand queues in the storage account, we should see all three queues created in this account. This is because we have the reader role on that resource, which provides access to the storage account at the control-plane level.

However, it **doesn't** provide access to data within the storage account. Roles provide that with data actions allowing you to access the data within the storage account. This is typically called the data plane. Our Storage Queue Data Reader has data actions allowing users to view the messages in the queue.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-40.png)

Showing that the Storage Queue Data Reader has data actions.

Expanding the customer-a queue as the CustomerA user account, we can successfully view the messages within the queue.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-38.png)

What about the other queues? You guessed right - we can't access those at all. We get an authorisation error.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-39.png)

This fine-grained access control is now possible through ABAC. Let's do this again from the CustomerC perspective. This user should only be able to access the customer-c queue.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-41.png)

Signed in as CustomerC

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-42.png)

Viewing the customer-c queue.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-43.png)

Unable to access customer-a.

This is precisely the same outcome as CustomerA. Finally, let's test this again by assigning our admin user account the Storage Queue Data Reader **without** any conditions, and let's review the outcome.

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-44.png)

We are viewing all the queues with the admin account.  

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-45.png)

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-46.png)

![](https://storage.ghost.io/c/2a/4d/2a4d6a2d-a5fd-4dcb-a296-fc77f5539cf5/content/images/2023/02/image-47.png)

You can see that the admin account can view all the messages in each queue. In our use case, our admin account should have access to all the queues.

### Summary

Thanks for reading this blog about ABAC. Microsoft provides some great information: [What is Azure attribute-based access control (Azure ABAC)? | Microsoft Learn](https://learn.microsoft.com/en-us/azure/role-based-access-control/conditions-overview?ref=georgeollis.com)

Microsoft has three key areas where you may want to use ABAC.

*   **Provide more fine-grained access control** - A role assignment uses a role definition with actions and data actions to grant security principal permissions. You can write conditions to filter down those permissions for more fine-grained access control. You can also add conditions to specific actions. For example, you can grant John read access to blobs in your subscription only if the blobs are tagged as Project=Blue.
*   **Help reduce the number of role assignments** - Each Azure subscription currently has a role assignment limit. Some scenarios would require thousands of role assignments. All of those role assignments would have to be managed. You could add conditions to use significantly fewer role assignments in these scenarios.
*   **Use attributes with specific business meaning - Conditions allow you to use attributes with** specific business meaning to you in access control. Some examples of attributes are project name, software development stage, and classification levels. The values of these resource attributes are dynamic and change as users move across teams and projects.

Thanks for reading this blog, and if you want help or have any questions, please feel free to reach out. Remember, you can connect with me below.

[https://bio.link/georgeollis](https://bio.link/georgeollis?ref=georgeollis.com)

