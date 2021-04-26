# sideex-runner
Siddex runner for III-devops system.

# Usage
Save your Sideex script file named `sideex.json`, then put it under `<your project root>/iiidevops/sideex`.

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
