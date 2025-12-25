pipeline {
    agent any
    
    // Automatically triggers build when code is pushed to GitHub
    triggers { githubPush() }
    
    environment {
        PROJECT_TYPE  = 'vue' // Change to 'nextjs' or 'laravel' as needed per project
        DEPLOY_HOST   = 'localhost'
        DEPLOY_USER   = 'ubuntu'
        
        // GitHub Credentials for automated cloning
        GIT_CREDS     = credentials('github-https-creds') 
        
        // Tracking current stage for notifications
        CURRENT_STAGE = 'Initialization' 
    }
    
    stages {
        stage('SonarQube Analysis') {
            // SonarQube runs only on the test branch to match your GHA workflow
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
                        // Aborts if Quality Gate is not 'OK'
                        env.QUALITY_GATE_STATUS = waitForQualityGate(abortPipeline: true).status
                    }
                }
            }
        }

        stage('Build and Deploy') {
            steps {
                script {
                    env.CURRENT_STAGE = 'Build and Deploy'
                    
                    // Safety: Skip Quality Gate check for development and stage branches
                    if (env.BRANCH_NAME == 'test') {
                        if (env.QUALITY_GATE_STATUS != 'OK') {
                            error "❌ BLOCKING DEPLOYMENT: Quality Gate status is '${env.QUALITY_GATE_STATUS}'"
                        }
                    }

                    env.LIVE_DIR = "/var/www/html/${env.BRANCH_NAME}/${env.PROJECT_TYPE}-project"
                }
                
                sshagent(['deploy-server-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            set -e
                            echo '--- 🚀 Starting Deployment for ${BRANCH_NAME} ---'
                            
                            # 1. Self-Cleaning Code Sync
                            if [ ! -d \\"${LIVE_DIR}/.git\\" ]; then
                                sudo mkdir -p /var/www/html/${BRANCH_NAME}
                                sudo git clone -b ${BRANCH_NAME} https://${GIT_CREDS_USR}:${GIT_CREDS_PSW}@github.com/Jawadaziz78/vue-project.git ${LIVE_DIR}
                            else
                                cd ${LIVE_DIR}
                                # Cleans local modifications to prevent merge conflicts
                                sudo git checkout . 
                                sudo git pull origin ${BRANCH_NAME}
                            fi

                            cd ${LIVE_DIR}

                            # 2. Automated pnpm Setup
                            if ! command -v pnpm &> /dev/null; then
                                sudo npm install -g pnpm
                            fi

                            # 3. Security Bypass & Ownership Fix
                            echo '🧹 Deep cleaning node_modules and fixing ownership...'
                            sudo rm -rf node_modules
                            sudo chown -R ubuntu:ubuntu .

                            # Disable scripts to prevent pnpm v10 EACCES crash during install
                            pnpm config set ignore-scripts true
                            
                            echo '📦 Installing dependencies...'
                            if [ \\"${PROJECT_TYPE}\\" = \\"laravel\\" ]; then
                                composer install --no-interaction --prefer-dist --optimize-autoloader
                            else
                                pnpm install
                                
                                # 4. Grant execution rights to hidden binaries
                                echo '🔓 Granting binary execution rights...'
                                sudo find node_modules/.pnpm -name \\"esbuild\\" -exec chmod +x {} +
                                sudo chmod -R +x node_modules/.bin
                                
                                # Restore scripts and rebuild native modules
                                pnpm config set ignore-scripts false
                                pnpm rebuild esbuild
                            fi

                            # 5. Dynamic .env Generation & Build
                            # This ensures the correct subfolder routing for each branch
                            echo '🏗️ Building ${PROJECT_TYPE} project...'
                            echo \\"VITE_BASE_URL=/vue/${BRANCH_NAME}/\\" > .env
                            
                            case \\"${PROJECT_TYPE}\\" in
                                vue)
                                    VITE_BASE_URL=\\"/vue/${BRANCH_NAME}/\\" pnpm run build ;;
                                nextjs)
                                    pnpm run build
                                    pm2 restart ${PROJECT_TYPE}-${BRANCH_NAME} || pm2 start pnpm --name ${PROJECT_TYPE}-${BRANCH_NAME} -- start ;;
                                laravel)
                                    php artisan migrate --force
                                    php artisan optimize ;;
                            esac

                            # 6. PERMANENT PERMISSION FIX FOR NGINX
                            # Resolves 500 Internal Server Errors and Blank Screens
                            echo '🔒 Applying deep web-server permissions...'
                            sudo chmod +x /var/www /var/www/html /var/www/html/${BRANCH_NAME}
                            sudo chown -R ubuntu:www-data ${LIVE_DIR}
                            sudo find ${LIVE_DIR} -type d -exec chmod 755 {} +
                            sudo find ${LIVE_DIR} -type f -exec chmod 644 {} +

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
