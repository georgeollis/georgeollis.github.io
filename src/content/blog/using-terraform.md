---
title: "Running commands on your virtual machines using VM extensions in Terraform"
description: "<p>A shorter blog post that explores using the custom script extension for both Windows and Linux Virtual machines in Terraform. It&apos;s slightly different for both operating systems so a blog post might be a good idea.</p><p>There&apos;s going to come to a point when you start</p>"
date: 2023-05-24
tags:
  - terraform
  - azure-infrastructure
canonicalUrl: "https://www.georgeollis.com/using-terraform/"
---

![Running commands on your virtual machines using VM extensions in Terraform](/images/blog/using-terraform/cloud_clare_high_level_image.png)

A shorter blog post that explores using the custom script extension for both Windows and Linux Virtual machines in Terraform. It's slightly different for both operating systems so a blog post might be a good idea.

There's going to come to a point when you start to deploy virtual machines. You may need to create a file after the VM has been provisioned, or you may need to download a package externally; that's where you can use the custom script extension to pass in a set of commands that will run on the guest operating system.

### Windows

Below you can see the extension being used for this Windows VM. This utilises the RunCommandWindows extension. In this example, we look at creating a new directory called MySpecialFolder. Once the VM has been deployed, it will run this script and create the directory.

![Running commands on your virtual machines using VM extensions in Terraform](/images/blog/using-terraform/image-3.png)

Let's test this by running Terraform Apply and seeing the results. We can see that the extension resource will be created and was successfully provisioned.

![Running commands on your virtual machines using VM extensions in Terraform](/images/blog/using-terraform/image-4.png)

Let's head to the virtual machine and see if we can view our directory. I've decided to use the serial console instead of remoting into the VM; this is sometimes easier for management tasks that can be performed through PowerShell on Windows.

![Running commands on your virtual machines using VM extensions in Terraform](/images/blog/using-terraform/image-5.png)

From the example above, you can see that the Temp and MySpecialFolder folders were created. If you go to the virtual machine's extensions and applications tab, you'll notice that the extension has been installed.

![Running commands on your virtual machines using VM extensions in Terraform](/images/blog/using-terraform/image-6.png)

### Linux

Now let's do the same for Linx virtual machines. You'll see from the screenshot below that running the same extension on Linux is slightly different. The protected\_settings contains the property commandToExecutre, and our command has been converted into a string using the tostring() function.

![Running commands on your virtual machines using VM extensions in Terraform](/images/blog/using-terraform/image-7.png)

Let's run Terraform Plan and see the results. We can see the resource creation in the plan file.

![Running commands on your virtual machines using VM extensions in Terraform](/images/blog/using-terraform/image-8.png)

Running Terraform Apply to deploy the infrastructure is our next task, as seen below.

![Running commands on your virtual machines using VM extensions in Terraform](/images/blog/using-terraform/image-9.png)

Let's use the serial console again, but this time, check and see if our folder and file were created on the Linux VM. The file was called "file" and should have "test".

![Running commands on your virtual machines using VM extensions in Terraform](/images/blog/using-terraform/image-10.png)

We can see that worked!

### Summary

Thanks for reading this blog. Let me know if this content is valuable; I'm sure someone will find this helpful if they have a similar scenario if they need to run commands or scripts after the VM has been deployed. My socials (Twitter, Linkedin, etc.) are on the link below.

[https://bio.link/georgeollis](https://bio.link/georgeollis?ref=georgeollis.com)

