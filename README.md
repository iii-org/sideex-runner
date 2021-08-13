# sideex-runner
Sideex runner for III-devops system.

# Usage
Save your Sideex script files with extension `.json`, then put it under `<your project root>/iiidevops/sideex`.
For the target URL, you must use `${target_origin}` variable.

# pipeline.yaml usage
```
- name: Test Sideex Runner
  steps:
  - applyAppConfig:
      answers:
        git.branch: ${CICD_GIT_BRANCH}
        git.commitID: ${CICD_GIT_COMMIT}
        git.repoName: ${CICD_GIT_REPO_NAME}
        git.url: ${CICD_GIT_URL}
        pipeline.sequence: ${CICD_EXECUTION_SEQUENCE}
        web.deployName: ${CICD_GIT_REPO_NAME}-${CICD_GIT_BRANCH}-serv
        web.port: 3000
      catalogTemplate: cattle-global-data:iii-dev-charts3-test-sideex
      name: ${CICD_GIT_REPO_NAME}-${CICD_GIT_BRANCH}-sdx
      targetNamespace: ${CICD_GIT_REPO_NAME}
      version: 0.1.0
    when:
      branch:
        include:
        - sideex
```

# Note
When use multiple test suite files, you can't use the same suite name in different files.
