pipeline {
    agent any
    triggers { githubPush() }
    
    environment {
        PROJECT_TYPE  = 'vue'
        DEPLOY_HOST   = '172.31.78.78'
        DEPLOY_USER   = 'ubuntu'
        
        // SLACK_WEBHOOK = credentials('slack-webhook-url')
    }
    
    stages {
        
        stage('SonarQube Analysis') {
            steps {
                script {
                  
                    withSonarQubeEnv('sonar-server') {
                        sh '''
                            # Use this to prevent crashing
                            export SONAR_NODE_ARGS='--max-old-space-size=3072'
                            
                            # 2. Run your existing Scanner directly
                            /home/ubuntu/sonar-scanner/bin/sonar-scanner \
                                -Dsonar.projectKey=vue-project \
                                -Dsonar.sources=.
                        '''
                    }
                }
            }
        }

        stage('Build and Deploy') {
            steps {
                script {
                    env.LIVE_DIR = "/var/www/html/${env.BRANCH_NAME}/${env.PROJECT_TYPE}-project"
                }
                sshagent(['deploy-server-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            set -e
                            echo '--- Starting Deployment ---'
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
                echo "✅ Pipeline Successful"
                // Slack Notification (Disabled)
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
                // Slack Notification (Disabled)
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
