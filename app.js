const fetch = require('node-fetch')
const {URLSearchParams} = require('url')
const parse = require('url-parse')
const fs = require('fs')
const {spawn, execSync} = require("child_process")

const STORAGE_PREFIX = 'repo/iiidevops/sideex/'

const git = {
    url: process.env['git_url'],
    pUrl: parse(process.env['git_url']),
    branch: process.env['git_branch'],
    commit_id: process.env['git_commit_id']
}
const verbose = process.env['verbose'] === 'true'
const global = {
    jwtToken: null,
    repoId: -1,
    projectId: -1,
    total: 0,
    failed: 0,
    report: {}
}

if (verbose) {
    console.log('Log into API server...')
}

try {
    (async () => {
        await login()
        if (await checkPluginDisabled('sideex')) {
            console.log('Sideex plugin is disabled.')
            return
        }
        console.log('Mention API Server test started.')
        const testId = await mentionStart()

        console.log(`Test id is ${testId} , starting Selenium...`)
        const selenium = spawn('java', ['-jar', 'selenium-server-standalone-3.141.59.jar'])
        try {
            await waitSeleniumUp(1)
        } catch (err) {
            console.log('Selenium is not up in 30 seconds!')
            process.exit(1)
        }

        const targetOrigin = process.env['target_origin']
        console.log('Generating variables.json, target_origin=' + targetOrigin)
        fs.writeFileSync('variables.json',
            `{ "target_origin": "${targetOrigin}" }`)

        console.log('Inserting test suites...')
        const config = JSON.parse(fs.readFileSync('config.json'))
        const testSuites = []
        const suites = fs.readdirSync(STORAGE_PREFIX)
        for (const file of suites) {
            if (file.endsWith('.json')) {
                testSuites.push(STORAGE_PREFIX + file)
            }
        }
        config.input.testSuites = testSuites
        fs.writeFileSync('config.json', JSON.stringify(config))

        console.log('Running Sideex...')
        fs.rmdirSync("report", {recursive: true})
        fs.mkdirSync('report')
        execSync('sideex-runner --config config.json', {stdio: 'inherit'})
        console.log('Uploading result...')
        let reportHTML = null
        let reportJSON = null
        // Should only have one html and one json report file
        const files = fs.readdirSync('report')
        files.forEach(file => {
            if (file.endsWith('.html')) {
                reportHTML = `report/${file}`
            }
            if (file.endsWith('.json')) {
                reportJSON = `report/${file}`
            }
        })
        selenium.kill()
        if (!reportHTML) {
            console.log('Cannot find report file!')
            process.exit(1)
        }

        const data = fs.readFileSync(reportJSON, 'utf-8')
        const report = fs.readFileSync(reportHTML, 'utf-8')
        const result = analyze(data)
        console.log('Uploading to API server...')
        await mentionFinish(testId, JSON.stringify(result), report)
        console.log('Job done.')
    })()
} catch (e) {
    process.exit(1)
}

function login() {
    return new Promise((resolve, reject) => {
        apiPost('/user/login', null, {
            username: process.env['username'],
            password: process.env['password']
        }).then(json => {
            global.jwtToken = json.data.token
            if (verbose) console.log('Retrieving repo_id...')
            apiGet(`/repositories/id?repository_url=${git.url}`)
                .then(json => {
                    global.projectId = json.data.project_id
                    global.repoId = json.data.repository_id
                    if (verbose) console.log('repo_id is ' + global.repoId)
                    resolve()
                })
        })
    })
}

async function checkPluginDisabled(pluginName) {
    const data = (await apiGet('/plugins')).data
    for (const d of data) {
        if (d.name === pluginName) {
            return d.disabled
        }
    }
    return false
}

async function mentionStart() {
    const json = await apiPost('/sideex', null, {
        project_name: process.env['project_name'],
        branch: process.env['git_branch'],
        commit_id: process.env['git_commit_id'],
    })
    return json.data.test_id
}

function waitSeleniumUp(trial) {
    return new Promise((resolve, reject) => {
        console.log('Waiting for selenium to be up, trail ' + trial)
        if (trial > 30) {
            reject()
            return
        }
        setTimeout(async function () {
            const result = await checkSelenium()
            if (result) {
                resolve()
            } else {
                try {
                    await waitSeleniumUp(trial + 1)
                    resolve()
                } catch (err) {
                    reject()
                }
            }
        }, 1000)
    })
}

async function checkSelenium() {
    try {
        const res = await fetch('http://localhost:4444', {method: 'GET'})
        return true
    } catch (err) {
        return false
    }
}

async function mentionFinish(test_id, result, report) {
    await apiPut(
        `/sideex`,
        null,
        {test_id, result, report}
    )
}

function analyze(data) {
    const json = JSON.parse(data)
    const ret = {
        suitesPassed: json.successSuiteNum,
        suitesTotal: json.failureSuiteNum + json.successSuiteNum,
        casesPassed: json.successCaseNum,
        casesTotal: json.failureCaseNum + json.successCaseNum,
        suites: {}
    }
    for (const suite of json.suites) {
        const title = suite.title
        const result = {
            passed: 0,
            total: 0,
        }
        for (const caseIndex of suite.cases) {
            let passed = true
            for (const record of json.cases[caseIndex].records) {
                if (record.status === 'fail') {
                    passed = false
                    break
                }
            }
            if (passed) {
                result.passed++
            }
            result.total++
            ret.suites[title] = result
        }
    }
    return ret
}

// ----------------- API functions -----------------

function apiGet(path, headers) {
    return new Promise((resolve, reject) => {
        if (!headers) {
            headers = {}
        }
        headers['Authorization'] = `Bearer ${global.jwtToken}`
        const opts = {headers}
        fetch(process.env['api_origin'] + path, opts)
            .then(res => res.json())
            .then(json => resolve(json))
            .catch(err => console.error(err))
    })
}

function apiPost(path, headers, body) {
    return new Promise((resolve, reject) => {
        if (!headers) {
            headers = {}
        }
        headers['Authorization'] = `Bearer ${global.jwtToken}`
        const params = new URLSearchParams()
        for (let key in body) {
            params.append(key, body[key])
        }
        const opts = {method: 'POST', headers, body: params}
        fetch(process.env['api_origin'] + path, opts)
            .then(res => res.json())
            .then(json => resolve(json))
            .catch(err => console.error(err))
    })
}

function apiPut(path, headers, body) {
    return new Promise((resolve, reject) => {
        if (!headers) {
            headers = {}
        }
        headers['Authorization'] = `Bearer ${global.jwtToken}`
        const params = new URLSearchParams()
        for (let key in body) {
            params.append(key, body[key])
        }
        const opts = {method: 'PUT', headers, body: params}
        fetch(process.env['api_origin'] + path, opts)
            .then(res => res.json())
            .then(json => resolve(json))
            .catch(err => console.error(err))
    })
}
