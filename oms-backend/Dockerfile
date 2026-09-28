# Build stage
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app

COPY oms-backend/pom.xml oms-backend/pom.xml
COPY oms-backend/src oms-backend/src
RUN cd oms-backend && mvn package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN apk add --no-cache wget \
    && mkdir -p /app/uploads /app/tiles/Saudi_tiles /app/tiles/tiles /app/tiles/india_tiles

COPY --from=build /app/oms-backend/target/oms-backend.war /app/app.war

ENV SPRING_PROFILES_ACTIVE=docker
ENV SERVER_PORT=6065
ENV JAVA_OPTS="-Xms256m -Xmx512m"

EXPOSE 6065

HEALTHCHECK --interval=15s --timeout=10s --retries=10 --start-period=90s \
  CMD wget -qO- http://127.0.0.1:6065/oms-backend/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.war"]
