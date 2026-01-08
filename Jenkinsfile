def currentStage = 'Initialization'
def qgStatus = 'NOT_RUN' 

pipeline {
    agent any
    triggers { githubPush() }
    
    environment {
        PROJECT_TYPE  = 'vue' // Change to 'vue', 'nextjs', or 'laravel' as needed
        DEPLOY_HOST   = '44.220.124.99'
        DEPLOY_USER   = 'ubuntu'
        GIT_CREDS     = credentials('dev-jawad') 
        
        // --- Slack Webhook (COMMENTED OUT) ---
        SLACK_WEBHOOK = credentials('slack-webhook-url')
    }
    
    stages {
        stage('SonarQube Analysis') {
            when { branch 'test' }
            steps {
                script {
                    currentStage = STAGE_NAME 
                    withSonarQubeEnv('sonar-server') {
                        sh '''
                            export SONAR_NODE_ARGS='--max-old-space-size=512'      
                            /home/ubuntu/sonar-scanner/bin/sonar-scanner \
                               -Dsonar.projectKey=${PROJECT_TYPE}-project \
                               -Dsonar.sources=src \
                               -Dsonar.inclusions=**/*.js,**/*.vue,**/*.ts
                        '''
                    }
                }
            }
        }

        stage('Quality Gate') {
            when { branch 'test' }
            steps {
                script {
                    currentStage = STAGE_NAME
                    timeout(time: 3, unit: 'MINUTES') {
                        def qg = waitForQualityGate(abortPipeline: true)
                        qgStatus = qg.status
                        if (qgStatus != 'OK') {
                            error "BLOCKING DEPLOYMENT: Quality Gate status is '${qgStatus}'."
                        }
                    }
                }
            }
        }

        stage('Build and Deploy') {
            when {
                anyOf {
                    branch 'test'
                    branch 'development'
                    branch 'stage'
                }
            }
            steps {
                script { currentStage = STAGE_NAME }
                
                sshagent(['deploy-server-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            set -e
                            
                            # Navigate to the project folder using env.BRANCH_NAME
                            cd /var/www/html/${env.BRANCH_NAME}/${PROJECT_TYPE}-project
                            
                            echo 'Pulling latest code from ${env.BRANCH_NAME}...'
                            git pull origin ${env.BRANCH_NAME}
                            
                            echo 'Building project...'
                            case \\"${PROJECT_TYPE}\\" in
                                vue) 
                                    echo 'Deploying Vue via Docker Compose for ${env.BRANCH_NAME}...'
                                    # Jenkins environment variables are passed to the shell automatically
                                    docker compose up -d --build vue-app 
                                    ;;
                                    
                                nextjs) 
                                    VITE_BASE_URL=\\"/vue/${env.BRANCH_NAME}/\\" npm run build
                                    pm2 restart ${PROJECT_TYPE}-${env.BRANCH_NAME} ;;
                                laravel) 
                                    sudo php artisan optimize  ;;
                            esac
                            
                            echo '✅ Deployment Successfully Completed for ${env.BRANCH_NAME}.'
                        "
                    """
                }
            }
        } 
    } 
    
    post {
        always {
            script {
                def resultMsg = ""
                def jobResult = currentBuild.currentResult 

                if (env.BRANCH_NAME == 'test') {
                    if (qgStatus == 'OK') {
                        resultMsg = (jobResult == 'SUCCESS') ? "Quality Gate PASSED and Deployment DONE" : "Quality Gate PASSED and Deployment FAILED at stage: ${currentStage}"
                    } else {
                        resultMsg = "Gate ${qgStatus} + Deployment NOT DONE because Quality Gate did not pass."
                    }
                } else {
                    resultMsg = (jobResult == 'SUCCESS') ? "Deployment DONE for ${env.BRANCH_NAME} successfully" : "Deployment FAILED for ${env.BRANCH_NAME} at stage: ${currentStage}"
                }

                echo "Deployment Result: ${resultMsg}"
                
                // --- Slack Notification (UNCOMMENTED) ---
                sh """
                    curl -X POST -H 'Content-type: application/json' \
                    --data '{"text":"*Project:* ${PROJECT_TYPE}\\n*Branch:* ${env.BRANCH_NAME}\\n*Result:* ${resultMsg}\\n<${env.BUILD_URL}|View Logs>"}' \
                    ${SLACK_WEBHOOK}
                """
            }
        }
    }
}
