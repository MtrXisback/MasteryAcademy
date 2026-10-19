# Stage 1: Build the application
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Build the application skipping tests for faster deployment
RUN mvn clean package -DskipTests

# Stage 2: Create the production image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
# Fuentes necesarias para que Apache POI calcule el ancho de columnas en los reportes Excel
RUN apk add --no-cache fontconfig ttf-dejavu
# Copy the compiled jar from the builder stage
COPY --from=builder /app/target/*.jar app.jar
# Expose the application port
EXPOSE 8080
# Run the application
ENTRYPOINT ["java", "-Djava.awt.headless=true", "-jar", "app.jar"]
