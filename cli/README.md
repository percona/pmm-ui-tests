# PMM CLI tests
Percona Monitoring and Management CLI automated tests. 


## Getting Started

* Open the _**cli**_ folder in console
* Install Node.js 12+ version and make sure npx is included
* Install project dependencies: `npm ci`
* Install "playwright": `npx playwright install`
* Install test module if required: `npm install -D @playwright/test`

this is it! tests are good to go on specified PMM Server and/or Client.

### Getting PMM server ready
  * **Setup environment for CLI tests:**  
    _coming soon_
      
  * **Run CLI tests upon remote PMM server:**  
    _coming soon_

### Running tests:
Execute command in the Project Root folder
* **run all in single thread tests:** `npx playwright test`
* **run desired groups/tags:** [see official doc](https://playwright.dev/docs/test-cli)

### Test report
* `npx playwright show-report`


## Contributing

_coming soon_ 

