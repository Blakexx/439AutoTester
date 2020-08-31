# 439TestFetcher

## Running the Code

To run, you must first install the required node modules

To do this, simply run `npm install` inside of the project directory

Finally, run the code using `node fetcher.js` in your terminal

## Configuring the Options file

Edit the `options.json` file to contain the following information:

`"projectPath"`: The absolute local path where you with the create the test files

`"testGroup"`: The name of the tests you are fetching

`"gitUrl"`: The git repo where the tests are stored

`"websiteUrl"`: The url of the website where specific tests are stored

`"testAll"`: Whether or not all tests will be fetched

`"tests"`: Only used if fetchAll == false, A list of the names of the tests you wish to fetch

`"retain"`: When the tests are completed, they are usually deleted from your hard drive. If you want to keep specific tests, put them into this list

`"testFor"`: How many times you want to run each test