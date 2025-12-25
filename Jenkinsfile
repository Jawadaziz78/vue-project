// Global variables to track status
def currentStage = 'Initialization'
def qgStatus = 'NOT_RUN' 

pipeline {
    agent any
    triggers { githubPush() }
    
    environment {
        PROJECT_TYPE  = 'vue' // Change to 'vue' or 'nextjs' as needed
        DEPLOY_HOST   = 'localhost'
        DEPLOY_USER   = 'ubuntu'
        
        // --- Slack Webhook (COMMENTED OUT) ---
        // SLACK_WEBHOOK = credentials('slack-webhook-url')
        
        GIT_CREDS     = credentials('github-https-creds') 
    }
    
    stages {
        stage('SonarQube Analysis') {
            when { branch 'test' }
            steps {
                script {
                    currentStage = STAGE_NAME 
                    withSonarQubeEnv('sonar-server') {
                        sh '''
                            export SONAR_NODE_ARGS='--max-old-space-size=2048'      
                            /home/ubuntu/sonar-scanner/bin/sonar-scanner \
                               -Dsonar.projectKey=${PROJECT_TYPE}-project \
                               -Dsonar.sources=app \
                               -Dsonar.inclusions=**/*.php
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
                    // FIX: Removed the redundant 'sh' inside the string and fixed pathing
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            set -e
                            
                            # 1. Run the external script for Prep & Cleanup
                            # We pipe the workspace deploy.sh directly to the server bash
                            bash -s < ${WORKSPACE}/deploy.sh ${BRANCH_NAME} ${PROJECT_TYPE} ${GIT_CREDS_USR} ${GIT_CREDS_PSW}

                            # 2. Your Required Manual Steps
                            cd /var/www/html/${BRANCH_NAME}/${PROJECT_TYPE}-project
                            
                            echo 'Pulling latest code from ${BRANCH_NAME}...'
                            git pull origin ${BRANCH_NAME}
                            
                            echo 'Building project...'
                            case \"${PROJECT_TYPE}\" in
                                vue) 
                                    VITE_BASE_URL=\"/vue/${BRANCH_NAME}/\" npm run build ;;
                                nextjs) 
                                    VITE_BASE_URL=\"/vue/${BRANCH_NAME}/\" npm run build
                                    pm2 restart ${PROJECT_TYPE}-${BRANCH_NAME} ;;
                                laravel) 
                                    sudo php artisan optimize ;;
                            esac
                            
                            echo '✅ Deployment Successfully Completed.'
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

                // --- Slack Notification (COMMENTED OUT) ---
                /*
                sh """
                    curl -X POST -H 'Content-type: application/json' \
                    --data '{"text":"*Project:* ${PROJECT_TYPE}\\n*Branch:* ${env.BRANCH_NAME}\\n*Result:* ${resultMsg}\\n<${env.BUILD_URL}|View Logs>"}' \
                    ${SLACK_WEBHOOK}
                """
                */
            }
        }
    }
}
