pipeline {
    agent any
    triggers {
        githubPush()
    }
    environment {
        PROJECT_TYPE = 'vue'
        DEPLOY_HOST  = '172.31.77.148'
        DEPLOY_USER  = 'ubuntu'
        LIVE_DIR     = '/var/www/html/development/vue-project'
        BRANCH_NAME  = 'development'
    }

    stages {
        stage('Build') {
            steps {
                sshagent(['deploy-server-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            set -e
                            cd ${LIVE_DIR}
                            
                            # Update code (Resets to match GitHub exactly)
                            git fetch origin
                            git reset --hard origin/${BRANCH_NAME}

                            case \"${PROJECT_TYPE}\" in
                                vue)
                                    # Load Node 20
                                    export NVM_DIR=\\"\\$HOME/.nvm\\"
                                    [ -s \\"\\$NVM_DIR/nvm.sh\\" ] && . \\"\\$NVM_DIR/nvm.sh\\"
                                    nvm use 20
                                    
                                    # Build (No npm install)
                                    npm run build
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
                            
                            case \"${PROJECT_TYPE}\" in
                                vue)
                                    # Reload Nginx to serve new build
                                    sudo systemctl reload nginx
                                    ;;
                            esac
                        "
                    '''
                }
            }
        }
    }
}
