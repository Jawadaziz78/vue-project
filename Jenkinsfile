pipeline {
    agent any
    triggers { githubPush() }
    
    environment {
        PROJECT_TYPE  = 'vue'
        DEPLOY_HOST   = 'localhost'
        DEPLOY_USER   = 'ubuntu'
        GIT_CREDS     = credentials('github-https-creds') 
        CURRENT_STAGE = 'Initialization' 
        // SLACK_WEBHOOK = credentials('slack-webhook-url')
    }
    
    stages {
        stage('SonarQube Analysis') {
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
                        error "❌ Quality Gate Failed"
                    }
                    env.LIVE_DIR = "/var/www/html/${env.BRANCH_NAME}/${env.PROJECT_TYPE}-project"
                }
                
                sshagent(['deploy-server-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            set -e
                            echo '--- 🚀 Starting Deployment for ${BRANCH_NAME} ---'
                            
                            # 1. Self-Healing & Self-Cleaning Logic
                            if [ ! -d \\"${LIVE_DIR}/.git\\" ]; then
                                sudo mkdir -p $(dirname ${LIVE_DIR})
                                sudo git clone -b ${BRANCH_NAME} https://${GIT_CREDS_USR}:${GIT_CREDS_PSW}@github.com/Jawadaziz78/vue-project.git ${LIVE_DIR}
                            else
                                cd ${LIVE_DIR}
                                sudo git checkout . 
                                sudo git pull origin ${BRANCH_NAME}
                            fi

                            cd ${LIVE_DIR}

                            # 2. Automated pnpm Installation
                            if ! command -v pnpm &> /dev/null; then
                                sudo npm install -g pnpm
                            fi

                            # 3. FORCE CLEAN node_modules to fix Permission Denied permanently
                            echo '🧹 Cleaning existing node_modules to reset permissions...'
                            sudo rm -rf node_modules
                            sudo chown -R ubuntu:ubuntu .
                            
                            echo '📦 Performing fresh installation...'
                            pnpm install

                            # 4. Build Step with Vite Permission Fix
                            echo '🔓 Ensuring binaries are executable...'
                            sudo chmod -R +x node_modules/.bin

                            echo 'Building project...'
                            case \\"${PROJECT_TYPE}\\" in
                                vue)
                                    VITE_BASE_URL=\\"/${PROJECT_TYPE}/${BRANCH_NAME}/\\"
                                    pnpm run build ;;
                                nextjs)
                                    pnpm run build
                                    pm2 restart ${PROJECT_TYPE}-${BRANCH_NAME} ;;
                                laravel)
                                    sudo php artisan optimize ;;
                            esac

                            # 5. PERMANENT PERMISSION FIX FOR NGINX
                            echo '🔒 Applying Nginx web permissions...'
                            sudo chmod +x /var/www /var/www/html /var/www/html/${BRANCH_NAME}
                            sudo chown -R ubuntu:www-data ${LIVE_DIR}
                            sudo find ${LIVE_DIR} -type d -exec chmod 755 {} \\;
                            sudo find ${LIVE_DIR} -type f -exec chmod 644 {} \\;

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
                /* sh "curl -X POST -H 'Content-type: application/json' --data '{\"text\":\"✅ Deployment Successful\"}' ${SLACK_WEBHOOK}" */
            }
        }
        failure {
            script {
                echo "❌ Pipeline Failed"
                /* sh "curl -X POST -H 'Content-type: application/json' --data '{\"text\":\"❌ Failed at: ${env.CURRENT_STAGE}\"}' ${SLACK_WEBHOOK}" */
            }
        }
    }
}
