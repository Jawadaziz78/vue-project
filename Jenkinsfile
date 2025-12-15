pipeline {
    agent any
    triggers { githubPush() }
    
    environment {
        PROJECT_TYPE  = 'vue'
        DEPLOY_HOST   = '172.31.77.148'
        DEPLOY_USER   = 'ubuntu'
        BRANCH_NAME   = 'development'
        
        // Load the Slack URL securely. Ensure the ID 'slack-webhook-url' matches what you created in Jenkins.
        SLACK_WEBHOOK = credentials('slack-webhook-url')
    }

    stages {
        stage('Build & Deploy') {
            steps {
                script {
                    if (env.PROJECT_TYPE == 'vue') {
                        env.LIVE_DIR = '/var/www/html/development/vue-project'
                    } else if (env.PROJECT_TYPE == 'nextjs') {
                        env.LIVE_DIR = '/var/www/html/development/nextjs-project/web'
                    }
                }

                sshagent(['deploy-server-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            set -e
                            cd ${LIVE_DIR}
                            
                            git pull origin ${BRANCH_NAME}

                            export NVM_DIR=\\"\\$HOME/.nvm\\"
                            [ -s \\"\\$NVM_DIR/nvm.sh\\" ] && . \\"\\$NVM_DIR/nvm.sh\\"
                            
                            npm run build
                        "
                    '''
                }
            }
        }
    }

    // This block handles the notifications based on the result of the stages above
    post {
        success {
            script {
                sh """
                    curl -X POST -H 'Content-type: application/json' \
                    --data '{"text":"✅ *Deployment Successful*\\nJob: ${JOB_NAME}\\nBuild: #${BUILD_NUMBER}\\nBranch: ${BRANCH_NAME}"}' \
                    ${SLACK_WEBHOOK}
                """
            }
        }
        failure {
            script {
                sh """
                    curl -X POST -H 'Content-type: application/json' \
                    --data '{"text":"❌ *Deployment Failed*\\nJob: ${JOB_NAME}\\nBuild: #${BUILD_NUMBER}\\nPlease check console output."}' \
                    ${SLACK_WEBHOOK}
                """
            }
        }
    }
}
