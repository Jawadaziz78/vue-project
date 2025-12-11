pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        DEPLOY_HOST     = '172.31.77.148'
        DEPLOY_USER     = 'ubuntu'
        
        // NOTE: BUILD_DIR is handled automatically in the 'Build' stage based on PROJECT_TYPE.

        // CHANGE THIS variable for each project (laravel, vue, or nextjs)
        PROJECT_TYPE    = 'vue' 
        
        // SLACK CONFIGURATION (Commented Out)
        // SLACK_PART_A  = 'https://hooks.slack.com/services/'
        // SLACK_PART_B  = 'T01KC5SLA49/B0A284K2S6T/'
        // SLACK_PART_C  = 'JRJsWNSYnh2tujdMo4ph0Tgp'
    }

    stages {
        
        stage('Build') {
            steps {
                // FIX: Dynamically set the Build Directory based on Project Type
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

                        # We use the dynamic BUILD_DIR determined above
                        cd ${BUILD_DIR}
                        
                        # FIX: Replaced 'git pull' with fetch + reset --hard
                        # This prevents the 'divergent branches' error.
                        git fetch origin ${BRANCH_NAME:-main}
                        git reset --hard origin/${BRANCH_NAME:-main}
                        git checkout ${BRANCH_NAME:-main} 

                        case \\"${PROJECT_TYPE}\\" in
                            laravel)
                                # FIX: Copy .env if missing so artisan commands don't fail
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

        // Stage 2: Test (Execute unit tests based on project type)
        // stage('Test') {
        //     steps {
        //         sshagent(['deploy-server-key']) {
        //             sh '''
        //             ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
        //                 set -e
        //                 # Use the same dynamic build dir for testing
        //                 cd ${BUILD_DIR}
        //                 
        //                 echo '-----------------------------------'
        //                 echo '🧪 STAGE 2: TEST EXECUTION'
        //                 echo '-----------------------------------'
        //                 
        //                 # Load Node 20
        //                 export NVM_DIR=\\"\\$HOME/.nvm\\" 
        //                 [ -s \\"\\$NVM_DIR/nvm.sh\\" ] && . \\"\\$NVM_DIR/nvm.sh\\" 
        //                 nvm use 20
        //
        //                 # Execute tests based on PROJECT_TYPE
        //                 case \\"${PROJECT_TYPE}\\" in
        //                     laravel)
        //                         # Setup in-memory SQLite for testing
        //                         export DB_CONNECTION=sqlite
        //                         export DB_DATABASE=:memory:
        //                         
        //                         php ./vendor/bin/phpunit --testsuite Unit
        //                         ;;
        //                     
        //                     vue)
        //                         npm run test:unit
        //                         ;;
        //                     
        //                     nextjs)
        //                         cd web
        //                         npm run test
        //                         ;;
        //                     *)
        //                         echo '⚠️ Skipping tests for project type: ${PROJECT_TYPE}'
        //                         ;;
        //                 esac
        //
        //                 echo '✅ Tests Completed Successfully'
        //             "
        //             '''
        //         }
        //     }
        // }

        stage('Deploy') {
            steps {
                // FIX: Define LIVE_DIR in Groovy to prevent 'mkdir missing operand' error
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
                    # We use ${LIVE_DIR} directly now because Jenkins injects it safely
                    ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                        set -e
                        

                        # RSYNC TO LIVE 
                        # We exclude cache files so we don't copy the 'build' config to 'live'
                        mkdir -p ${LIVE_DIR}
                        rsync -av --delete --exclude='.env' --exclude='.git' --exclude='bootstrap/cache/*.php' --exclude='storage' --exclude='public/storage' --exclude='node_modules' --exclude='vendor' --exclude='public/dist' ${BUILD_DIR}/ ${LIVE_DIR}/

                        # RUN POST-DEPLOY COMMANDS
                        cd ${LIVE_DIR}

                        # Load Node 20
                        # FIX: Hardcoded path based on your diagnostic result
                        # This ensures the script loads successfully every time
                        export NVM_DIR='/home/ubuntu/.nvm'
                        [ -s \"/home/ubuntu/.nvm/nvm.sh\" ] && . \"/home/ubuntu/.nvm/nvm.sh\"
                        nvm use 20

                        # Run project-specific post-deploy tasks
                        case \\"${PROJECT_TYPE}\\" in
                            laravel)
                                echo '⚙️ Running Compulsory Laravel Tasks...'
                                
                                # 1. Force delete poisoned config cache (Critical Fix)
                                rm -f bootstrap/cache/*.php
                                
                                # 2. Update Database 
                                php artisan migrate --force
                                
                                # 3. Refresh Config Cache
                                php artisan config:cache
                                
                                # 4. Reload Server 
                                sudo systemctl reload nginx
                                ;;
                            
                            vue)
                                echo '⚙️ Building Vue...'
                                # We MUST build here because rsync deleted the old dist folder
                                npm install
                                npm run build
                                
                                echo 'Reloading Nginx...'
                                sudo systemctl reload nginx
                                ;;
                            
                            nextjs)
                                echo 'Rebuilding Next.js...'
                                
                                # !!! IMPORTANT: If your package.json is in the root, REMOVE 'cd web' below !!!
                                cd web
                                
                                # Added npm install to be safe
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
