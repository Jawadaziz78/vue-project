pipeline {
    agent any
     triggers { githubPush() }
    
    environment {
        PROJECT_TYPE  = 'vue'
        DEPLOY_HOST   = '172.31.77.148'
        DEPLOY_USER   = 'ubuntu'
        SLACK_WEBHOOK = credentials('slack-webhook-url')
    }

    stages {
        stage('Build and Deploy') {
            steps {
                script {
                    if (env.PROJECT_TYPE == 'vue') {
                        env.LIVE_DIR = "/var/www/html/${env.BRANCH_NAME}/vue-project"
                    } 
                    else if (env.PROJECT_TYPE == 'laravel') {
                        env.LIVE_DIR = "/var/www/html/${env.BRANCH_NAME}/django-project"
                    } 
                    else {
                        env.LIVE_DIR = "/var/www/html/${env.BRANCH_NAME}/nextjs-project/web"
                    }

                    env.PM2_APP = "${env.PROJECT_TYPE}-${env.BRANCH_NAME}"
                }

                sshagent(['deploy-server-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            set -e
                            cd ${LIVE_DIR}
                            
                            git pull origin ${BRANCH_NAME}

                            export NVM_DIR="/home/ubuntu/.nvm"
                            [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"
                            
                            if [ \"${PROJECT_TYPE}\" = \"vue\" ]; then
                                npm run build
                            elif [ \"${PROJECT_TYPE}\" = \"nextjs\" ]; then
                                npm run build
                                pm2 restart ${PM2_APP}
                            elif [ \"${PROJECT_TYPE}\" = \"laravel\" ]; then
                                sudo php artisan optimize
                            fi
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
                
                // Slack notification for success
                sh """
                    curl -X POST -H 'Content-type: application/json' \
                    --data '{"text":"✅ *Deployment Successful for ${PROJECT_TYPE}*\\nBranch: ${env.BRANCH_NAME}"}' \
                    ${SLACK_WEBHOOK}
                """
            }
        }
        failure {
            script {
                echo "❌ Deployment Failed"
                
                // Slack notification for failure
                sh """
                    curl -X POST -H 'Content-type: application/json' \
                    --data '{"text":"❌ *Deployment Failed for ${PROJECT_TYPE}*\\nBranch: ${env.BRANCH_NAME}"}' \
                    ${SLACK_WEBHOOK}
                """
            }
        }
    }
}
