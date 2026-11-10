pipeline {
    agent {
        label 'rootless-docker'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Frontend Lint and Build') {
            steps {
                sh '''
                    docker run --rm \
                      -v "$WORKSPACE/frontend:/app" \
                      -w /app \
                      node:22-alpine \
                      sh -c "npm ci && npm run lint && npm run build"
                '''
            }
        }

        stage('Backend Tests and Package') {
            steps {
                sh '''
                    docker run --rm \
                      -v "$WORKSPACE/backend:/app" \
                      -w /app \
                      maven:3.9-eclipse-temurin-21 \
                      mvn clean verify
                '''
            }
        }

        stage('Build Backend Docker Image') {
            steps {
                sh '''
                    docker build \
                      -t queueless-backend:latest \
                      ./backend
                '''
            }
        }
    }

    post {
        success {
            echo 'QueueLess CI pipeline completed successfully!'
        }

        failure {
            echo 'QueueLess CI pipeline failed. Check the stage logs.'
        }
    }
}
