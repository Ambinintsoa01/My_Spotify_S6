package com.mp3pipeline;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class Mp3PipelineApplication {

    public static void main(String[] args) {
        SpringApplication.run(Mp3PipelineApplication.class, args);
    }
}
