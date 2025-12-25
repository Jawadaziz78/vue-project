pipeline {
    agent any
    triggers { githubPush() }
    
    environment {
        PROJECT_TYPE  = 'vue'
        DEPLOY_HOST   = 'localhost'
        DEPLOY_USER   = 'ubuntu'
        
        // 1. Initialize Stage Tracker
        CURRENT_STAGE = 'Initialization' 
        
        // Slack Webhook (Commented out for now)
        // SLACK_WEBHOOK = credentials('slack-webhook-url')
    }
    
    stages {
        stage('SonarQube Analysis') {
            // Logic: This step runs ONLY on the test branch
            when {
                branch 'test'
            }
            steps {
                script {
                    // 2. Update Tracker
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
            // Logic: This step runs ONLY on the test branch
            when {
                branch 'test'
            }
            steps {
                script {
                    // 2. Update Tracker
                    env.CURRENT_STAGE = 'Quality Gate'
                    
                    timeout(time: 2, unit: 'MINUTES') {
                        // This handles the "Quality Gate Decision" logic from GHA
                        env.QUALITY_GATE_STATUS = waitForQualityGate(abortPipeline: true).status
                    }
                }
            }
        }

        stage('Build and Deploy') {
            // Logic: 
            // 1. On 'test': Runs only if Quality Gate status is 'OK' (PASSED).
            // 2. On 'development' or 'stage': Runs directly (skips Sonar logic).
            steps {
                script {
                    // 2. Update Tracker
                    env.CURRENT_STAGE = 'Build and Deploy'
                    
                    // Safety Check: Enforce Quality Gate ONLY for 'test' branch
                    if (env.BRANCH_NAME == 'test') {
                        echo "🔍 Verifying Quality Gate for ${env.BRANCH_NAME}..."
                        if (env.QUALITY_GATE_STATUS != 'OK') {
                            error "❌ BLOCKING DEPLOYMENT: Quality Gate status is '${env.QUALITY_GATE_STATUS}'"
                        } else {
                            echo "✅ Quality Gate PASSED. Proceeding to deployment..."
                        }
                    } else {
                        echo "⏩ Skipping Quality Gate check for ${env.BRANCH_NAME} (Development/Stage flow)."
                    }

                    env.LIVE_DIR = "/var/www/html/${env.BRANCH_NAME}/${env.PROJECT_TYPE}-project"
                }
                
                sshagent(['deploy-server-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            set -e
                            echo '--- 🚀 Starting Deployment for ${BRANCH_NAME} ---'
                            
                            cd ${LIVE_DIR}
                            echo 'Pulling latest code from ${BRANCH_NAME}...'
                            git pull origin ${BRANCH_NAME}
                            
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
                
                // --- Slack: Success Notification (Commented out) ---
                // Purpose:
                // - Sends a Slack message when the pipeline completes successfully.
                // - Useful for keeping the team informed that deployment is live for a given branch.
                //
                // Requirements:
                // - SLACK_WEBHOOK must be enabled above in `environment` (uncomment and ensure the Jenkins credential exists).
                //
                // Message Includes:
                // - Project type (vue/nextjs/laravel)
                // - Branch name (test/development/stage)
                // - Final status (Live)
                //
                // Note:
                // - Kept disabled to avoid accidental notifications while testing/iterating.
                /*
                sh """
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
                
                // --- Slack: Failure Notification (Commented out) ---
                // Purpose:
                // - Sends a Slack message when the pipeline fails so issues are visible immediately.
                //
                // Requirements:
                // - SLACK_WEBHOOK must be enabled above in `environment` (uncomment and ensure the Jenkins credential exists).
                //
                // Message Includes:
                // - Project type and branch
                // - The stage where failure occurred (CURRENT_STAGE) to speed up debugging
                // - A hint to check Jenkins Console Logs for the root cause
                //
                // Note:
                // - Kept disabled to avoid noise while validating the pipeline and credentials.
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
