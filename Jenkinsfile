pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        DEPLOY_HOST     = '172.31.77.148'
        DEPLOY_USER     = 'ubuntu'
        
        // ⚠️ CRITICAL: CHANGE THIS VARIABLE FOR EACH REPO
        // Options: 'laravel', 'vue', 'nextjs'
        PROJECT_TYPE    = 'nextjs' 
        
        // SLACK CONFIGURATION (Commented Out)
        // SLACK_PART_A  = 'https://hooks.slack.com/services/'
        // SLACK_PART_B  = 'T01KC5SLA49/B0A284K2S6T/'
        // SLACK_PART_C  = 'JRJsWNSYnh2tujdMo4ph0Tgp'
    }

    stages {
        
        stage('Build') {
            steps {
                script {
                     def buildPaths = [
                        'laravel': '/home/ubuntu/build-staging',
                        'vue':     '/home/ubuntu/build-staging-vue',
                        'nextjs':  '/home/ubuntu/build-staging-nextjs'
                     ]
                     env.BUILD_DIR = buildPaths[env.PROJECT_TYPE]
                }

                sshagent(['deploy-server-key']) {
                    sh '''
                    ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                        set -e

                        cd ${BUILD_DIR}
                        
                        git fetch origin ${BRANCH_NAME:-main}
                        git reset --hard origin/${BRANCH_NAME:-main}
                        git checkout ${BRANCH_NAME:-main} 

                        case \\"${PROJECT_TYPE}\\" in
                            laravel)
                                if [ ! -f .env ]; then cp .env.example .env; fi
                                echo 'Running Laravel Optimization Tasks...'
                                php artisan key:generate --force
                                php artisan config:cache
                                php artisan route:cache
                                php artisan view:cache
                                ;;
                            
                            vue)
                                echo '⚙️ Vue code updated. Skipping build/install.'
                                ;;
                            
                            nextjs)
                                echo '⚙️ Next.js code updated. Skipping build/install.'
                                ;;
                        esac
                        
                        echo '✅ Build/Update Successful'
                    "
                    '''
                }
            }
        }

        // Stage 2: Test (Commented Out)
        // stage('Test') {
        //     steps {
        //         sshagent(['deploy-server-key']) {
        //             sh '''
        //             ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
        //                 set -e
        //                 cd ${BUILD_DIR}
        //                 export NVM_DIR=\\"\\$HOME/.nvm\\" 
        //                 [ -s \\"\\$NVM_DIR/nvm.sh\\" ] && . \\"\\$NVM_DIR/nvm.sh\\" 
        //                 nvm use 20
        //                 case \\"${PROJECT_TYPE}\\" in
        //                     laravel)
        //                         export DB_CONNECTION=sqlite
        //                         export DB_DATABASE=:memory:
        //                         php ./vendor/bin/phpunit --testsuite Unit
        //                         ;;
        //                     vue)
        //                         npm install -g pnpm
        //                         pnpm install
        //                         pnpm run test:unit
        //                         ;;
        //                     nextjs)
        //                         cd web
        //                         npm run test
        //                         ;;
        //                 esac
        //             "
        //             '''
        //         }
        //     }
        // }

        stage('Deploy') {
            steps {
                script {
                    def projectDirs = [
                        'laravel': '/home/ubuntu/projects/laravel/BookStack',
                        'vue':     '/home/ubuntu/projects/vue/app',
                        'nextjs':  '/home/ubuntu/projects/nextjs/blog'
                    ]
                    env.LIVE_DIR = projectDirs[env.PROJECT_TYPE]
                }

                sshagent(['deploy-server-key']) {
                    sh '''
                    ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                        set -e
                        
                        # RSYNC TO LIVE 
                        mkdir -p ${LIVE_DIR}
                        rsync -av --delete --exclude='.env' --exclude='.git' --exclude='bootstrap/cache/*.php' --exclude='storage' --exclude='public/storage' --exclude='node_modules' --exclude='vendor' --exclude='public/dist' ${BUILD_DIR}/ ${LIVE_DIR}/

                        # RUN POST-DEPLOY COMMANDS
                        cd ${LIVE_DIR}

                        # Load Node 20
                        export NVM_DIR='/home/ubuntu/.nvm'
                        [ -s \"/home/ubuntu/.nvm/nvm.sh\" ] && . \"/home/ubuntu/.nvm/nvm.sh\"
                        nvm use 20

                        case \\"${PROJECT_TYPE}\\" in
                            laravel)
                                echo '⚙️ Running Compulsory Laravel Tasks...'
                                rm -f bootstrap/cache/*.php
                                php artisan migrate --force
                                php artisan config:cache
                                sudo systemctl reload nginx
                                ;;
                            
                            vue)
                                echo '⚙️ Building Vue (Using PNPM)...'
                                
                                # FIX: Install pnpm specifically for Vue
                                npm install -g pnpm
                                
                                # Use pnpm instead of npm
                                pnpm install
                                pnpm run build
                                
                                echo 'Reloading Nginx...'
                                sudo systemctl reload nginx
                                ;;
                            
                            nextjs)
                                echo 'Rebuilding Next.js...'
                                
                                # !!! IMPORTANT: If your package.json is in the root, REMOVE 'cd web' below !!!
                                cd web
                                
                                npm install
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
            echo "Pipeline succeeded. (Slack notification is commented out)"
            // sh "curl -X POST -H 'Content-type: application/json' --data '{\"text\":\"Jawad Deployment SUCCESS: ${env.JOB_NAME} (Build #${env.BUILD_NUMBER})\"}' ${SLACK_PART_A}${SLACK_PART_B}${SLACK_PART_C}"
        }
        failure {
            echo "Pipeline failed. (Slack notification is commented out)"
            // sh "curl -X POST -H 'Content-type: application/json' --data '{\"text\":\"Jawad Deployment FAILED: ${env.JOB_NAME} (Build #${env.BUILD_NUMBER})\"}' ${SLACK_PART_A}${SLACK_PART_B}${SLACK_PART_C}"
        }
    }
}
