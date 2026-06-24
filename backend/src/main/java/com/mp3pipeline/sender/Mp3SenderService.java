package com.mp3pipeline.sender;

import com.mp3pipeline.cleaner.Mp3CleanerService;
import com.mp3pipeline.config.PipelineProperties;
import com.mp3pipeline.config.RabbitMQConfig;
import com.mp3pipeline.messaging.Mp3MetadataMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * ══════════════════════════════════════════════════════
 * PROGRAMME 3 — Sender
 * ══════════════════════════════════════════════════════
 */
@Service
public class Mp3SenderService {

    private static final Logger log = LoggerFactory.getLogger(Mp3SenderService.class);
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // Chemin absolu de destination dans le dossier public/src du frontend React
    private static final String FRONTEND_DIR = "D:\\Ambinintsoa\\ITU\\Mr_Naina\\My_Spotify_S6\\frontend\\src\\mp3-uploaded";

    private final PipelineProperties props;
    private final RestTemplate restTemplate;
    private final Mp3CleanerService cleaner;

    public Mp3SenderService(PipelineProperties props,
            RestTemplate restTemplate,
            Mp3CleanerService cleaner) {
        this.props = props;
        this.restTemplate = restTemplate;
        this.cleaner = cleaner;
    }

    /**
     * Listener RabbitMQ : un message = un fichier prêt à être envoyé.
     */
    @RabbitListener(queues = RabbitMQConfig.QUEUE_EXTRACTOR_TO_SENDER)
    public void onMetadataReceived(Mp3MetadataMessage message) {
        String now = LocalDateTime.now().format(FMT);
        log.info("[SENDER] [{}] Message reçu — envoi en cours : {}",
                now, message.getFileName());

        boolean success = sendToApi(message);

        now = LocalDateTime.now().format(FMT);
        if (success) {
            log.info("[SENDER] [{}] Envoi réussi : {}", now, message.getFileName());

            // ── ÉTAPE INTERMÉDIAIRE : Copie vers le frontend avant suppression ──
            boolean copied = copyToFrontend(message.getFilePath(), message.getFileName());

            if (copied) {
                // Si la copie a fonctionné, on peut nettoyer la boîte de réception (inbox) du
                // backend
                cleaner.deleteFile(message.getFilePath(), message.getFileName());
            } else {
                log.warn("[SENDER] [{}] Abandon de la suppression car la copie vers le frontend a échoué : {}",
                        now, message.getFileName());
            }
        } else {
            log.warn("[SENDER] [{}] Envoi échoué, fichier conservé : {}",
                    now, message.getFileName());
        }
    }

    /**
     * Copie le fichier MP3 traité vers le répertoire source du Frontend React.
     */
    private boolean copyToFrontend(String sourceFilePath, String fileName) {
        String now = LocalDateTime.now().format(FMT);

        Path source = Paths.get(sourceFilePath);
        Path targetDir = Paths.get(FRONTEND_DIR);
        Path targetFile = targetDir.resolve(fileName);

        try {
            // Créer les répertoires parents du frontend s'ils n'existent pas encore
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
                log.info("[SENDER] [{}] Création du répertoire destination frontend : {}", now, FRONTEND_DIR);
            }

            log.info("[SENDER] [{}] Copie du fichier vers le frontend en cours... -> {}", now, targetFile.toString());

            // Copie avec écrasement si le fichier existe déjà
            // (StandardCopyOption.REPLACE_EXISTING)
            Files.copy(source, targetFile, StandardCopyOption.REPLACE_EXISTING);

            log.info("[SENDER] [{}] Fichier copié avec succès vers le frontend : {}", now, fileName);
            return true;

        } catch (IOException e) {
            log.error("[SENDER] [{}] Échec de la copie vers le frontend pour '{}' : {}",
                    now, fileName, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Envoie le fichier .mp3 + ses métadonnées à l'API en multipart/form-data.
     */
    private boolean sendToApi(Mp3MetadataMessage message) {
        String now = LocalDateTime.now().format(FMT);
        String apiUrl = props.getApiUrl();

        File file = new File(message.getFilePath());
        if (!file.exists()) {
            log.error("[SENDER] [{}] Fichier introuvable avant envoi : {}",
                    now, message.getFilePath());
            return false;
        }

        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new FileSystemResource(file));
            body.add("fileName", message.getFileName());
            body.add("filePath", message.getFilePath());

            if (message.getMetadata() != null) {
                message.getMetadata().forEach(body::add);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            log.info("[SENDER] [{}] Envoi HTTP vers {} — fichier : {}",
                    now, apiUrl, message.getFileName());

            ResponseEntity<String> response = restTemplate.exchange(apiUrl, HttpMethod.POST, requestEntity,
                    String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("[SENDER] [{}] Réponse API {} pour : {}",
                        now, response.getStatusCode().value(), message.getFileName());
                return true;
            } else {
                log.warn("[SENDER] [{}] Réponse API non-2xx ({}) pour : {}",
                        now, response.getStatusCode().value(), message.getFileName());
                return false;
            }

        } catch (Exception e) {
            log.error("[SENDER] [{}] Exception lors de l'envoi de '{}' vers {} : {}",
                    now, message.getFileName(), apiUrl, e.getMessage(), e);
            return false;
        }
    }
}