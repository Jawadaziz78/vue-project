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
                            # 1. FORCE LOAD NVM (Node 20) for Vue/Next.js compatibility
                            export NVM_DIR="\\$HOME/.nvm"
                            [ -s "\\$NVM_DIR/nvm.sh" ] && . "\\$NVM_DIR/nvm.sh"
                            nvm use 20

                            set -e
                            
                            case \\"${PROJECT_TYPE}\\" in
                                laravel)
                                    cd /home/ubuntu/projects/laravel
                                    git remote set-url origin https://github.com/Jawadaziz78/django-project.git
                                    git fetch origin
                                    git reset --hard origin/${BRANCH_NAME:-main}
                                    
                                    php artisan optimize:clear
                                    php artisan config:cache
                                    php artisan route:cache
                                    php artisan view:cache
                                    ;;
                                
                                vue)
                                    cd /home/ubuntu/projects/vue/app
                                    git remote set-url origin https://github.com/Jawadaziz78/vue-project.git
                                    git fetch origin
                                    git reset --hard origin/${BRANCH_NAME:-main}
                                    
                                    # NO INSTALL - DIRECT BUILD
                                    npm run build
                                    ;;
                                
                                nextjs)
                                    cd /home/ubuntu/projects/nextjs/blog
                                    git remote set-url origin https://github.com/Jawadaziz78/nextjs-project.git
                                    git fetch origin
                                    git reset --hard origin/${BRANCH_NAME:-main}
                                    
                                    cd web
                                    
                                    # NO INSTALL - DIRECT BUILD
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
    }
}
