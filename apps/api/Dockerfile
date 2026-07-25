FROM maven:3.9.11-eclipse-temurin-21-alpine AS build
WORKDIR /build
COPY apps/api/pom.xml .
RUN mvn -B -DskipTests dependency:go-offline
COPY apps/api/src src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S masaakis && adduser -S -G masaakis -u 10001 masaakis
WORKDIR /app
COPY --from=build --chown=masaakis:masaakis /build/target/masaakis-api-0.1.0-SNAPSHOT.jar app.jar
USER 10001
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:8080/actuator/health/liveness || exit 1
ENTRYPOINT ["java","-XX:MaxRAMPercentage=75","-Djava.security.egd=file:/dev/urandom","-jar","/app/app.jar"]
