pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        DEPLOY_HOST = '172.31.77.148'
        DEPLOY_USER = 'ubuntu'
        
        // -----------------------------------------------------
        // CHANGE THIS VALUE PER REPO: 'laravel', 'vue', or 'nextjs'
        // -----------------------------------------------------
        PROJECT_TYPE = 'vue'
    }

    stages {
        stage('Build') {
            steps {
                sshagent(['deploy-server-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            # Force Load NVM (Node 20)
                            export NVM_DIR="\\$HOME/.nvm"
                            [ -s "\\$NVM_DIR/nvm.sh" ] && . "\\$NVM_DIR/nvm.sh"
                            nvm use 20

                            set -e
                            echo '-----------------------------------'
                            echo '🚀 STARTING BUILD FOR: ${PROJECT_TYPE}'
                            echo '-----------------------------------'
                            
                            case \\"${PROJECT_TYPE}\\" in
                                laravel)
                                    cd /home/ubuntu/projects/laravel
                                    git remote set-url origin https://github.com/Jawadaziz78/django-project.git
                                    git fetch origin
                                    git reset --hard origin/${BRANCH_NAME:-main}
                                    
                                    # Clear cache to ensure clean build
                                    php artisan optimize:clear
                                    ;;
                                
                                vue)
                                    cd /home/ubuntu/projects/vue/app
                                    git remote set-url origin https://github.com/Jawadaziz78/vue-project.git
                                    git fetch origin
                                    git reset --hard origin/${BRANCH_NAME:-main}
                                    
                                    # Build assets (No Install)
                                    echo '⚙️ Building Vue...'
                                    npm run build
                                    ;;
                                
                                nextjs)
                                    cd /home/ubuntu/projects/nextjs/blog
                                    git remote set-url origin https://github.com/Jawadaziz78/nextjs-project.git
                                    git fetch origin
                                    git reset --hard origin/${BRANCH_NAME:-main}
                                    
                                    cd web
                                    # Build assets (No Install)
                                    echo '⚙️ Building Next.js...'
                                    npm run build
                                    ;;
                                
                                *)
                                    exit 1
                                    ;;
                            esac
                        "
                    '''
                }
            }
        }

        stage('Test') {
            steps {
                echo 'Test Stage is currently empty.'
            }
        }

        stage('Deploy') {
            steps {
                sshagent(['deploy-server-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            set -e
                            echo '-----------------------------------'
                            echo '🚀 STARTING DEPLOY FOR: ${PROJECT_TYPE}'
                            echo '-----------------------------------'

                            case \\"${PROJECT_TYPE}\\" in
                                laravel)
                                    cd /home/ubuntu/projects/laravel
                                    
                                    echo '⚙️ Running Laravel Deployment Tasks...'
                                    php artisan migrate --force
                                    php artisan config:cache
                                    php artisan route:cache
                                    php artisan view:cache
                                    
                                    echo '🔄 Reloading Nginx...'
                                    sudo systemctl reload nginx
                                    ;;
                                
                                vue)
                                    echo '🔄 Reloading Nginx...'
                                    sudo systemctl reload nginx
                                    ;;
                                
                                nextjs)
                                    echo '🔄 Restarting PM2 processes...'
                                    # RESTART PM2 (Confirmed you are using it)
                                    pm2 restart all
                                    
                                    echo '🔄 Reloading Nginx...'
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
}
