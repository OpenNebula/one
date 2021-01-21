const cypress = require('cypress')
const marge = require('mochawesome-report-generator')
const { merge } = require('mochawesome-merge')
const { existsSync, mkdirsSync, readFileSync, writeFileSync, removeSync } = require('fs-extra')
const { dirname } = require('path')

const config = {
  browser: 'chrome',
  headless: true,
  spec: 'cypress/integration/**/*.spec.js'
}

const generateReport = (options = {
  reportDir: 'cypress/results',
  reportFilename: 'merge-results',
  saveJson: true,
  saveHtml: false,
  files: [
    './cypress/results/*.json'
  ]
}) => {
  return merge(options).then(report => marge.create(report, options))
}

const parseReport = (dataReport = '') => {
  if (dataReport && Array.isArray(dataReport) && dataReport.slice(-1).pop()) {
    const pathMergeJson = dataReport.slice(-1).pop()
    const bsname = dirname(pathMergeJson)
    const fileData = readFileSync(pathMergeJson, 'utf8')
    if (fileData) {
      const dataJSON = JSON.parse(fileData)
      const parsedJSON = {}

      // version
      parsedJSON.version = dataJSON.meta.mochawesome.version

      // examples
      const examples = []
      // results -19
      if (dataJSON.results) {
        dataJSON.results.forEach(results => {
          const pathTest = results.fullFile
          // results.suites -28
          if (results && results.suites && Array.isArray(results.suites)) {
            results.suites.forEach(suites => {
              // result.suites.tests -36
              if (suites && suites.tests && Array.isArray(suites.tests)) {
                suites.tests.forEach(test => {
                  const parsedTest = {}
                  parsedTest.id = pathTest
                  parsedTest.description = test.title || null
                  parsedTest.full_description = test.fullTitle || null
                  parsedTest.status = test.pass ? 'passed' : 'failed'
                  parsedTest.file_path = pathTest
                  parsedTest.line_number = null
                  parsedTest.run_time = test.duration || null
                  parsedTest.pending_message = null

                  if (test.fail && test.code && test.code.length) {
                    parsedTest.exception = {
                      class: test.err.message,
                      backtrace: test.err.estack && [test.err.estack],
                      message: test.code
                    }
                  }
                  examples.push(parsedTest)
                })
              }
            })
          }
        })
      }
      parsedJSON.examples = examples

      // summary
      parsedJSON.summary = {
        duration: dataJSON.stats.duration,
        example_count: dataJSON.stats.tests,
        failure_count: dataJSON.stats.failures,
        pending_count: dataJSON.stats.pending,
        errors_outside_of_examples_count: dataJSON.stats.other
      }

      // summary_line
      parsedJSON.summary_line = `${dataJSON.stats.testsRegistered} examples, ${dataJSON.stats.failures} failures`

      // clear results folder
      removeSync(bsname)

      // create path
      if (!existsSync(bsname)) {
        mkdirsSync(bsname)
      }

      // create JSON file
      writeFileSync(`${bsname}/results.json`, JSON.stringify(parsedJSON))
    }
  }
}

cypress.run(config).then(
  () => {
    generateReport().then(parseReport)
  },
  error => {
    generateReport().then(parseReport)
    console.error(error)
    process.exit(1)
  }
)
