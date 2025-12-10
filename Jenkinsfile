pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        DEPLOY_HOST = '172.31.77.148'
        DEPLOY_USER = 'ubuntu'
        
        // This variable controls which build logic runs
        PROJECT_TYPE = 'vue'
    }

    stages {
        stage('Build') {
            steps {
                sshagent(['deploy-server-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            # -------------------------------------------------------
                            # 1. FORCE LOAD NVM (To detect Node 20 correctly)
                            # -------------------------------------------------------
                            export NVM_DIR="\\$HOME/.nvm"
                            [ -s "\\$NVM_DIR/nvm.sh" ] && . "\\$NVM_DIR/nvm.sh"
                            nvm use 20

                            # Stop script on any error
                            set -e
                            
                            echo '-----------------------------------'
                            echo '🚀 DEPLOYING: ${PROJECT_TYPE}'
                            echo "✅ Node Version: \$(node -v)"
                            echo '-----------------------------------'

                            # -------------------------------------------------------
                            # 2. SWITCH LOGIC BASED ON PROJECT TYPE
                            # -------------------------------------------------------
                            case \\"${PROJECT_TYPE}\\" in
                                laravel)
                                    cd /home/ubuntu/projects/laravel
                                    git remote set-url origin https://github.com/Jawadaziz78/django-project.git
                                    git fetch origin
                                    git reset --hard origin/${BRANCH_NAME:-main}
                                    
                                    echo '⚙️ Running Laravel Build...'
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
                                    
                                    echo '⚙️ Running Vue Build...'
                                    # Install dependencies first (just in case)
                                    npm install
                                    npm run build
                                    ;;
                                
                                nextjs)
                                    cd /home/ubuntu/projects/nextjs/blog
                                    git remote set-url origin https://github.com/Jawadaziz78/nextjs-project.git
                                    git fetch origin
                                    git reset --hard origin/${BRANCH_NAME:-main}
                                    
                                    echo '⚙️ Running Next.js Build...'
                                    cd web
                                    npm install
                                    npm run build
                                    ;;
                                
                                *)
                                    echo '❌ Error: Unknown PROJECT_TYPE'
                                    exit 1
                                    ;;
                            esac
                            
                            echo '✅ SUCCESS'
                        "
                    '''
                }
            }
        }
    }
}
