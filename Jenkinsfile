pipeline {
    agent any
    triggers { githubPush() }
    environment {
        PROJECT_TYPE  = 'vue'
        DEPLOY_HOST   = '172.31.77.148'
        DEPLOY_USER   = 'ubuntu'
        // SLACK_WEBHOOK = credentials('slack-webhook-url')
    }
    stages {
        stage('Build and Deploy') {
            steps {
                script {
                    env.LIVE_DIR = "/var/www/html/${env.BRANCH_NAME}/${env.PROJECT_TYPE}-project"
                }
                sshagent(['deploy-server-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            set -e
                            cd ${LIVE_DIR}
                            git pull origin ${BRANCH_NAME}
                            
                            case \"${PROJECT_TYPE}\" in
                                vue)
                                    npm run build
                                    ;;
                                nextjs)
                                    npm run build
                                    pm2 restart ${PROJECT_TYPE}-${BRANCH_NAME}
                                    ;;
                                laravel)
                                    sudo php artisan optimize
                                    ;;
                            esac
                        "
                    '''
                }
            }
        }
    }
    post {
        success {
            script {
                echo "✅ Deployment Successful"
                sh """
                    curl -X POST -H 'Content-type: application/json' \
                    --data '{"text":"✅ *Deployment Successful for ${PROJECT_TYPE}*\\nBranch: ${env.BRANCH_NAME}"}' \
                    // ${SLACK_WEBHOOK}
                """
            }
        }
        failure {
            script {
                echo "❌ Deployment Failed"
                sh """
                    curl -X POST -H 'Content-type: application/json' \
                    --data '{"text":"❌ *Deployment Failed for ${PROJECT_TYPE}*\\nBranch: ${env.BRANCH_NAME}"}' \
                    // ${SLACK_WEBHOOK}
                """
            }
        }
    }
}
