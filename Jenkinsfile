pipeline{
    agent any

    stages {
        stage("Build"){
            steps{
                slackSend channel: 'deployments', message: '[Reservon Accounts]: Starting build...'

                withCredentials([file(credentialsId: 'reservon-auth-web-env', variable: 'ENV_FILE')]) {
                    sh '''
                        mkdir -p temp_env
                        cp "$ENV_FILE" temp_env/.env
                        chmod 644 temp_env/.env
                        mv temp_env/.env .env
                        rm -rf temp_env
                        sed 's/ # .*$//' .env > .env.tmp && mv .env.tmp .env
                    '''
                }

                sh "docker stop reservon_accounts_app || true && docker rm -f reservon_accounts_app || true"
                sh "docker build -t reservon:accounts_app ."
                slackSend message: "[Reservon Accounts]: Build $BUILD_NUMBER succeeded", color: 'good'
            }
        }

        stage("Deploy"){
            steps{
                slackSend channel: 'deployments', message: '[Reservon Accounts]: Starting deployment...'
                // No --env-file: Vite inlined everything it needs at build time, and
                // nginx serves static files. Nothing here reads the environment.
                sh "docker run --name reservon_accounts_app -d -p 9100:9100 --restart unless-stopped reservon:accounts_app"
            }
        }
    }

    post {
        success {
            slackSend channel: 'deployments', message: "[Reservon Accounts]: Deployment $BUILD_NUMBER succeeded — https://accounts.reservonhq.com", color: 'good'
        }
        failure {
            slackSend channel: 'deployments', message: "[Reservon Accounts]: Build/deploy $BUILD_NUMBER FAILED", color: 'danger'
        }
    }
}
