pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        DEPLOY_HOST = '172.31.77.148'
        DEPLOY_USER = 'ubuntu'
        BUILD_DIR   = '/home/ubuntu/build-staging'
        SLACK_URL   = 'https://hooks.slack.com/services/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'

        // -----------------------------------------------------
        // CHANGE THIS PER REPO: 'laravel', 'vue', or 'nextjs'
        // -----------------------------------------------------
        PROJECT_TYPE = 'vue'
    }

    stages {
        stage('Build') {
            steps {
                sshagent(['deploy-server-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            set -e
                            
                            # 1. IDENTIFY REPO URL
                            case \\"${PROJECT_TYPE}\\" in
                                laravel) REPO_URL='https://github.com/Jawadaziz78/django-project.git' ;;
                                vue)     REPO_URL='https://github.com/Jawadaziz78/vue-project.git' ;;
                                nextjs)  REPO_URL='https://github.com/Jawadaziz78/nextjs-project.git' ;;
                                *)       echo '❌ Error: Unknown Project Type'; exit 1 ;;
                            esac

                            echo '-----------------------------------'
                            echo '🚀 STAGE 1: BUILD (Cloning Code)'
                            echo '-----------------------------------'

                            # 2. PREPARE STAGING DIRECTORY
                            sudo rm -rf ${BUILD_DIR}
                            mkdir -p ${BUILD_DIR}
                            
                            # 3. CLONE CODE
                            git clone \\$REPO_URL ${BUILD_DIR}
                            cd ${BUILD_DIR}
                            git checkout ${BRANCH_NAME:-main}
                            
                            echo '✅ Build/Clone Successful'
                        "
                    '''
                }
            }
        }

        stage('Test') {
            steps {
                // Empty Stage as requested
                echo '⚠️ Test Stage is currently empty.'
            }
        }

        stage('Deploy') {
            steps {
                sshagent(['deploy-server-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            set -e
                            
                            # 1. IDENTIFY LIVE DIRECTORY
                            case \\"${PROJECT_TYPE}\\" in
                                laravel) LIVE_DIR='/home/ubuntu/projects/laravel/BookStack' ;; # FIXED PATH
                                vue)     LIVE_DIR='/home/ubuntu/projects/vue/app' ;;
                                nextjs)  LIVE_DIR='/home/ubuntu/projects/nextjs/blog' ;;
                            esac

                            echo '-----------------------------------'
                            echo '🚀 STAGE 3: DEPLOY (Rsync & Config)'
                            echo '📂 Target: '$LIVE_DIR
                            echo '-----------------------------------'

                            # 2. RSYNC TO LIVE (Preserve .env and vendor)
                            mkdir -p \\$LIVE_DIR
                            rsync -av --delete --exclude='.env' --exclude='.git' --exclude='storage' --exclude='public/storage' --exclude='node_modules' --exclude='vendor' --exclude='public/dist' ${BUILD_DIR}/ \\$LIVE_DIR/

                            # 3. RUN POST-DEPLOY COMMANDS
                            cd \\$LIVE_DIR

                            # Load Node 20 (Required for Vue/Next.js)
                            export NVM_DIR=\\"\\$HOME/.nvm\\"
                            [ -s \\"\\$NVM_DIR/nvm.sh\\" ] && . \\"\\$NVM_DIR/nvm.sh\\"
                            nvm use 20

                            case \\"${PROJECT_TYPE}\\" in
                                laravel)
                                    echo '⚙️ Running Laravel Tasks...'
                                    # Clear cache to fix 'Access Denied' errors
                                    php artisan config:clear
                                    php artisan cache:clear
                                    
                                    php artisan migrate --force
                                    php artisan config:cache
                                    php artisan route:cache
                                    php artisan view:cache
                                    sudo systemctl reload nginx
                                    ;;
                                
                                vue)
                                    echo '⚙️ Building Vue (using existing node_modules)...'
                                    npm run build
                                    sudo systemctl reload nginx
                                    ;;
                                
                                nextjs)
                                    echo '⚙️ Building Next.js (using existing node_modules)...'
                                    cd web
                                    rm -rf .next
                                    npm run build
                                    pm2 restart all
                                    sudo systemctl reload nginx
                                    ;;
                            esac
                            
                            echo '✅ DEPLOYMENT SUCCESSFUL'
                        "
                    '''
                }
            }
        }
    }

    post {
        success {
            sh "curl -X POST -H 'Content-type: application/json' --data '{\"text\":\"✅ Deployment SUCCESS: ${env.JOB_NAME} (Build #${env.BUILD_NUMBER})\"}' ${SLACK_URL}"
        }
        failure {
            sh "curl -X POST -H 'Content-type: application/json' --data '{\"text\":\"❌ Deployment FAILED: ${env.JOB_NAME} (Build #${env.BUILD_NUMBER})\"}' ${SLACK_URL}"
        }
    }
}
