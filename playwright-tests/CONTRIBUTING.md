# Contributing

### Project Licenses

- All modules use [Apache License v2.0](LICENSE.md).

## Coding Conventions

### Naming Conventions

* **Acronyms**  
  Whenever an acronym is included as part of a type name or method name, keep the first
letter of the acronym uppercase and use lowercase for the rest of the acronym. Otherwise,
it becomes potentially very difficult to read or reason about the element without
reading documentation (if documentation even exists).   

  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Consider for example a use case needing to support an HTTP URL. Calling the method
`getHTTPURL()` is absolutely horrible in terms of usability; whereas, `getHttpUrl()` is
great in terms of usability. The same applies for types `HTTPURLProvider` vs
`HttpUrlProvider`.  
|  
  Whenever an acronym is included as part of a field name or parameter name:
  * If the acronym comes at the start of the field or parameter name, use lowercase for the entire acronym, ex: `url;`
  * Otherwise, keep the first letter of the acronym uppercase and use lowercase for the rest of the acronym, ex: `baseUrl;`


* **Methods.**   
  Methods should be named as actions  with camelCase (changeSorting, changeGrouping, etc..)
  * use "change" instead of "apply" for methods
  * add postfix "Locator" for each method that returns locator


* **Assertion methods.**  
  Assertion methods should start with ‘verify’ This will add more readability into our code and simplify search of the assertion


* **Test Files.**   
  Test files should be named with camelCase.

### Locators

* **Locators outside of a test.**   
  This is a bad practice to use hard coded locators inside a test. All locators should ‘live’ inside a [Page Object](https://codecept.io/pageobjects/)


* **Try to use stable locators.**   
  Ideally there should exist a dedicated attribute for each interactive element (“data-qa” attribute). But id, classname, text also used frequently. (try to use small xpath)


* **Locators preference: locate() > CSS > Xpath**  
  Try to use `locate()` builder as a first priority, and only then CSS. Use XPath as a last stand. 

### Assertions

* **coming soon...**  


### Test Files

* **One feature per spec File.**  

### Scenario

* **Scenario title should contain Test Case ID.**  
  In order to make searching for a test much easier we could add the original Test Case ID from TMT.


* **Scenario title template.**  
 {TEST_CASE_ID} Title {annotation}

### Annotations

* **Add a test to some Group if needed.**  
  Add annotations for the test in the end on test Title. For ex. “Open Remote Instance Page and Add mysql instances @pmm-pre-update"