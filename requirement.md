
Hi Heng,
Thank you again for taking the time to speak with us. As the next step in our interview process, we’d like to give you a short technical assessment to better understand your backend development skills.

This assignment is designed to be lightweight and should take approximately 2–4 hours to complete. You will have 2–3 days to finish it and submit your solution. If you need extra time, please feel free to let us know.

Assignment

Please build a small REST API for managing customers with user authentication.

Requirements

1. Authentication
Create basic user authentication with the following endpoints:

POST /register

POST /login

Requirements:

Passwords should be securely hashed

Return a JWT token (or another token-based authentication method)

2. Customers API
Create CRUD endpoints for customers:

Customer fields:

id

name

email

created_at

Endpoints:

POST /customers

GET /customers

GET /customers/:id

PUT /customers/:id

DELETE /customers/:id

All customer endpoints should require authentication.

3. Pagination
The GET /customers endpoint should support pagination, for example:

GET /customers?page=1&limit=10

4. Database
Please use a SQL database such as:

PostgreSQL

MySQL

SQLite (acceptable if easier)

You should have at least two tables:

users

customers

Tech Stack

You may use any backend language or framework you are most comfortable with (Node.js, Python, C#, Java, etc.).

Submission

Please submit:

A GitHub repository or zip file

A short README explaining:

How to run the project

Setup steps

Example API requests

Please let us know if you have any questions. We look forward to reviewing your submission.

Best regards,
DPA Tricore

Techstack
Nestjs
Prisma
Postgres from docker