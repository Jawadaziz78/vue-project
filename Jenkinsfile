pipeline {
    agent any
    triggers { githubPush() }
    
    environment {
        PROJECT_TYPE  = 'vue'
        DEPLOY_HOST   = '172.31.77.148'
        DEPLOY_USER   = 'ubuntu'
        
        // 1. Secure SonarQube Token
        SONAR_TOKEN   = credentials('sonar-token')
        
        // 2. Secure Slack Webhook (Commented out)
        // SLACK_WEBHOOK = credentials('slack-webhook-url')
    }
    
    stages {
        stage('Analysis & Deploy') {
            steps {
                script {
                    env.LIVE_DIR = "/var/www/html/${env.BRANCH_NAME}/${env.PROJECT_TYPE}-project"
                }
                sshagent(['deploy-server-key']) {
                    // One SSH session for both Analysis and Deployment
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            set -e # Stop immediately if any command fails

                            # --- STEP 1: SONARQUBE ANALYSIS ---
                            echo '--- 🔍 Starting Quality Check ---'
                            bash /home/ubuntu/run-sonar.sh ${SONAR_TOKEN} ${BRANCH_NAME}
                            
                            echo '✅ Quality Gate Passed. Proceeding to Deployment...'

                            # --- STEP 2: DEPLOYMENT ---
                            echo '--- 🚀 Starting Deployment to ${LIVE_DIR} ---'
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
                    """
                }
            }
        }
    }
    
    post {
        success {
            script {
                echo "✅ Pipeline Successful"
                // Slack Notification for Success (DISABLED)
                /*
                sh """
                    curl -X POST -H 'Content-type: application/json' \
                    --data '{"text":"✅ *Deployment Successful for ${PROJECT_TYPE}*\\nBranch: ${env.BRANCH_NAME}"}' \
                    ${SLACK_WEBHOOK}
                """
                */
            }
        }
        failure {
            script {
                echo "❌ Pipeline Failed"
                // Slack Notification for Failure (DISABLED)
                /*
                sh """
                    curl -X POST -H 'Content-type: application/json' \
                    --data '{"text":"❌ *Deployment Failed for ${PROJECT_TYPE}*\\nBranch: ${env.BRANCH_NAME}\\nCheck SonarQube or Jenkins Logs."}' \
                    ${SLACK_WEBHOOK}
                """
                */
            }
        }
    }
}
