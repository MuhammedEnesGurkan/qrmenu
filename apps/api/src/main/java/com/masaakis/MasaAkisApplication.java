package com.masaakis;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MasaAkisApplication {
    public static void main(String[] args) {
        SpringApplication.run(MasaAkisApplication.class, args);
    }
}
