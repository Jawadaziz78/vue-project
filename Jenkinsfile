pipeline {
    agent any
    triggers { githubPush() }
    
    environment {
        PROJECT_TYPE  = 'vue'
        // Deployment is local on this new instance
        DEPLOY_HOST   = 'localhost'
        DEPLOY_USER   = 'ubuntu'
        
        // GitHub Credentials for the automated clone logic
        GIT_CREDS     = credentials('github-https-creds') 
        
        // 1. Initialize Stage Tracker for notifications
        CURRENT_STAGE = 'Initialization' 
        
        // Slack Webhook (Commented out for now)
        // SLACK_WEBHOOK = credentials('slack-webhook-url')
    }
    
    stages {
        stage('SonarQube Analysis') {
            // Parity with GHA: Run ONLY on the test branch
            when { branch 'test' }
            steps {
                script {
                    env.CURRENT_STAGE = 'SonarQube Analysis'
                    
                    withSonarQubeEnv('sonar-server') {
                        sh '''
                            export SONAR_NODE_ARGS='--max-old-space-size=512'      
                            /home/ubuntu/sonar-scanner/bin/sonar-scanner \
                                -Dsonar.projectKey=${PROJECT_TYPE}-project \
                                -Dsonar.sources=src \
                                -Dsonar.inclusions=**/*.vue,**/*.js,**/*.ts
                        '''
                    }
                }
            }
        }

        stage('Quality Gate') {
            // Parity with GHA: Run ONLY on the test branch
            when { branch 'test' }
            steps {
                script {
                    env.CURRENT_STAGE = 'Quality Gate'
                    
                    timeout(time: 2, unit: 'MINUTES') {
                        // Returns 'OK' or 'ERROR'
                        env.QUALITY_GATE_STATUS = waitForQualityGate(abortPipeline: true).status
                    }
                }
            }
        }

        stage('Build and Deploy') {
            steps {
                script {
                    env.CURRENT_STAGE = 'Build and Deploy'
                    
                    // Safety Check: Enforce Quality Gate ONLY for 'test' branch
                    if (env.BRANCH_NAME == 'test') {
                        echo "🔍 Verifying Quality Gate for ${env.BRANCH_NAME}..."
                        if (env.QUALITY_GATE_STATUS != 'OK') {
                            error "❌ BLOCKING DEPLOYMENT: Quality Gate status is '${env.QUALITY_GATE_STATUS}'"
                        }
                    } else {
                        echo "⏩ Skipping Quality Gate check for ${env.BRANCH_NAME}."
                    }

                    env.LIVE_DIR = "/var/www/html/${env.BRANCH_NAME}/${env.PROJECT_TYPE}-project"
                }
                
                sshagent(['deploy-server-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            set -e
                            echo '--- 🚀 Starting Deployment for ${BRANCH_NAME} ---'
                            
                            # 1. Self-Healing Clone Logic
                            if [ ! -d \\"${LIVE_DIR}/.git\\" ]; then
                                echo '⚠️ Not a git repo. Performing initial clone...'
                                sudo rm -rf ${LIVE_DIR}
                                sudo mkdir -p $(dirname ${LIVE_DIR})
                                sudo git clone -b ${BRANCH_NAME} https://${GIT_CREDS_USR}:${GIT_CREDS_PSW}@github.com/Jawadaziz78/vue-project.git ${LIVE_DIR}
                            else
                                echo '✅ Repository found. Updating code...'
                                cd ${LIVE_DIR}
                                sudo git pull origin ${BRANCH_NAME}
                            fi

                            # 2. Preparation & Build
                            sudo chown -R ubuntu:ubuntu ${LIVE_DIR}
                            cd ${LIVE_DIR}
                            
                            echo 'Building project...'
                            case \"${PROJECT_TYPE}\" in
                                vue)
                                    VITE_BASE_URL=\"/${PROJECT_TYPE}/${BRANCH_NAME}/\"
                                    npm run build ;;
                                nextjs)
                                    npm run build
                                    pm2 restart ${PROJECT_TYPE}-${BRANCH_NAME} ;;
                                laravel)
                                    sudo php artisan optimize ;;
                            esac
                            echo '✅ Deployment Successfully Completed.'
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
                /* sh """
                    curl -X POST -H 'Content-type: application/json' \
                    --data '{"text":"✅ *Deployment Successful*\\n📂 Project: ${PROJECT_TYPE}\\n🌿 Branch: ${env.BRANCH_NAME}\\n🚀 Status: Live"}' \
                    ${SLACK_WEBHOOK}
                """
                */
            }
        }
        failure {
            script {
                echo "❌ Pipeline Failed"
                /*
                sh """
                    curl -X POST -H 'Content-type: application/json' \
                    --data '{"text":"❌ *Pipeline Failed*\\n📂 Project: ${PROJECT_TYPE}\\n🌿 Branch: ${env.BRANCH_NAME}\\n💥 Failed Stage: *${env.CURRENT_STAGE}*\\n🔍 Action: Check Jenkins Console Logs."}' \
                    ${SLACK_WEBHOOK}
                """
                */
            }
        }
    }
}
