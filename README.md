# My Personal Forked Version of SNUtils
I love SNUtils and like to mess around with my own ideas for functionality. Some of the implementations are a little heavy handed for Arnoud's vision or aren't implemented with the care that they would need to be to pass muster for inclusion into the main branch so I just maintain a more wild west version of the extension for myself.

## **Additional Functionality**

**Slashcommands:**
- /clearbp - Clears all your logpoints and breakpoints and updates the code editor gutters. Works with both monaco and code mirror. 

**Features:**
- Studio Script Fix - Fixes the lazy loading of the script field failing in Studio, leaving a empty spot where the script should be if you open many records with scripts at the same time. ServiceNow's implementation tries twice then gives up and CodeMirror requires it is visible to render. This adds an observer to wait until the div is visible to instantiate CodeMirror. 
- SQL Trace - Parses the SQL Trace output from background scripts using gs.trace(). Fingerprints the SQL queries and groups them by query pattern. Useful for debugging and performance optimization. 



**SQL Trace Example Output:**

<img width="1428" alt="image" src="https://github.com/TWalkerVeracity/ServiceNow-Utils/assets/103676986/7bbc43d7-56f3-47e2-b674-38fce40ffb13">
=============================================


**SN Utils Browser Extension for ServiceNow.**
Allowed to contribute, not to republish the extension to the Chrome / FireFox / Any other Store or marketplace.
Also not allowed to use parts of the extension functionality or republish to other stores / markets as part of other services,
without prior consent of the author/owner: Arnoud Kooi.

Please open an issue to discuss new features, prior to starting development. 
PR's without prior consult may not be accepted.

**FAQ**
Question: Can I use SN Utils on non service-now.com domains?
Answer: For Chrome, download the [OnPrem](https://chrome.google.com/webstore/detail/sn-utils-onprem/lfabkiipmidkmhplochgpbaeekjjfbch) version from the webstore.
Check [arnoudkooi.com](https://www.arnoudkooi.com/) for all available versions.
