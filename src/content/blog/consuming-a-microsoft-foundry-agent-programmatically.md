---
title: "Consuming a Microsoft Foundry Agent programatically"
description: "<p>Hello everyone,</p><p>In this post, I&#x2019;ll walk through how to create prompt-based agents in Microsoft Foundry, publish them, and then consume them via Python. This approach provides a straightforward way to build agents in Foundry, publish them, and receive an API endpoint in your Foundry resource that you</p>"
date: 2025-12-04
tags:
  - azure-ai
  - microsoft-foundry
  - azure-apps
canonicalUrl: "https://www.georgeollis.com/consuming-a-microsoft-foundry-agent-programmatically/"
---

![Consuming a Microsoft Foundry Agent programatically](/images/blog/consuming-a-microsoft-foundry-agent-programmatically/Presentation1-2.png)

Hello everyone,

In this post, I’ll walk through how to create prompt-based agents in Microsoft Foundry, publish them, and then consume them via Python. This approach provides a straightforward way to build agents in Foundry, publish them, and receive an API endpoint in your Foundry resource that you can use to interact with your agent.

Because Foundry agents are built on the Responses API from OpenAI, they expose an OpenAI-compatible protocol for interacting with them.

For applications, this is available at:

```
https://{accountName}.services.ai.azure.com/api/projects/{projectName}/applications/{applicationName}/protocols/openai
```

The behaviour of the OpenAI API exposed through applications has been modified to ensure user data isolation. It is more limited than the OpenAI API served by the project endpoint. Applications currently remove the ability to provide inputs except through the `create response` call. Specifically:

*   Only the `POST /responses` API is available.
*   Other APIs, including `/conversations`, `/files`, `/vector_stores`, and `/containers`, are inaccessible.
*   The `POST /responses` call overrides `store` to `false`, preventing responses from being stored.

This means that for multi-turn conversations, the conversation history must be stored by the client.

However, this does mean you can use the OpenAI Python SDK to interact with your agent directly. In some cases, this may be exactly what you need, rather than publishing the agent and consuming it via Teams or Copilot.

I won’t be covering how to deploy Foundry in this post. If you’d like best practices on deployment, let me know. I’ll soon publish a few blog posts on standard agent setup and a new managed virtual network capability currently in private preview.

Let's go into Foindry and create our agent. Our example is using a Food Agent.

![Consuming a Microsoft Foundry Agent programatically](/images/blog/consuming-a-microsoft-foundry-agent-programmatically/image-5.png)

Let’s say, in theory, we are happy at this point to publish our agent. When we publish our agent, we will get an API endpoint that Microsoft entirely manages.

Select **Publish** at the top right → **Publish agent**.

![Consuming a Microsoft Foundry Agent programatically](/images/blog/consuming-a-microsoft-foundry-agent-programmatically/image-6.png)

Once the agent is published, you will receive two endpoints. The one we want is Responses. The Activity Protocol endpoint is used by the Azure Bot resource and is required when publishing to Microsoft Teams or Copilot.

![Consuming a Microsoft Foundry Agent programatically](/images/blog/consuming-a-microsoft-foundry-agent-programmatically/image-7.png)

If you were to go to this URL in your browser, whilst it does not support GET requests, you would see that it mentions an API key. It is important to note that when interacting with this agent, you must have the correct RBAC role over the agent to invoke it. The caller must have the Azure RBAC (Role-Based Access Control) permission `/applications/invoke/action` on the application resource. The **Azure AI User** role provides this access. API key is not supported at this time.

![Consuming a Microsoft Foundry Agent programatically](/images/blog/consuming-a-microsoft-foundry-agent-programmatically/image-8.png)

Now that we have our agent configured and set up. We can use the OpenAI SDK to call the agent. This is the code.

```Python
# filepath: Direct OpenAI compatible approach
from openai import OpenAI 
from azure.identity import AzurePowerShellCredential, get_bearer_token_provider 

openai = OpenAI(
    api_key=get_bearer_token_provider(AzurePowerShellCredential(), "https://ai.azure.com/.default"),
    base_url="https://georgeollis-1527-resource.services.ai.azure.com/api/projects/georgeollis-1527/applications/YourFoodHelperAgent/protocols/openai/responses?api-version=2025-11-15-preview",
    default_query = {"api-version": "2025-11-15-preview"}
)

response = openai.responses.create( 
  input="I have chicken, rice, and broccoli. What can I make for dinner?", 
) 

print(f"Response output: {response.output_text}")
```

Running the Python, we get the following!

![Consuming a Microsoft Foundry Agent programatically](/images/blog/consuming-a-microsoft-foundry-agent-programmatically/image-9.png)

What if we wanted it streamed instead? I have the code for that.

```Python
# filepath: Direct OpenAI compatible approach
from openai import OpenAI 
from azure.identity import AzurePowerShellCredential, get_bearer_token_provider 

openai = OpenAI(
    api_key=get_bearer_token_provider(AzurePowerShellCredential(), "https://ai.azure.com/.default"),
    base_url="https://georgeollis-1527-resource.services.ai.azure.com/api/projects/georgeollis-1527/applications/YourFoodHelperAgent/protocols/openai/responses?api-version=2025-11-15-preview",
    default_query = {"api-version": "2025-11-15-preview"}
)

response = openai.responses.create( 
  input="I have chicken, rice, and broccoli. What can I make for dinner?",
  stream=True
) 

for chunk in response:
    if chunk.type == 'response.output_text.delta':
        print(chunk.delta, end='', flush=True)
print()  
```

This is just one way to consume agents in Foundry. These are known as **prompt agents**, which can be created either through the SDK or via the portal. In cases where you need more advanced functionality, you can use **hosted agents** in Foundry, which offer a code‑first experience.

Thanks for reading this blog!

