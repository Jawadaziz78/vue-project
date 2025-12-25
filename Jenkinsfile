// Global variables to track status
def currentStage = 'Initialization'
def qgStatus = 'NOT_RUN' 

pipeline {
    agent any
    
    triggers { githubPush() }
    
    environment {
        PROJECT_TYPE  = 'vue' 
        DEPLOY_HOST   = 'localhost'
        DEPLOY_USER   = 'ubuntu'
        GIT_CREDS     = credentials('github-https-creds') 
        CURRENT_STAGE = 'Initialization' 
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
                    env.CURRENT_STAGE = 'Quality Gate'
                    timeout(time: 2, unit: 'MINUTES') { 
                        env.QUALITY_GATE_STATUS = waitForQualityGate(abortPipeline: true).status
                    }
                }
            }
        }

        stage('Build and Deploy') {
            steps {
                script {
                    env.CURRENT_STAGE = 'Build and Deploy'
                    if (env.BRANCH_NAME == 'test' && env.QUALITY_GATE_STATUS != 'OK') {
                        error "❌ BLOCKING DEPLOYMENT: Quality Gate status is '${env.QUALITY_GATE_STATUS}'"
                    }
                    env.LIVE_DIR = "/var/www/html/${env.BRANCH_NAME}/${env.PROJECT_TYPE}-project"
                }
            }
            steps {
                script { currentStage = STAGE_NAME }
                
                sshagent(['deploy-server-key']) {
                    // FIX: Using 'cat | ssh' pipeline to strictly avoid "No such file" errors
                    sh """
                        echo '--- 🔍 DEBUG: Listing Workspace Files ---'
                        ls -la
                        
                        echo '--- 🚀 Starting Deployment Stream ---'
                        # We pipe the local file content directly into the remote bash session
                        cat deploy.sh | ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "bash -s -- ${BRANCH_NAME} ${PROJECT_TYPE} ${GIT_CREDS_USR} ${GIT_CREDS_PSW}"

                        # Manual Steps (Executed on Remote Server)
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            set -e
                            
                            # 1. Self-Healing Code Sync
                            if [ ! -d \\"${LIVE_DIR}/.git\\" ]; then
                                echo '⚠️ Cleaning up non-git directory...'
                                sudo rm -rf \\"${LIVE_DIR}\\"
                                sudo mkdir -p \\$(dirname \\"${LIVE_DIR}\\")
                                sudo git clone -b ${BRANCH_NAME} https://${GIT_CREDS_USR}:${GIT_CREDS_PSW}@github.com/Jawadaziz78/vue-project.git \\"${LIVE_DIR}\\"
                            else
                                cd \\"${LIVE_DIR}\\"
                                sudo git checkout . 
                                sudo git pull origin ${BRANCH_NAME}
                            fi

                            cd \\"${LIVE_DIR}\\"

                            # 2. Setup
                            if ! command -v pnpm &> /dev/null; then
                                sudo npm install -g pnpm
                            fi
                            sudo rm -rf node_modules
                            sudo chown -R ubuntu:ubuntu .
                            pnpm config set ignore-scripts true
                            
                            # 3. Clean Install & Binary Fix
                            pnpm install
                            sudo find node_modules/.pnpm -name 'esbuild' -exec chmod +x {} +
                            sudo chmod -R +x node_modules/.bin
                            pnpm config set ignore-scripts false
                            pnpm rebuild esbuild

                            # 4. NUCLEAR FIX: Forced Path Injection
                            # We delete dist first to ensure no old files remain.
                            # We pass VITE_BASE_URL twice: in .env AND as an inline command variable.
                            echo '🏗️ Building ${PROJECT_TYPE} project...'
                            sudo rm -rf dist
                            echo \\"VITE_BASE_URL=/vue/${BRANCH_NAME}/\\" > .env
                            
                            echo 'Building project...'
                            case \\"${PROJECT_TYPE}\\" in
                                vue)
                                    VITE_BASE_URL=\\"/vue/${BRANCH_NAME}/\\" pnpm run build ;;
                                nextjs)
                                    VITE_BASE_URL=\\"/vue/${BRANCH_NAME}/\\" pnpm run build
                                    pm2 restart ${PROJECT_TYPE}-${BRANCH_NAME} || pm2 start pnpm --name ${PROJECT_TYPE}-${BRANCH_NAME} -- start ;;
                                laravel)
                                    php artisan migrate --force
                                    php artisan optimize ;;
                            esac

                            # 5. Permission Finalization
                            echo '🔒 Applying permissions...'
                            sudo chmod +x /var/www /var/www/html /var/www/html/${BRANCH_NAME}
                            sudo chown -R ubuntu:www-data ${LIVE_DIR}
                            sudo find ${LIVE_DIR} -type d -exec chmod 755 {} +
                            sudo find ${LIVE_DIR} -type f -exec chmod 644 {} +

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

                echo "Deployment Result: ${resultMsg}"

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
