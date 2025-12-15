pipeline {
    agent any
    triggers { githubPush() }
    
    environment {
        PROJECT_TYPE = 'vue'
        DEPLOY_HOST  = '172.31.77.148'
        DEPLOY_USER  = 'ubuntu'
        BRANCH_NAME  = 'development'
    }

    stages {
        stage('Build') {
            steps {
                script {
                    if (env.PROJECT_TYPE == 'vue') {
                        env.LIVE_DIR = '/var/www/html/development/vue-project'
                    } else if (env.PROJECT_TYPE == 'nextjs') {
                        env.LIVE_DIR = '/var/www/html/development/nextjs-project/web'
                    }
                }

                sshagent(['deploy-server-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            set -e
                            cd ${LIVE_DIR}
                            
                            git fetch origin
                            git reset --hard origin/${BRANCH_NAME}

                            export NVM_DIR=\\"\\$HOME/.nvm\\"
                            [ -s \\"\\$NVM_DIR/nvm.sh\\" ] && . \\"\\$NVM_DIR/nvm.sh\\"
                            nvm use 20

                            case \\"${PROJECT_TYPE}\\" in
                                vue)
                                    npm run build
                                    ;;
                                nextjs)
                                    npx env-cmd -f .env.development next build
                                    ;;
                            esac
                        "
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                sshagent(['deploy-server-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            set -e
                            sudo systemctl reload nginx
                        "
                    '''
                }
            }
        }
    }
}
