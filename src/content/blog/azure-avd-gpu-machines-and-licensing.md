---
title: "Azure Virtual Desktop GPU Licensing - NVv3 Series Overview"
description: "This short blog will cover important information about GPU licenses, specifically around VDI (Virtual desktop infrastructure) scenarios and some things to look out for.

We will be exploring the NVv3-Series, a GPU-backed series used and recommended for Azure Virtual Desktop or other VDI solutions.

NVv3-Series

The NVv3-series virtual machines are"
date: 2022-12-20
tags:
  - azure-virtual-desktop
  - azure-infrastructure
canonicalUrl: "https://www.georgeollis.com/azure-avd-gpu-machines-and-licensing/"
---

# Azure Virtual Desktop GPU Licensing - NVv3 Series Overview

![Azure Virtual Desktop GPU Licensing - NVv3 Series Overview](/images/blog/azure-avd-gpu-machines-and-licensing/VWAN-Routing-2.png)

This short blog will cover important information about GPU licenses, specifically around VDI (Virtual desktop infrastructure) scenarios and some things to look out for.

We will be exploring the NVv3-Series, a GPU-backed series used and recommended for Azure Virtual Desktop or other VDI solutions.

## NVv3-Series

The NVv3-series virtual machines are powered by [NVIDIA Tesla M60](https://images.nvidia.com/content/tesla/pdf/188417-Tesla-M60-DS-A4-fnl-Web.pdf?ref=georgeollis.com) GPUs and NVIDIA GRID technology with Intel E5-2690 v4 CPUs and Intel Hyper-Threading Technology.

![](/images/blog/azure-avd-gpu-machines-and-licensing/image-77.png)

These virtual machines are targeted for GPU-accelerated graphics applications and virtual desktops where customers want to visualize their data, simulate results to view, work on CAD, or render and stream content. This compute series comes in three sizes.

*   Standard\_NV12s\_v3
*   Standard\_NV24s\_v3
*   Standard\_NV48s\_v3

However, these virtual machines have some licensing requirements from NVIDIA.

**_Each GPU in NVv3 instances comes with a GRID license. This license gives you the flexibility to use an NV instance as a virtual workstation for a single user, or 25 concurrent users can connect to the VM for a virtual application scenario._**

NVIDIA provides this virtual workstation and application licensing, but what does it mean for end users? (It turns out it's important to understand).

*   **Virtual Workstation Licensing** - This means a session that uses the GPU exclusively with a **professional 3D use case** with CUDA or OpenCL. An example would be using the Adobe Creative Cloud suite.
*   **Virtual Application Licensing** - This means a session with no CUDA or OpenCL usage. In both cases, it doesn’t matter if it’s an entire desktop or RemoteApp.

An example, if you were to deploy a virtual machine using the Standard\_NV12s\_v3 SKU, you would be entitled to 1 virtual workstation license or 25 virtual application licenses. This means if you were using Adobe Creative Cloud on the virtual machine, only one user would be entitled to run it because Adobe Creative Cloud would utilize the GPU, specifically CUDA or OpenCL features.

This means you would need to spin up an additional Standard\_NV12s\_v3 for another user to use the same features. However, the SKU Standard\_NV48s\_v3 comes with 4 workstation licenses, allowing you to use CUDA or OpenCL features on the same virtual machine for up to 4 users.

Thanks for reading; this was a short blog that I hope you may find helpful. You can connect with me below.

[](https://uk.linkedin.com/in/georgeollis?trk=profile-badge&ref=georgeollis.com)

