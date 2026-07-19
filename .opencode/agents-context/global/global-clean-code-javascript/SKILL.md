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
=====================

[](#clean-code-javascript)

Table of Contents
-----------------

[](#table-of-contents)

1.  [Introduction](#introduction)
2.  [Variables](#variables)
3.  [Functions](#functions)
4.  [Objects and Data Structures](#objects-and-data-structures)
5.  [Classes](#classes)
6.  [SOLID](#solid)
7.  [Testing](#testing)
8.  [Concurrency](#concurrency)
9.  [Error Handling](#error-handling)
10.  [Formatting](#formatting)
11.  [Comments](#comments)
12.  [Translation](#translation)

Introduction
------------

[](#introduction)

[![Humorous image of software quality estimation as a count of how many expletives you shout when reading code](https://camo.githubusercontent.com/1b8ddb10767d7b731e54bc788d14003a16f5ebaa0f98488cfa7f241a935edd98/68747470733a2f2f7777772e6f736e6577732e636f6d2f696d616765732f636f6d6963732f7774666d2e6a7067)](https://camo.githubusercontent.com/1b8ddb10767d7b731e54bc788d14003a16f5ebaa0f98488cfa7f241a935edd98/68747470733a2f2f7777772e6f736e6577732e636f6d2f696d616765732f636f6d6963732f7774666d2e6a7067)

Software engineering principles, from Robert C. Martin's book [_Clean Code_](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882), adapted for JavaScript. This is not a style guide. It's a guide to producing [readable, reusable, and refactorable](https://github.com/ryanmcdermott/3rs-of-software-architecture) software in JavaScript.

Not every principle herein has to be strictly followed, and even fewer will be universally agreed upon. These are guidelines and nothing more, but they are ones codified over many years of collective experience by the authors of _Clean Code_.

Our craft of software engineering is just a bit over 50 years old, and we are still learning a lot. When software architecture is as old as architecture itself, maybe then we will have harder rules to follow. For now, let these guidelines serve as a touchstone by which to assess the quality of the JavaScript code that you and your team produce.

One more thing: knowing these won't immediately make you a better software developer, and working with them for many years doesn't mean you won't make mistakes. Every piece of code starts as a first draft, like wet clay getting shaped into its final form. Finally, we chisel away the imperfections when we review it with our peers. Don't beat yourself up for first drafts that need improvement. Beat up the code instead!

**Variables**
-------------

[](#variables)

### Use meaningful and pronounceable variable names

[](#use-meaningful-and-pronounceable-variable-names)

**Bad:**

const yyyymmdstr \= moment().format("YYYY/MM/DD");

**Good:**

const currentDate \= moment().format("YYYY/MM/DD");

**[⬆ back to top](#table-of-contents)**

### Use the same vocabulary for the same type of variable

[](#use-the-same-vocabulary-for-the-same-type-of-variable)

**Bad:**

getUserInfo();
getClientData();
getCustomerRecord();

**Good:**

getUser();

**[⬆ back to top](#table-of-contents)**

### Use searchable names

[](#use-searchable-names)

We will read more code than we will ever write. It's important that the code we do write is readable and searchable. By _not_ naming variables that end up being meaningful for understanding our program, we hurt our readers. Make your names searchable. Tools like [buddy.js](https://github.com/danielstjules/buddy.js) and [ESLint](https://github.com/eslint/eslint/blob/660e0918933e6e7fede26bc675a0763a6b357c94/docs/rules/no-magic-numbers.md) can help identify unnamed constants.

**Bad:**

// What the heck is 86400000 for?
setTimeout(blastOff, 86400000);

**Good:**

// Declare them as capitalized named constants.
const MILLISECONDS\_PER\_DAY \= 60 \* 60 \* 24 \* 1000; //86400000;

setTimeout(blastOff, MILLISECONDS\_PER\_DAY);

**[⬆ back to top](#table-of-contents)**

### Use explanatory variables

[](#use-explanatory-variables)

**Bad:**

const address \= "One Infinite Loop, Cupertino 95014";
const cityZipCodeRegex \= /^\[^,\\\\\]+\[,\\\\\\s\]+(.+?)\\s\*(\\d{5})?$/;
saveCityZipCode(
  address.match(cityZipCodeRegex)\[1\],
  address.match(cityZipCodeRegex)\[2\]
);

**Good:**

const address \= "One Infinite Loop, Cupertino 95014";
const cityZipCodeRegex \= /^\[^,\\\\\]+\[,\\\\\\s\]+(.+?)\\s\*(\\d{5})?$/;
const \[\_, city, zipCode\] \= address.match(cityZipCodeRegex) || \[\];
saveCityZipCode(city, zipCode);

**[⬆ back to top](#table-of-contents)**

### Avoid Mental Mapping

[](#avoid-mental-mapping)

Explicit is better than implicit.

**Bad:**

const locations \= \["Austin", "New York", "San Francisco"\];
locations.forEach(l \=> {
  doStuff();
  doSomeOtherStuff();
  // ...
  // ...
  // ...
  // Wait, what is \`l\` for again?
  dispatch(l);
});

**Good:**

const locations \= \["Austin", "New York", "San Francisco"\];
locations.forEach(location \=> {
  doStuff();
  doSomeOtherStuff();
  // ...
  // ...
  // ...
  dispatch(location);
});

**[⬆ back to top](#table-of-contents)**

### Don't add unneeded context

[](#dont-add-unneeded-context)

If your class/object name tells you something, don't repeat that in your variable name.

**Bad:**

const Car \= {
  carMake: "Honda",
  carModel: "Accord",
  carColor: "Blue"
};

function paintCar(car, color) {
  car.carColor \= color;
}

**Good:**

const Car \= {
  make: "Honda",
  model: "Accord",
  color: "Blue"
};

function paintCar(car, color) {
  car.color \= color;
}

**[⬆ back to top](#table-of-contents)**

### Use default parameters instead of short circuiting or conditionals

[](#use-default-parameters-instead-of-short-circuiting-or-conditionals)

Default parameters are often cleaner than short circuiting. Be aware that if you use them, your function will only provide default values for `undefined` arguments. Other "falsy" values such as `''`, `""`, `false`, `null`, `0`, and `NaN`, will not be replaced by a default value.

**Bad:**

function createMicrobrewery(name) {
  const breweryName \= name || "Hipster Brew Co.";
  // ...
}

**Good:**

function createMicrobrewery(name \= "Hipster Brew Co.") {
  // ...
}

**[⬆ back to top](#table-of-contents)**

**Functions**
-------------

[](#functions)

### Function arguments (2 or fewer ideally)

[](#function-arguments-2-or-fewer-ideally)

Limiting the amount of function parameters is incredibly important because it makes testing your function easier. Having more than three leads to a combinatorial explosion where you have to test tons of different cases with each separate argument.

One or two arguments is the ideal case, and three should be avoided if possible. Anything more than that should be consolidated. Usually, if you have more than two arguments then your function is trying to do too much. In cases where it's not, most of the time a higher-level object will suffice as an argument.

Since JavaScript allows you to make objects on the fly, without a lot of class boilerplate, you can use an object if you are finding yourself needing a lot of arguments.

To make it obvious what properties the function expects, you can use the ES2015/ES6 destructuring syntax. This has a few advantages:

1.  When someone looks at the function signature, it's immediately clear what properties are being used.
2.  It can be used to simulate named parameters.
3.  Destructuring also clones the specified primitive values of the argument object passed into the function. This can help prevent side effects. Note: objects and arrays that are destructured from the argument object are NOT cloned.
4.  Linters can warn you about unused properties, which would be impossible without destructuring.

**Bad:**

function createMenu(title, body, buttonText, cancellable) {
  // ...
}

createMenu("Foo", "Bar", "Baz", true);

**Good:**

function createMenu({ title, body, buttonText, cancellable }) {
  // ...
}

createMenu({
  title: "Foo",
  body: "Bar",
  buttonText: "Baz",
  cancellable: true
});

**[⬆ back to top](#table-of-contents)**

### Functions should do one thing

[](#functions-should-do-one-thing)



... (content truncated)

*(This skill was automatically fetched to build the default library for the AM fork.)*
