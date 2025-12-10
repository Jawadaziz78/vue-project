pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        DEPLOY_HOST = '172.31.77.148'
        DEPLOY_USER = 'ubuntu'
        PROJECT_TYPE = 'vue'
    }

    stages {
        stage('Build') {
            steps {
                sshagent(['deploy-server-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            # 1. FORCE LOAD NVM (Node 20)
                            export NVM_DIR="\\$HOME/.nvm"
                            [ -s "\\$NVM_DIR/nvm.sh" ] && . "\\$NVM_DIR/nvm.sh"
                            nvm use 20

                            set -e
                            echo '-----------------------------------'
                            echo '🚀 DEPLOYING: ${PROJECT_TYPE}'
                            echo '-----------------------------------'

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
                                    
                                    echo '⚙️ Setup pnpm...'
                                    # Install pnpm globaly using the active Node version
                                    npm install -g pnpm
                                    
                                    echo '⚙️ Running Vue Build (via pnpm)...'
                                    pnpm install
                                    pnpm run build
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
