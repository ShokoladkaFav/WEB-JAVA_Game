# Етап 1: Збірка Java-проєкту з Maven
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
COPY ./backend ./backend
WORKDIR /app/backend
RUN mvn clean package -DskipTests

# Етап 2: Запуск зібраного .jar файлу
FROM openjdk:17-jdk-slim
COPY --from=build /app/backend/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
