pipeline {
    agent any
    triggers { githubPush() }
    
    environment {
        PROJECT_TYPE  = 'vue'
        DEPLOY_HOST   = '172.31.77.148'
        DEPLOY_USER   = 'ubuntu'
        // ❌ REMOVED: QUALITY_GATE_STATUS = 'UNKNOWN' (This was locking the variable)
        
        // Slack Webhook (Uncommented and active)
        SLACK_WEBHOOK = credentials('slack-webhook-url')
    }
    
    stages {
        stage('SonarQube Analysis') {
            steps {
                script {
                    withSonarQubeEnv('sonar-server') {
                        sh '''
                            export SONAR_NODE_ARGS='--max-old-space-size=512'      
                            /home/ubuntu/sonar-scanner/bin/sonar-scanner \
                                -Dsonar.projectKey=${PROJECT_TYPE}-project \
                                -Dsonar.sources=.
                        '''
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                script {
                    timeout(time: 2, unit: 'MINUTES') {
                        // This will create the variable dynamically now
                        env.QUALITY_GATE_STATUS = waitForQualityGate(abortPipeline: true).status
                    }
                }
            }
        }

        stage('Build and Deploy') {
            steps {
                script {
                    // Safety Check
                    if (env.QUALITY_GATE_STATUS != 'OK') {
                        error "❌ Deployment Prevented: Quality Gate status is ${env.QUALITY_GATE_STATUS}"
                    }

                    env.LIVE_DIR = "/var/www/html/${env.BRANCH_NAME}/${env.PROJECT_TYPE}-project"
                }
                
                sshagent(['deploy-server-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            set -e
                            echo '--- 🚀 Connected to Deployment Server ---'
                            
                            cd ${LIVE_DIR}
                            git pull origin ${BRANCH_NAME}
                            
                            case \"${PROJECT_TYPE}\" in
                                vue)
                                    npm run build ;;
                                nextjs)
                                    npm run build
                                    pm2 restart ${PROJECT_TYPE}-${BRANCH_NAME} ;;
                                laravel)
                                    sudo php artisan optimize ;;
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
                sh """
                    curl -X POST -H 'Content-type: application/json' \
                    --data '{"text":"✅ *Deployment Successful for ${PROJECT_TYPE}*\\nBranch: ${env.BRANCH_NAME}"}' \
                    ${SLACK_WEBHOOK}
                """
            }
        }
        failure {
            script {
                echo "❌ Pipeline Failed"
                sh """
                    curl -X POST -H 'Content-type: application/json' \
                    --data '{"text":"❌ *Deployment Failed for ${PROJECT_TYPE}*\\nBranch: ${env.BRANCH_NAME}\\nCheck SonarQube or Jenkins Logs."}' \
                    ${SLACK_WEBHOOK}
                """
            }
        }
    }
}
