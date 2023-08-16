# How to run Portal tests locally

## Environment setup guide

### Run PMM Server with portal arguments  

* **Use prepared docker-compose**   
  Methods should be named as actions  with camelCase (changeSorting, changeGrouping, etc..)
  * use "change" instead of "apply" for methods
  * add postfix "Locator" for each method that returns locator


* **Run docker container manually**  
  Assertion methods should start with ‘verify’ This will add more readability into our code and simplify search of the assertion


* **Test Files.**   
  Test files should be named with camelCase and end with _test. Ending is mandatory. TBD - Roman

### Locators

* **Locators outside of a test.**   
  This is a bad practice to use hard coded locators inside a test. All locators should ‘live’ inside a [Page Object](https://codecept.io/pageobjects/)


* **Try to use stable locators.**   
  Ideally there should exist a dedicated attribute for each interactive element (“data-qa” attribute). But id, classname, text also used frequently. (try to use small xpath)


* **Locators preference: locate() > CSS > Xpath**  
  Try to use `locate()` builder as a first priority, and only then CSS. Use XPath as a last stand. 
