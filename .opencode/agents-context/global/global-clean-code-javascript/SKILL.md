---
name: global-clean-code-javascript
description: "Clean Code concepts adapted for JavaScript. Contribute to ryanmcdermott/clean-code-javascript development by creating an account on GitHub."
---
# GitHub - ryanmcdermott/clean-code-javascript: Clean Code concepts adapted for JavaScript · GitHub

**Reference URL:** https://github.com/ryanmcdermott/clean-code-javascript

## Top Headings
- Search code, repositories, users, issues, pull requests...
- Provide feedback
- Saved searches
- ryanmcdermott/clean-code-javascript
- clean-code-javascript

- Navigation Menu
- Use saved searches to filter your results more quickly
- Folders and files
- Latest commit
- History
- Repository files navigation
- Table of Contents
- Introduction
- Variables
- Functions

## Summary
clean-code-javascript
Table of Contents

Introduction
Variables
Functions
Objects and Data Structures
Classes
SOLID
Testing
Concurrency
Error Handling
Formatting
Comments
Translation

Introduction

Software engineering principles, from Robert C. Martin's book
Clean Code,
adapted for JavaScript. This is not a style guide. It's a guide to producing
readable, reusable, and refactorable software in JavaScript.
Not every principle herein has to be strictly followed, and even fewer will be
universally agreed upon. These are guidelines and nothing more, but they are
ones codified over many years of collective experience by the authors of
Clean Code.
Our craft of software engineering is just a bit over 50 years old, and we are
still learning a lot. When software architecture is as old as architecture
itself, maybe then we will have harder rules to follow. For now, let these
guidelines serve as a touchstone by which to assess the quality of the
JavaScript code that you and your team produce.
One more thing: knowing these won't immediately make you a better software
developer, and working with them for many years doesn't mean you won't make
mistakes. Every piece of code starts as a first draft, like wet clay getting
shaped into its final form. Finally, we chisel away the imperfections when
we review it with our peers. Don't beat yourself up for first drafts that need
improvement. Beat up the code instead!
Variables
Use meaningful and pronounceable variable names
Bad:
const yyyymmdstr = moment().format("YYYY/MM/DD");
Good:
const currentDate = moment().format("YYYY/MM/DD");
⬆ back to top
Use the same vocabulary for the same type of variable
Bad:
getUserInfo();
getClientData();
getCustomerRecord();
Good:
getUser();
⬆ back to top
Use searchable names
We will read more code than we will ever write. It's important that the code we
do write is readable and searchable. By not naming variables that end up
being meaningful for understanding our program, we hurt our readers.
Make your n

*(This skill was automatically fetched to build the default library for the AM fork.)*
